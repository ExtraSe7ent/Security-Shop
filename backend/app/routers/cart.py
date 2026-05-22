import os
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional
from jose import jwt, JWTError
from pydantic import BaseModel
from app.database import get_db
from app.models.models import CartItem, Product

router = APIRouter()
SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret")
ALGORITHM = "HS256"


def get_user_id_from_token(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return int(payload.get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


class AddToCartRequest(BaseModel):
    product_id: int
    quantity: int = 1


@router.get("/")
def get_cart(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    user_id = get_user_id_from_token(authorization)
    items = db.query(CartItem).filter(CartItem.user_id == user_id).all()
    return [
        {
            "id": item.id,
            "product_id": item.product_id,
            "product_name": item.product.name,
            "price": item.product.price,
            "quantity": item.quantity,
            "subtotal": item.product.price * item.quantity
        }
        for item in items
    ]


@router.post("/add")
def add_to_cart(req: AddToCartRequest, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    user_id = get_user_id_from_token(authorization)
    product = db.query(Product).filter(Product.id == req.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.stock < req.quantity:
        raise HTTPException(status_code=400, detail="Not enough stock")

    existing = db.query(CartItem).filter(
        CartItem.user_id == user_id,
        CartItem.product_id == req.product_id
    ).first()

    if existing:
        existing.quantity += req.quantity
    else:
        cart_item = CartItem(user_id=user_id, product_id=req.product_id, quantity=req.quantity)
        db.add(cart_item)

    db.commit()
    return {"message": "Added to cart"}


@router.delete("/remove/{item_id}")
def remove_from_cart(item_id: int, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    user_id = get_user_id_from_token(authorization)
    item = db.query(CartItem).filter(
        CartItem.id == item_id,
        CartItem.user_id == user_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return {"message": "Removed from cart"}