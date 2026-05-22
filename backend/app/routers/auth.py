import os
import time
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session
from sqlalchemy import text
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.models import User

# ✅ SECURE: In-memory store theo dõi số lần đăng nhập thất bại (production nên dùng Redis)
_login_attempts: dict = defaultdict(list)

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret")
ALGORITHM = "HS256"


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str


def create_token(user_id: int, username: str) -> str:
    mode = os.getenv("MODE", "secure")
    if mode == "vuln":
        # ⚠️ VULN: Token không bao giờ hết hạn → attacker stolen token dùng mãi mãi
        exp = datetime.utcnow() + timedelta(days=365 * 999)
    else:
        # ✅ SECURE: Token hết hạn sau 30 phút
        exp = datetime.utcnow() + timedelta(minutes=30)
    payload = {
        "sub": str(user_id),
        "username": username,
        "exp": exp
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(
        (User.email == req.email) | (User.username == req.username)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email or username already exists")
    hashed = pwd_context.hash(req.password)
    user = User(username=req.username, email=req.email, hashed_password=hashed)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "Registration successful", "user_id": user.id}


@router.post("/login")
def login(request: Request, req: LoginRequest, db: Session = Depends(get_db)):
    mode = os.getenv("MODE", "secure")

    if mode == "secure":
        # ✅ SECURE: Brute Force Protection — giới hạn 5 lần thử/phút/IP
        client_ip = request.client.host
        now = time.time()
        # Xóa các attempt cũ hơn 60 giây
        _login_attempts[client_ip] = [t for t in _login_attempts[client_ip] if now - t < 60]
        if len(_login_attempts[client_ip]) >= 5:
            raise HTTPException(
                status_code=429,
                detail="Too many failed login attempts. Please wait 1 minute."
            )

    if mode == "vuln":
        # ⚠️ VULN #1: SQL Injection — raw SQL nối chuỗi trực tiếp
        # ⚠️ VULN #2: Không có Brute Force protection
        # ⚠️ Giả lập app cũ: chỉ check username trong SQL, không verify password
        # → Injection vào username là đủ để bypass hoàn toàn
        raw_sql = f"SELECT id, username, hashed_password FROM users WHERE username = '{req.username}'"
        try:
            result = db.execute(text(raw_sql)).fetchone()
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        if not result:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        # ⚠️ VULN: Không verify password — SQL Injection vào username là đủ để đăng nhập!
        token = create_token(result[0], result[1])
    else:
        # ✅ SECURE: Parameterized query + bcrypt
        user = db.query(User).filter(User.username == req.username).first()
        if not user or not pwd_context.verify(req.password, user.hashed_password):
            # Ghi lại attempt thất bại
            _login_attempts[request.client.host].append(time.time())
            raise HTTPException(status_code=401, detail="Invalid credentials")
        token = create_token(user.id, user.username)
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    mode = os.getenv("MODE", "secure")
    if mode == "vuln":
        # ⚠️ VULN #4: Sensitive Data Exposure — trả về hashed_password
        return {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "hashed_password": current_user.hashed_password,
            "is_admin": current_user.is_admin,
        }
    else:
        # ✅ SECURE: chỉ trả field cần thiết
        return {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
        }


@router.get("/admin/users")
def get_all_users(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    mode = os.getenv("MODE", "secure")
    if mode == "vuln":
        # ⚠️ VULN #5: Broken Access Control — không kiểm tra quyền admin
        users = db.query(User).all()
        return [{"id": u.id, "username": u.username, "email": u.email} for u in users]
    else:
        # ✅ SECURE: kiểm tra token + is_admin
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Not authenticated")
        token = authorization.split(" ")[1]
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = int(payload.get("sub"))
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        users = db.query(User).all()
        return [{"id": u.id, "username": u.username, "email": u.email} for u in users]