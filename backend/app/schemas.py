"""
Pydantic schemas for request/response validation.
"""

import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# ─── Auth ────────────────────────────────────────────────────────────────
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


# ─── Products ────────────────────────────────────────────────────────────
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


# ─── Payment Methods ────────────────────────────────────────────────────
class PaymentMethodCreate(BaseModel):
    card_number: str = Field(..., min_length=13, max_length=19)
    card_holder: str
    expiry: str  # MM/YY
    card_type: Optional[str] = "visa"


class PaymentMethodOut(BaseModel):
    id: uuid.UUID
    card_display: str  # masked: ****-****-****-1234
    card_holder: str
    expiry: str
    card_type: str
    last_four: str

    class Config:
        from_attributes = True


# ─── Orders ──────────────────────────────────────────────────────────────
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = 1
    price: Optional[float] = None  # BASE MODE: frontend-controlled price (vulnerability demo)


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


# ─── Reviews ─────────────────────────────────────────────────────────────
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
    product_id: Optional[int] = None  # If asking about a specific product


class ChatResponse(BaseModel):
    reply: str
    mode: str  # "base" or "secure"
    guardrails_applied: bool = False


# ─── Mode Toggle ─────────────────────────────────────────────────────────
class ModeSwitch(BaseModel):
    mode: str  # "base" or "secure"
