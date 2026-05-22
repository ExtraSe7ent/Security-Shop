import os
import html as html_module
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from jose import jwt, JWTError
from app.database import get_db
from app.models.models import Review

router = APIRouter()
SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret")
ALGORITHM = "HS256"


class ReviewRequest(BaseModel):
    product_id: int
    content: str


@router.get("/{product_id}")
def get_reviews(product_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(Review.product_id == product_id).all()
    return [
        {
            "id": r.id,
            "username": r.username,
            "content": r.content,
            "created_at": str(r.created_at),
        }
        for r in reviews
    ]


@router.post("/")
def add_review(
    req: ReviewRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Login required to write a review")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("username")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    if not req.content.strip():
        raise HTTPException(status_code=400, detail="Review cannot be empty")

    mode = os.getenv("MODE", "secure")
    if mode == "vuln":
        # ⚠️ VULN: Lưu thẳng không escape → Stored XSS
        content = req.content
    else:
        # ✅ SECURE: Escape HTML trước khi lưu → chặn Stored XSS
        content = html_module.escape(req.content)

    review = Review(
        product_id=req.product_id,
        username=username,
        content=content
    )
    db.add(review)
    db.commit()
    return {"message": "Review added"}