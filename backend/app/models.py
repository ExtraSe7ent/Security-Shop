"""
SQLAlchemy ORM models for Security-Shop v2.

Key design decisions:
- Users use UUID primary keys (harder to enumerate)
- Orders use UUID in secure mode, int in base mode (for IDOR demo)
- PaymentMethods store card numbers both encrypted (AES-256) and plain text
  so we can demonstrate the difference between secure and insecure storage
- Reviews are the attack surface for Indirect Prompt Injection
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

    # Relationships
    payment_methods = relationship("PaymentMethod", back_populates="user", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="user", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    name_vi = Column(String(255), default="")  # Vietnamese name
    description = Column(Text, default="")
    description_vi = Column(Text, default="")  # Vietnamese description
    price = Column(Float, nullable=False)
    image_url = Column(String(500), default="")
    category = Column(String(100), default="")
    stock = Column(Integer, default=0)
    rating = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    reviews = relationship("Review", back_populates="product", cascade="all, delete-orphan")


class PaymentMethod(Base):
    """
    SECURITY FOCUS: This table is the primary target for SQL Injection attacks.

    - card_number_plain: Stored in plain text (Base mode) — attacker can dump this
    - card_number_encrypted: AES-256 encrypted (Secure mode) — even if dumped, unusable
    - last_four: Always stored for display purposes (e.g., ****-****-****-1234)
    """
    __tablename__ = "payment_methods"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    card_number_plain = Column(String(20), default="")      # Base mode: plain text
    card_number_encrypted = Column(Text, default="")         # Secure mode: AES-256
    card_holder = Column(String(255), default="")
    expiry = Column(String(10), default="")                  # MM/YY
    last_four = Column(String(4), default="")
    card_type = Column(String(20), default="visa")           # visa, mastercard, etc.
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="payment_methods")


class Order(Base):
    """
    SECURITY FOCUS: This table demonstrates IDOR vulnerability.

    - In Base mode: sequential integer IDs make it easy to enumerate
    - In Secure mode: UUID IDs + ownership check + data masking
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

    # Relationships
    user = relationship("User", back_populates="orders")


class Review(Base):
    """
    SECURITY FOCUS: This table is the attack vector for Indirect Prompt Injection.

    Attacker writes a review containing hidden instructions for the LLM chatbot.
    When the chatbot reads reviews to summarize product feedback, it may follow
    the injected instructions instead of the system prompt.
    """
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    rating = Column(Integer, default=5)  # 1-5
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    product = relationship("Product", back_populates="reviews")
    user = relationship("User", back_populates="reviews")
