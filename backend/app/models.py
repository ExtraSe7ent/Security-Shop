"""
Các model SQLAlchemy ORM cho Security-Shop v2.

Quyết định thiết kế chính:
- Người dùng dùng UUID làm khóa chính (khó đoán hơn)
- Đơn hàng dùng UUID ở chế độ secure, int ở chế độ base (để demo IDOR)
- PaymentMethods lưu số thẻ dưới cả hai dạng: mã hoá (AES-256) và văn bản thuần
  để có thể minh hoạ sự khác biệt giữa lưu trữ an toàn và không an toàn
- Reviews là bề mặt tấn công cho Indirect Prompt Injection
"""

import uuid
from datetime import datetime

from sqlalchemy import (
    Column, String, Integer, Float, Text, DateTime,
    ForeignKey, JSON
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    phone = Column(String(20), default="")
    address = Column(Text, default="")
    role = Column(String(20), default="customer")  # customer / admin
    created_at = Column(DateTime, default=datetime.utcnow)

    # Quan hệ
    payment_methods = relationship("PaymentMethod", back_populates="user", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="user", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    name_vi = Column(String(255), default="")  # Tên tiếng Việt
    description = Column(Text, default="")
    description_vi = Column(Text, default="")  # Mô tả tiếng Việt
    price = Column(Float, nullable=False)
    image_url = Column(String(500), default="")
    category = Column(String(100), default="")
    stock = Column(Integer, default=0)
    rating = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Quan hệ
    reviews = relationship("Review", back_populates="product", cascade="all, delete-orphan")


class PaymentMethod(Base):
    """
    TRỌNG TÂM BẢO MẬT: Bảng này là mục tiêu chính của các cuộc tấn công SQL Injection.

    - card_number_plain: Lưu dạng văn bản thuần (chế độ Base) — kẻ tấn công có thể dump dữ liệu này
    - card_number_encrypted: Mã hoá AES-256 (chế độ Secure) — dù bị dump cũng không dùng được
    - last_four: Luôn lưu để hiển thị (ví dụ: ****-****-****-1234)
    """
    __tablename__ = "payment_methods"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    card_number_plain = Column(String(20), default="")      # Chế độ Base: văn bản thuần
    card_number_encrypted = Column(Text, default="")         # Chế độ Secure: AES-256
    card_holder = Column(String(255), default="")
    expiry = Column(String(10), default="")                  # MM/YY
    last_four = Column(String(4), default="")
    card_type = Column(String(20), default="visa")           # visa, mastercard, v.v.
    created_at = Column(DateTime, default=datetime.utcnow)

    # Quan hệ
    user = relationship("User", back_populates="payment_methods")


class Order(Base):
    """
    TRỌNG TÂM BẢO MẬT: Bảng này minh hoạ lỗ hổng IDOR.

    - Ở chế độ Base: ID số nguyên tuần tự giúp dễ dàng dò đoán
    - Ở chế độ Secure: UUID + kiểm tra quyền sở hữu + che giấu dữ liệu
    """
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_uuid = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    items = Column(JSON, default=[])
    total = Column(Float, default=0.0)
    payment_last_four = Column(String(4), default="")
    shipping_address = Column(Text, default="")
    shipping_phone = Column(String(20), default="")
    status = Column(String(50), default="pending")  # pending, confirmed, shipped, delivered
    created_at = Column(DateTime, default=datetime.utcnow)

    # Quan hệ
    user = relationship("User", back_populates="orders")


class Review(Base):
    """
    TRỌNG TÂM BẢO MẬT: Bảng này là vector tấn công cho Indirect Prompt Injection.

    Kẻ tấn công viết một đánh giá chứa các lệnh ẩn dành cho chatbot LLM.
    Khi chatbot đọc đánh giá để tóm tắt phản hồi sản phẩm, nó có thể tuân theo
    các lệnh được chèn vào thay vì system prompt ban đầu.
    """
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    rating = Column(Integer, default=5)  # 1-5
    created_at = Column(DateTime, default=datetime.utcnow)

    # Quan hệ
    product = relationship("Product", back_populates="reviews")
    user = relationship("User", back_populates="reviews")
