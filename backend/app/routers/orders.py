import os
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional
from jose import jwt, JWTError
from app.database import get_db
from app.models.models import Order, OrderItem, Product, CartItem

router = APIRouter()
SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret")
ALGORITHM = "HS256"
# Lưu ý: MODE đọc trong từng hàm bằng os.getenv() để luôn lấy giá trị mới nhất


def get_user_id_from_token(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return int(payload.get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.get("/my-orders")
def get_my_orders(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """Lấy danh sách tất cả đơn hàng của user đang đăng nhập"""
    # ✅ Route tĩnh phải đặt TRƯỚC route động /{order_id}
    user_id = get_user_id_from_token(authorization)
    orders = db.query(Order).filter(Order.user_id == user_id).order_by(Order.created_at.desc()).all()
    return [
        {
            "order_id": o.id,
            "total_price": o.total_price,
            "status": o.status,
            "created_at": str(o.created_at),
        }
        for o in orders
    ]


@router.get("/{order_id}")
def get_order(order_id: int, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    mode = os.getenv("MODE", "secure")
    if mode == "vuln":
        # ⚠️ VULN #9: IDOR — không kiểm tra order thuộc về ai
        # Bất kỳ ai cũng xem được order của người khác chỉ bằng cách đoán ID
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        return {
            "order_id": order.id,
            "user_id": order.user_id,
            "total_price": order.total_price,
            "status": order.status,
        }
    else:
        # ✅ SECURE: kiểm tra order phải thuộc về user đang login
        user_id = get_user_id_from_token(authorization)
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        if order.user_id != user_id:
            raise HTTPException(status_code=403, detail="Access denied — this is not your order")
        return {
            "order_id": order.id,
            "user_id": order.user_id,
            "total_price": order.total_price,
            "status": order.status,
        }


@router.post("/create")
def create_order(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    # Tạo order từ cart items của user
    user_id = get_user_id_from_token(authorization)
    cart_items = db.query(CartItem).filter(CartItem.user_id == user_id).all()
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    total = sum(item.product.price * item.quantity for item in cart_items)
    order = Order(user_id=user_id, total_price=total, status="pending")
    db.add(order)
    db.flush()

    for item in cart_items:
        order_item = OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            price_at_purchase=item.product.price
        )
        db.add(order_item)
        # ✅ Trừ stock sau khi đặt hàng
        item.product.stock = max(0, item.product.stock - item.quantity)
        db.delete(item)

    db.commit()
    return {"message": "Order created", "order_id": order.id}