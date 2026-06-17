"""
Router sản phẩm — LỖ HỔNG #1: SQL Injection → Đánh cắp dữ liệu thẻ tín dụng

CHẾ ĐỘ BASE:   Nối chuỗi SQL thô → kẻ tấn công có thể UNION-inject và dump dữ liệu thẻ.
CHẾ ĐỘ SECURE: SQLAlchemy ORM (truy vấn tham số hoá) + card_number_plain luôn trống.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
import re

from app.database import get_db
from app.config import is_secure
from app.models import Product, Review, PaymentMethod
from app.schemas import ProductOut

router = APIRouter(prefix="/api/products", tags=["Products"])


@router.get("", response_model=list[ProductOut])
def list_products(db: Session = Depends(get_db)):
    return db.query(Product).all()


@router.get("/search")
def search_products(
    q: str = Query("", description="Search query"),
    db: Session = Depends(get_db)
):
    """
    CHẾ ĐỘ BASE:   SQL thô — dễ bị tấn công SQL Injection dựa trên UNION.
    CHẾ ĐỘ SECURE: Truy vấn ORM tham số hoá + lưu thẻ mã hoá AES-256.
    """
    if not q:
        products = db.query(Product).all()
        return {"results": [_product_to_dict(p) for p in products], "mode": "secure" if is_secure() else "base"}

    if is_secure():
        # Lớp SECURE 1a: Kiểm tra độ dài đầu vào — từ chối truy vấn quá dài
        if len(q) > 200:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Search query too long",
                    "reason": "Search query must not exceed 200 characters",
                    "defense": "Layer 1: Length validation — prevents large payload injection attacks",
                }
            )

        # Lớp SECURE 1b: Kiểm tra đầu vào kiểu WAF — chặn các mẫu từ khoá SQL injection
        SQL_INJECTION_PATTERNS = [
            r'\bunion\b', r'\bselect\b', r'\bdrop\b', r'\binsert\b',
            r'\bupdate\b', r'\bdelete\b', r'\bexec\b', r'\bexecute\b',
            r'--', r'/\*', r'\*/', r'\bor\b\s+\d', r'\band\b\s+\d',
            r"'", r'"',
        ]
        for pattern in SQL_INJECTION_PATTERNS:
            if re.search(pattern, q, re.IGNORECASE):
                raise HTTPException(
                    status_code=400,
                    detail={
                        "error": "Invalid search query",
                        "reason": "Suspicious input pattern detected and blocked by WAF layer",
                        "defense": "Layer 1: WAF keyword filter rejected this request before reaching the database",
                    }
                )

        # Lớp SECURE 2: Truy vấn ORM tham số hoá — injection là bất khả thi ngay cả khi không có Lớp 1
        products = db.query(Product).filter(Product.name.ilike(f"%{q}%")).all()

        sample_card = db.query(PaymentMethod).first()
        encrypted_sample = sample_card.card_number_encrypted[:40] + "..." if sample_card else "N/A"

        return {
            "results": [_product_to_dict(p) for p in products],
            "mode": "secure",
            "defense": [
                "Layer 1: WAF keyword filter — SQL keywords (UNION/SELECT/DROP) blocked at API gateway",
                "Layer 2: SQLAlchemy ORM (parameterized queries) — injection impossible",
                "Layer 3: card_number_plain is EMPTY — only AES-256 encrypted ciphertext stored",
            ],
            "attack_chain_demo": {
                "plain_text_column": "(empty — not stored in secure mode)",
                "encrypted_column_sample": encrypted_sample,
                "explanation": "Even if an attacker bypassed Layer 1 & 2, they would only find encrypted gibberish in Layer 3",
            }
        }

    else:
        # BASE: SQL thô với nối chuỗi — cố ý tạo lỗ hổng để demo.
        raw_query = f"SELECT id, name, name_vi, description, description_vi, price, image_url, category, stock, rating FROM products WHERE name ILIKE '%{q}%'"
        try:
            result = db.execute(text(raw_query))
            rows = result.fetchall()
            columns = result.keys()
            return {
                "results": [dict(zip(columns, row)) for row in rows],
                "mode": "base",
                "warning": "⚠️ Raw SQL concatenation — vulnerable to SQL Injection!",
                "query_executed": raw_query,
            }
        except Exception as e:
            return {"results": [], "mode": "base", "error": str(e), "query_attempted": raw_query}


@router.get("/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return {"error": "Product not found"}

    reviews = db.query(Review).filter(Review.product_id == product_id).all()
    review_list = [
        {
            "id": r.id,
            "content": r.content,
            "rating": r.rating,
            "username": r.user.username if r.user else "Anonymous",
            "created_at": str(r.created_at),
        }
        for r in reviews
    ]

    return {"product": _product_to_dict(product), "reviews": review_list}


def _product_to_dict(p: Product) -> dict:
    return {
        "id": p.id,
        "name": p.name,
        "name_vi": p.name_vi,
        "description": p.description,
        "description_vi": p.description_vi,
        "price": p.price,
        "image_url": p.image_url,
        "category": p.category,
        "stock": p.stock,
        "rating": p.rating,
    }
