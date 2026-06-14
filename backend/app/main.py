"""
Security-Shop v2.0 — FastAPI Application Entry Point

Demonstrates 5 security vulnerabilities and their defense-in-depth solutions:
  1. SQL Injection → Credit Card Data Theft
  2. Business Logic Flaw → Price/Quantity Manipulation
  3. IDOR → Unauthorized Order Access & Fake COD Scam
  4. Indirect Prompt Injection → AI Chatbot Manipulation
  5. AI-Driven XSS → Cross-Site Scripting via Chatbot
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import set_mode, is_secure
from app.database import init_db
from app.routers import auth, products, orders, payments, chatbot, reviews
from app.schemas import ModeSwitch


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    SECURE MODE DEFENSE — Layer 3 for XSS:
    Injects HTTP Security Headers into every API response.
    - Content-Security-Policy: blocks inline scripts even if DOMPurify fails
    - X-Frame-Options: prevents clickjacking attacks
    - X-Content-Type-Options: prevents MIME-type sniffing attacks
    - X-XSS-Protection: enables browser's built-in XSS filter (legacy support)
    - Referrer-Policy: prevents leaking sensitive URLs to third parties
    """
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        if is_secure():
            # HSTS: Forces browser to always use HTTPS — prevents SSL Stripping attacks.
            # max-age=31536000 = 1 year. includeSubDomains covers all subdomains. preload = in browser's hardcoded HTTPS list.
            # Even on localhost this header can be inspected in DevTools to demo the concept.
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
    """Initialize database on startup."""
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
    allow_origins=["*"],  # Allow any frontend (Vercel, Netlify, etc.)
    allow_credentials=False, # Must be False when allow_origins is ["*"]
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
    """Switch between base and secure mode for live demo."""
    if data.mode not in ("base", "secure"):
        return {"error": "Mode must be 'base' or 'secure'"}
    set_mode(data.mode)
    return {"message": f"Switched to {data.mode} mode", "mode": data.mode}


@app.get("/api/health")
def health():
    return {"status": "ok", "mode": "secure" if is_secure() else "base"}
