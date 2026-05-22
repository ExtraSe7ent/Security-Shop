from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.database import engine, Base
from app.routers import auth, products, chatbot, cart, orders, reviews
import os

Base.metadata.create_all(bind=engine)

MODE = os.getenv("MODE", "secure")

# Rate limiter setup
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="SecurityShop API",
    description="E-commerce API with security vulnerability demonstrations",
    version="1.0.0"
)

# Gắn rate limiter vào app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ✅ SECURE #6: CORS chỉ cho phép origin cụ thể
# ⚠️ VULN #6: CORS cho phép tất cả
CORS_ORIGINS = ["*"] if MODE == "vuln" else ["http://localhost:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(products.router, prefix="/api/products", tags=["Products"])
app.include_router(chatbot.router, prefix="/api/chat", tags=["Chatbot"])
app.include_router(cart.router, prefix="/api/cart", tags=["Cart"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])
app.include_router(reviews.router, prefix="/api/reviews", tags=["Reviews"])


@app.get("/")
def root():
    return {
        "status": "SecurityShop API is running",
        "mode": MODE,
        "docs": "/docs"
    }