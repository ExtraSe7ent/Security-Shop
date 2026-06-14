from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import re

from app.database import get_db
from app.models import Review, Product, User
from app.schemas import ReviewCreate
from app.routers.auth import get_current_user
from app.config import is_secure

router = APIRouter(prefix="/api/reviews", tags=["Reviews"])

# Patterns that indicate an attempt to inject instructions into the AI
INJECTION_PATTERNS = [
    r'\[SYSTEM',
    r'\[INSTRUCTION',
    r'ignore (all |previous |your )(instructions?|rules?|prompt)',
    r'you are now',
    r'forget (all |your |previous )',
    r'<script',
    r'onerror\s*=',
    r'onload\s*=',
    r'javascript:',
    r'OVERRIDE',
    r'ADMIN MODE',
    r'DAN mode',
]


@router.post("", status_code=201)
def create_review(
    data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a review for a product.

    BASE MODE:  Content stored as-is — enables Indirect Prompt Injection & XSS via chatbot.
    SECURE MODE: Layer 1 defense — scan for injection patterns before saving to database.
    """
    # Check product exists
    product = db.query(Product).filter(Product.id == data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if is_secure():
        # SECURE Layer 1: Injection Pattern Detection — reject reviews containing AI injection commands
        for pattern in INJECTION_PATTERNS:
            if re.search(pattern, data.content, re.IGNORECASE):
                raise HTTPException(
                    status_code=400,
                    detail={
                        "error": "Review rejected by security filter",
                        "reason": "Content contains patterns associated with AI prompt injection or XSS attacks",
                        "pattern_detected": pattern,
                        "defense": "Layer 1: Input Injection Scanner — malicious content blocked before reaching the database",
                    }
                )

        # SECURE Layer 2: Length validation — prevent excessively long payloads
        if len(data.content) > 1000:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Review too long",
                    "reason": "Content exceeds 1000 character limit",
                    "defense": "Layer 2: Length validation — prevents large payload injection attacks",
                }
            )

    # NOTE: Duplicate review check intentionally disabled for demo —
    # this lets the same user write multiple reviews to re-run attack scenarios.
    review = Review(
        product_id=data.product_id,
        user_id=current_user.id,
        content=data.content,
        rating=data.rating,
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    if is_secure():
        return {
            "message": "Review submitted and passed security scan",
            "id": review.id,
            "product_id": review.product_id,
            "content": review.content,
            "rating": review.rating,
            "defense": [
                "Layer 1: Injection pattern scanner — no malicious AI instructions detected",
                "Layer 2: Length validation — content within safe limits",
                "Layer 3 (chatbot): XML prompt bounding — even if a review slips through, chatbot will not follow embedded instructions",
            ],
        }

    return {
        "message": "Review submitted successfully",
        "id": review.id,
        "product_id": review.product_id,
        "content": review.content,
        "rating": review.rating,
        "warning": "⚠️ In BASE mode, this review content will be injected into the AI chatbot's prompt unfiltered!",
    }




@router.delete("/{review_id}")
def delete_review(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete own review (allows re-writing for repeated demo runs)."""
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if review.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    db.delete(review)
    db.commit()
    return {"message": "Review deleted"}
