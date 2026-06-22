"""Security-Shop v2.0 — FastAPI Entrypoint"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import set_mode, is_secure
from app.database import init_db
from app.routers import auth, products, orders, payments, chatbot, reviews
from app.schemas import ModeSwitch


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """SECURE: HTTP Security Headers Middleware"""
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        if is_secure():
            # SECURE: HSTS (Strict-Transport-Security)
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "script-src 'self'; "
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                "font-src 'self' https://fonts.gstatic.com; "
                "img-src 'self' data: https:; "
                "connect-src 'self'; "
                "frame-ancestors 'none'"
            )
            response.headers["X-Frame-Options"] = "DENY"
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["X-XSS-Protection"] = "1; mode=block"
            response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
            response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Security Shop v2.0",
    description="E-commerce Security Lab — Defense in Depth",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SecurityHeadersMiddleware)

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(payments.router)
app.include_router(chatbot.router)
app.include_router(reviews.router)


@app.get("/")
def root():
    return {
        "name": "Security Shop v2.0",
        "mode": "secure" if is_secure() else "base",
        "description": "E-commerce Security Lab — Defense in Depth",
    }


@app.get("/api/mode")
def get_mode():
    return {"mode": "secure" if is_secure() else "base"}


@app.post("/api/mode")
def switch_mode(data: ModeSwitch):
    if data.mode not in ("base", "secure"):
        return {"error": "Mode must be 'base' or 'secure'"}
    set_mode(data.mode)
    return {"message": f"Switched to {data.mode} mode", "mode": data.mode}


@app.get("/api/health")
def health():
    return {"status": "ok", "mode": "secure" if is_secure() else "base"}
