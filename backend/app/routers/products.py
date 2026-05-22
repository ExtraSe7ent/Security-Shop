import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.models.models import Product

router = APIRouter()


@router.get("/")
def get_products(db: Session = Depends(get_db)):
    return db.query(Product).all()


@router.get("/search")
def search_products(q: str = "", db: Session = Depends(get_db)):
    mode = os.getenv("MODE", "secure")
    if mode == "vuln":
        # ⚠️ VULN: nối chuỗi trực tiếp → SQL Injection
        raw_sql = f"SELECT id, name, CAST(price AS TEXT) FROM products WHERE name ILIKE '%{q}%'"
        results = db.execute(text(raw_sql)).fetchall()
        return [{"id": r[0], "name": r[1], "price": r[2]} for r in results]
    else:
        # ✅ SECURE: parameterized query
        results = db.query(Product).filter(
            Product.name.ilike(f"%{q}%")
        ).all()
        return [{"id": p.id, "name": p.name, "price": p.price} for p in results]


@router.get("/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("/seed")
def seed_products(db: Session = Depends(get_db)):
    if db.query(Product).count() > 0:
        return {"message": "Products already exist"}

    samples = [
        Product(
            name="iPhone 15 Pro",
            description="Apple's latest flagship with A17 Pro chip and titanium design",
            price=29990000, stock=50, category="Smartphones",
            image_url="https://images.unsplash.com/photo-1592286927505-1def25115558?w=400&h=300&fit=crop"
        ),
        Product(
            name="Samsung Galaxy S24",
            description="Android flagship 2024 with AI-powered camera system",
            price=22990000, stock=30, category="Smartphones",
            image_url="https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&h=300&fit=crop"
        ),
        Product(
            name="MacBook Air M3",
            description="Ultra-thin laptop with 18-hour battery life",
            price=32990000, stock=20, category="Laptops",
            image_url="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop"
        ),
        Product(
            name="AirPods Pro 2",
            description="Best-in-class active noise cancellation earbuds",
            price=6490000, stock=100, category="Accessories",
            image_url="https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&h=300&fit=crop"
        ),
        Product(
            name="iPad Air M2",
            description="Versatile tablet with Liquid Retina display",
            price=16990000, stock=40, category="Tablets",
            image_url="https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop"
        ),
        Product(
            name="Dell XPS 15",
            description="Premium Windows laptop for creative professionals",
            price=42990000, stock=15, category="Laptops",
            image_url="https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&h=300&fit=crop"
        ),
    ]
    db.add_all(samples)
    db.commit()
    return {"message": f"Added {len(samples)} sample products"}