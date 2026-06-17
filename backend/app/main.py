"""
Security-Shop v2.0 — Điểm vào ứng dụng FastAPI

Minh hoạ 5 lỗ hổng bảo mật và giải pháp phòng thủ nhiều lớp:
  1. SQL Injection → Đánh cắp dữ liệu thẻ tín dụng
  2. Business Logic Flaw → Thao túng giá/số lượng
  3. IDOR → Truy cập đơn hàng trái phép & lừa đảo COD giả
  4. Indirect Prompt Injection → Thao túng chatbot AI
  5. AI-Driven XSS → Cross-Site Scripting qua chatbot
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
    BẢO VỆ CHẾ ĐỘ SECURE — Lớp 3 chống XSS:
    Chèn HTTP Security Headers vào mọi phản hồi API.
    - Content-Security-Policy: chặn inline script ngay cả khi DOMPurify thất bại
    - X-Frame-Options: ngăn chặn tấn công clickjacking
    - X-Content-Type-Options: ngăn chặn tấn công MIME-type sniffing
    - X-XSS-Protection: bật bộ lọc XSS tích hợp của trình duyệt (hỗ trợ trình duyệt cũ)
    - Referrer-Policy: ngăn rò rỉ URL nhạy cảm cho bên thứ ba
    """
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        if is_secure():
            # HSTS: Buộc trình duyệt luôn dùng HTTPS — ngăn chặn tấn công SSL Stripping.
            # max-age=31536000 = 1 năm. includeSubDomains áp dụng cho mọi subdomain. preload = nằm trong danh sách HTTPS cứng của trình duyệt.
            # Ngay cả trên localhost, header này vẫn có thể xem qua DevTools để minh hoạ khái niệm.
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
    """Khởi tạo cơ sở dữ liệu khi ứng dụng khởi động."""
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
    allow_origins=["*"],  # Cho phép mọi frontend (Vercel, Netlify, v.v.)
    allow_credentials=False, # Phải là False khi allow_origins là ["*"]
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
    """Chuyển đổi giữa chế độ base và secure để trình diễn trực tiếp."""
    if data.mode not in ("base", "secure"):
        return {"error": "Mode must be 'base' or 'secure'"}
    set_mode(data.mode)
    return {"message": f"Switched to {data.mode} mode", "mode": data.mode}


@app.get("/api/health")
def health():
    return {"status": "ok", "mode": "secure" if is_secure() else "base"}
