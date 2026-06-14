"""
Orders router — VULNERABILITY #2 & #3:
  - Business Logic Flaw: Frontend-controlled price/quantity (BASE) vs server-side validation (SECURE)
  - IDOR: Sequential integer IDs + no ownership check (BASE) vs UUID + ownership check + masking (SECURE)
"""

import uuid
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import is_secure
from app.models import Order, Product, PaymentMethod, User
from app.schemas import OrderCreate
from app.routers.auth import get_current_user
from app.security import mask_phone, mask_address, verify_order_hmac

router = APIRouter(prefix="/api/orders", tags=["Orders"])

# ── Audit Logger (SECURE MODE) ──────────────────────────────────────────
audit_logger = logging.getLogger("security_audit")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [SECURITY_AUDIT] %(message)s"
)

def _audit_log(event: str, user_id, detail: str):
    """SECURE Layer 4: Write structured audit log — feeds into SIEM in production."""
    audit_logger.warning(
        f"EVENT={event} | USER={user_id} | DETAIL={detail} | TIMESTAMP={datetime.now(timezone.utc).isoformat()}"
    )


@router.post("")
def create_order(
    data: OrderCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if is_secure():
        # SECURE Layer 4 (NEW): HMAC Request Integrity Check
        # Prevents MitM attackers from tampering with price/quantity in transit.
        # Client must sign the request body with a shared secret before sending.
        sig = request.headers.get("X-Signature", "")
        ts  = request.headers.get("X-Timestamp", "")
        body_dict = data.model_dump()

        if not sig or not ts:
            _audit_log(
                "HMAC_SIGNATURE_MISSING",
                current_user.id,
                "Order request missing X-Signature or X-Timestamp headers"
            )
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Missing request signature",
                    "reason": "X-Signature and X-Timestamp headers are required in secure mode",
                    "defense": "Layer 4: HMAC Integrity Check — every order must be signed to prevent tampering",
                }
            )

        if not verify_order_hmac(body_dict, ts, sig):
            _audit_log(
                "HMAC_SIGNATURE_INVALID",
                current_user.id,
                f"Order request signature mismatch — possible tampering detected"
            )
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "Invalid request signature",
                    "reason": "The order data was tampered with or signed with wrong key",
                    "defense": "Layer 4: HMAC-SHA256 Integrity Check — MitM cannot modify price/quantity without detection",
                    "attacker_tip": "Even if you intercept and change price: 0.01, the HMAC signature will no longer match → server rejects",
                }
            )

    total = 0.0
    items_detail = []

    for item in data.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")

        if is_secure():
            # SECURE: reject negative/zero quantity and ignore frontend price
            if item.quantity <= 0:
                raise HTTPException(status_code=400, detail="Quantity must be greater than 0")
            if product.stock < item.quantity:
                raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.name}")
            actual_price = product.price  # always from DB, never from frontend
        else:
            # BASE (VULNERABLE): trust frontend price and allow any quantity
            actual_price = item.price if item.price is not None else product.price

        subtotal = actual_price * item.quantity
        total += subtotal
        items_detail.append({
            "product_id": product.id,
            "name": product.name,
            "name_vi": product.name_vi,
            "price": actual_price,
            "quantity": item.quantity,
            "subtotal": subtotal,
        })
        # Reduce stock immediately; in BASE mode negative quantity could cause negative stock
        # but we cap at 0 to avoid data corruption (the price manipulation demo is the vulnerability, not stock)
        product.stock = max(0, product.stock - item.quantity)  # type: ignore

    payment_last_four = ""
    if data.payment_method_id:
        try:
            pm_uuid = uuid.UUID(data.payment_method_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid payment method ID format")

        pm = db.query(PaymentMethod).filter(PaymentMethod.id == pm_uuid).first()
        if pm:
            if is_secure():
                # SECURE Layer 4: Payment method ownership check
                # Ensure the payment method belongs to the requesting user
                if pm.user_id != current_user.id:
                    _audit_log(
                        "PAYMENT_METHOD_IDOR",
                        current_user.id,
                        f"Attempted to use payment method {pm_uuid} owned by another user"
                    )
                    raise HTTPException(
                        status_code=403,
                        detail={
                            "error": "Access denied",
                            "reason": "Payment method does not belong to you",
                            "defense": "Layer 4: Payment Ownership Check — prevents using another user's saved card",
                        }
                    )
            payment_last_four = pm.last_four

    # SECURE Layer 2 (extra): Order Total Cap — prevent economic DoS / massive fraud orders
    if is_secure():
        MAX_ORDER_TOTAL = 10000.0  # USD cap per single order
        if total > MAX_ORDER_TOTAL:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Order total exceeds allowed limit",
                    "reason": f"Single order cannot exceed ${MAX_ORDER_TOTAL:,.2f}",
                    "calculated_total": f"${total:,.2f}",
                    "defense": "Layer 2: Business Logic Cap — prevents massive fraud or economic DoS attacks",
                }
            )

    order = Order(
        user_id=current_user.id,
        items=items_detail,
        total=total,
        payment_last_four=payment_last_four,
        shipping_address=data.shipping_address,
        shipping_phone=data.shipping_phone,
        status="confirmed",
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    return {
        "message": "Order created successfully",
        "order_id": order.id,
        "order_uuid": str(order.order_uuid),
        "total": total,
    }



@router.get("")
def list_my_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    orders = db.query(Order).filter(
        Order.user_id == current_user.id
    ).order_by(Order.created_at.desc()).all()
    return {"orders": [_order_to_dict(o) for o in orders]}


@router.get("/{order_id}")
def get_order(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    BASE MODE:  Integer ID, no ownership check — any user can view any order.
    SECURE MODE: UUID access + ownership check + data masking.
    """
    if is_secure():
        try:
            order_uuid = uuid.UUID(order_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid order ID format. Use UUID.")

        order = db.query(Order).filter(Order.order_uuid == order_uuid).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        if order.user_id != current_user.id and current_user.role != "admin":
            _audit_log(
                "IDOR_ORDER_ACCESS_BLOCKED",
                current_user.id,
                f"Attempted to access order {order_uuid} owned by user {order.user_id}"
            )
            raise HTTPException(status_code=403, detail="Access denied: This order does not belong to you")

        return {
            "order": _order_to_dict_masked(order),
            "mode": "secure",
            "defense": [
                "Layer 1: UUID-based access (unpredictable IDs)",
                "Layer 2: Ownership verification (user_id check)",
                "Layer 3: Data masking (sensitive fields redacted)",
                "Layer 4: Audit logging (IDOR attempts recorded for SIEM)",
            ]
        }
    else:
        try:
            oid = int(order_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid order ID")

        order = db.query(Order).filter(Order.id == oid).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        # No ownership check — any authenticated user can view any order by guessing the ID
        return {
            "order": _order_to_dict(order),
            "mode": "base",
            "warning": "⚠️ No ownership check — any authenticated user can view this order by changing the ID!",
            "owner_email": order.user.email if order.user else "unknown",
        }


@router.get("/{order_id}/payment-info")
def get_order_payment_info(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    IDOR ESCALATION: Full Credit Card Exposure.
    BASE MODE:  Sequential ID, no ownership check → full card number in plaintext.
    SECURE MODE: UUID + ownership check → only masked card info.
    """
    if is_secure():
        try:
            order_uuid = uuid.UUID(order_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid order ID format. Use UUID.")

        order = db.query(Order).filter(Order.order_uuid == order_uuid).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        if order.user_id != current_user.id and current_user.role != "admin":
            _audit_log(
                "IDOR_PAYMENT_INFO_BLOCKED",
                current_user.id,
                f"Attempted to access payment info of order {order_uuid} owned by user {order.user_id}"
            )
            raise HTTPException(status_code=403, detail="Access denied: This order does not belong to you")

        return {
            "order_id": str(order.order_uuid),
            "payment_info": {
                "card_display": f"****-****-****-{order.payment_last_four}",
                "card_holder": "(masked for security)",
            },
            "mode": "secure",
            "defense": [
                "UUID-based access (unpredictable IDs)",
                "Ownership verification (user_id == current_user.id)",
                "Data masking (only last 4 digits shown)",
            ]
        }
    else:
        try:
            oid = int(order_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid order ID")

        order = db.query(Order).filter(Order.id == oid).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        # No ownership check — full card number exposed
        card_info = {}
        if order.payment_last_four:
            pm = db.query(PaymentMethod).filter(
                PaymentMethod.user_id == order.user_id,
                PaymentMethod.last_four == order.payment_last_four
            ).first()
            if pm:
                card_info = {
                    "card_number_full": pm.card_number_plain or "(encrypted)",
                    "card_holder": pm.card_holder,
                    "expiry": pm.expiry,
                    "card_type": pm.card_type,
                    "last_four": pm.last_four,
                }

        return {
            "order_id": order.id,
            "status": order.status,
            "payment_info": card_info,
            "shipping_address": order.shipping_address,
            "shipping_phone": order.shipping_phone,
            "owner_email": order.user.email if order.user else "unknown",
            "mode": "base",
            "warning": "⚠️ CRITICAL: Full credit card number exposed! No ownership check!",
        }


def _order_to_dict(o: Order) -> dict:
    """Full order data (base mode — exposes everything)."""
    return {
        "id": o.id,
        "order_uuid": str(o.order_uuid),
        "items": o.items,
        "total": o.total,
        "payment_last_four": o.payment_last_four,
        "shipping_address": o.shipping_address,
        "shipping_phone": o.shipping_phone,
        "status": o.status,
        "created_at": str(o.created_at),
    }


def _order_to_dict_masked(o: Order) -> dict:
    """Masked order data (secure mode — redacts sensitive fields)."""
    return {
        "id": o.id,
        "order_uuid": str(o.order_uuid),
        "items": o.items,
        "total": o.total,
        "payment_last_four": f"****{o.payment_last_four}" if o.payment_last_four else "",
        "shipping_address": mask_address(str(o.shipping_address)),
        "shipping_phone": mask_phone(str(o.shipping_phone)),
        "status": o.status,
        "created_at": str(o.created_at),
    }


# ─── Shipper Endpoints (MitM Layer 3 Defense Demo) ───────────────────────

class OrderStatusUpdate(BaseModel):
    status: str

@router.get("/shipper/{order_id}")
def get_order_for_shipper(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get UNMASKED order data for shippers only.
    Shippers scan the QR code to get the order ID, then fetch the real data here.
    """
    if current_user.role != "shipper" and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied. Shipper role required.")
    
    # Allow lookup by either integer ID or UUID
    try:
        if "-" in order_id:
            order = db.query(Order).filter(Order.order_uuid == uuid.UUID(order_id)).first()
        else:
            order = db.query(Order).filter(Order.id == int(order_id)).first()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid order ID")

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Return unmasked data so shipper can deliver
    return {
        "id": order.id,
        "order_uuid": str(order.order_uuid),
        "customer_name": order.user.username,
        "shipping_address": order.shipping_address,
        "shipping_phone": order.shipping_phone,
        "status": order.status,
        "items": order.items,
        "total": order.total,
    }


@router.put("/shipper/{order_id}/status")
def update_order_status(
    order_id: str,
    data: OrderStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Shipper updates the delivery status."""
    if current_user.role != "shipper" and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied. Shipper role required.")

    valid_statuses = ["pending", "confirmed", "delivered", "cancelled"]
    if data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")

    try:
        if "-" in order_id:
            order = db.query(Order).filter(Order.order_uuid == uuid.UUID(order_id)).first()
        else:
            order = db.query(Order).filter(Order.id == int(order_id)).first()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid order ID")

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = data.status
    db.commit()
    return {"message": "Status updated successfully", "status": order.status}

