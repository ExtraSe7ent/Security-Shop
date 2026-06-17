"""
Các schema Pydantic để xác thực request/response.
"""

import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# ─── Xác thực ────────────────────────────────────────────────────────────────
class UserRegister(BaseModel):
    email: str
    username: str
    password: str
    phone: Optional[str] = ""
    address: Optional[str] = ""


class UserLogin(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    username: str
    phone: str
    address: str
    role: str

    class Config:
        from_attributes = True


# ─── Sản phẩm ────────────────────────────────────────────────────────────
class ProductOut(BaseModel):
    id: int
    name: str
    name_vi: str
    description: str
    description_vi: str
    price: float
    image_url: str
    category: str
    stock: int
    rating: float

    class Config:
        from_attributes = True


# ─── Phương thức thanh toán ────────────────────────────────────────────────────
class PaymentMethodCreate(BaseModel):
    card_number: str = Field(..., min_length=13, max_length=19)
    card_holder: str
    expiry: str  # MM/YY
    card_type: Optional[str] = "visa"


class PaymentMethodOut(BaseModel):
    id: uuid.UUID
    card_display: str  # đã che: ****-****-****-1234
    card_holder: str
    expiry: str
    card_type: str
    last_four: str

    class Config:
        from_attributes = True


# ─── Đơn hàng ──────────────────────────────────────────────────────────────
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = 1
    price: Optional[float] = None  # CHẾ ĐỘ BASE: giá do frontend kiểm soát (demo lỗ hổng)


class OrderCreate(BaseModel):
    items: List[OrderItemCreate]
    payment_method_id: Optional[str] = None
    shipping_address: str
    shipping_phone: str


class OrderOut(BaseModel):
    id: int
    order_uuid: uuid.UUID
    items: list
    total: float
    payment_last_four: str
    shipping_address: str
    shipping_phone: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Đánh giá ─────────────────────────────────────────────────────────────
class ReviewCreate(BaseModel):
    product_id: int
    content: str
    rating: int = Field(..., ge=1, le=5)


class ReviewOut(BaseModel):
    id: int
    product_id: int
    user_id: uuid.UUID
    username: str = ""
    content: str
    rating: int
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Chatbot ─────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    message: str
    product_id: Optional[int] = None  # Nếu hỏi về một sản phẩm cụ thể


class ChatResponse(BaseModel):
    reply: str
    mode: str  # "base" hoặc "secure"
    guardrails_applied: bool = False


# ─── Chuyển đổi chế độ ─────────────────────────────────────────────────────────
class ModeSwitch(BaseModel):
    mode: str  # "base" hoặc "secure"
