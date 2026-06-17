"""
Router phương thức thanh toán — Thêm/xem thẻ tín dụng với mã hoá.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import is_secure
from app.models import PaymentMethod, User
from app.schemas import PaymentMethodCreate
from app.routers.auth import get_current_user
from app.security import encrypt_card_number, mask_card_number

router = APIRouter(prefix="/api/payments", tags=["Payments"])


@router.post("")
def add_payment_method(
    data: PaymentMethodCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Thêm thẻ tín dụng mới.

    CHẾ ĐỘ BASE:   Số thẻ lưu dạng VĂN BẢN THUẦN (card_number_plain)
    CHẾ ĐỘ SECURE: Số thẻ được mã hoá bằng AES-256 (card_number_encrypted)
    """
    last_four = data.card_number[-4:]

    pm = PaymentMethod(
        user_id=current_user.id,
        card_holder=data.card_holder,
        expiry=data.expiry,
        last_four=last_four,
        card_type=data.card_type or "visa",
    )

    if is_secure():
        # Secure: mã hoá số thẻ
        pm.card_number_encrypted = encrypt_card_number(data.card_number)
        pm.card_number_plain = ""  # Không bao giờ lưu văn bản thuần
    else:
        # Base: lưu văn bản thuần (có lỗ hổng!)
        pm.card_number_plain = data.card_number
        pm.card_number_encrypted = ""

    db.add(pm)
    db.commit()
    db.refresh(pm)

    return {
        "message": "Payment method added",
        "id": str(pm.id),
        "card_display": mask_card_number(data.card_number),
        "mode": "secure" if is_secure() else "base",
        "storage": "AES-256 encrypted" if is_secure() else "⚠️ Plain text (vulnerable to data breach!)"
    }


@router.get("")
def list_payment_methods(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Liệt kê các phương thức thanh toán của người dùng hiện tại (luôn được che giấu)."""
    methods = db.query(PaymentMethod).filter(
        PaymentMethod.user_id == current_user.id
    ).all()

    result = []
    for pm in methods:
        result.append({
            "id": str(pm.id),
            "card_display": f"****-****-****-{pm.last_four}",
            "card_holder": pm.card_holder,
            "expiry": pm.expiry,
            "card_type": pm.card_type,
            "last_four": pm.last_four,
        })

    return {"payment_methods": result}


@router.get("/cards/storage-compare")
def compare_card_storage(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    ENDPOINT DEMO: So sánh cách lưu dữ liệu thẻ trong chế độ base và secure.

    Minh hoạ trực quan Lỗ hổng #2 (Lưu trữ dữ liệu thẻ không an toàn):
    - Ở chế độ BASE:   card_number_plain chứa số thẻ THẬT → có thể đọc nếu bị đánh cắp
    - Ở chế độ SECURE: card_number_plain TRỐNG, chỉ tồn tại ciphertext AES-256 → không đọc được
    """
    cards = db.query(PaymentMethod).filter(
        PaymentMethod.user_id == current_user.id
    ).all()

    comparison = []
    for pm in cards:
        comparison.append({
            "card_holder": pm.card_holder,
            "last_four": pm.last_four,
            "card_type": pm.card_type,
            "plain_text_column": pm.card_number_plain if pm.card_number_plain else "(EMPTY — not stored)",
            "encrypted_column": pm.card_number_encrypted[:50] + "..." if pm.card_number_encrypted else "(EMPTY — not encrypted)",
            "vulnerability": "⚠️ CRITICAL: Full card number readable!" if pm.card_number_plain else "✅ SAFE: Only encrypted ciphertext stored",
        })

    return {
        "storage_comparison": comparison,
        "mode": "secure" if is_secure() else "base",
        "explanation": {
            "base_mode": "card_number_plain stores the FULL card number in readable text. If database is breached via SQLi, attacker gets real card numbers immediately.",
            "secure_mode": "card_number_plain is always EMPTY. Only card_number_encrypted (AES-256-CBC) is stored. Even if attacker dumps the entire database, they only get meaningless ciphertext.",
            "pci_dss": "PCI-DSS requires: Never store CVV. Encrypt PANs at rest. Use tokenization when possible.",
        }
    }
