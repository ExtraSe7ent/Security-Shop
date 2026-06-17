"""
Các tiện ích bảo mật: JWT tokens, băm mật khẩu, mã hoá AES-256, che giấu dữ liệu, ký HMAC.

Các lớp phòng thủ nhiều lớp:
  Lớp 1 (Code):    Truy vấn tham số hoá qua ORM (xử lý trong routers)
  Lớp 2 (Dữ liệu): Mã hoá AES-256 cho số thẻ tín dụng (module này)
  Lớp 3 (Truy cập): Xác thực JWT + kiểm tra quyền sở hữu (module này + routers)
  Lớp 4 (Toàn vẹn): Ký request bằng HMAC-SHA256 — ngăn chặn giả mạo trong quá trình truyền (module này)
"""

import base64
import hashlib
import hmac as _hmac
import json as _json
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding as sym_padding
import bcrypt
from jose import jwt, JWTError

from app.config import get_settings

settings = get_settings()

# ─── Băm mật khẩu ───────────────────────────────────────────────────


def hash_password(password: str) -> str:
    """Băm mật khẩu bằng bcrypt native."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Xác minh mật khẩu với giá trị băm bcrypt native."""
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False


# ─── JWT Tokens ──────────────────────────────────────────────────────────
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except JWTError:
        return None


# ─── Mã hoá AES-256 (cho số thẻ tín dụng) ───────────────────────
def _get_aes_key() -> bytes:
    """Chuyển đổi chuỗi hex thành khóa 16 byte cho AES-128 (hoặc 32 byte cho AES-256)."""
    return bytes.fromhex(settings.aes_key)


def encrypt_card_number(card_number: str) -> str:
    """
    Mã hoá số thẻ tín dụng bằng AES-CBC với đệm PKCS7.
    Trả về chuỗi mã hoá base64: iv + ciphertext
    """
    key = _get_aes_key()
    iv = os.urandom(16)

    # Đệm plaintext đến kích thước block
    padder = sym_padding.PKCS7(128).padder()
    padded_data = padder.update(card_number.encode()) + padder.finalize()

    # Mã hoá
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv))
    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(padded_data) + encryptor.finalize()

    # Trả về iv + ciphertext dạng base64
    return base64.b64encode(iv + ciphertext).decode()


def decrypt_card_number(encrypted: str) -> str:
    """
    Giải mã số thẻ tín dụng từ chuỗi AES-CBC dạng base64.
    """
    key = _get_aes_key()
    raw = base64.b64decode(encrypted)
    iv = raw[:16]
    ciphertext = raw[16:]

    # Giải mã
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv))
    decryptor = cipher.decryptor()
    padded_data = decryptor.update(ciphertext) + decryptor.finalize()

    # Bỏ đệm
    unpadder = sym_padding.PKCS7(128).unpadder()
    data = unpadder.update(padded_data) + unpadder.finalize()

    return data.decode()


# ─── Che giấu dữ liệu ────────────────────────────────────────────────────────
def mask_card_number(card_number: str) -> str:
    """
    Che giấu số thẻ tín dụng: 4532XXXXXXXX1234 → ****-****-****-1234
    Chỉ hiển thị 4 chữ số cuối.
    """
    if len(card_number) < 4:
        return "****"
    last_four = card_number[-4:]
    return f"****-****-****-{last_four}"


def mask_phone(phone: str) -> str:
    """Che giấu số điện thoại: 0912345678 → 091***678 (hiện tiền tố + 3 số cuối)"""
    if len(phone) < 6:
        return "****"
    return f"{phone[:3]}***{phone[-3:]}"


def mask_address(address: str) -> str:
    """Che giấu địa chỉ, chỉ hiển thị thành phố/quận."""
    if not address:
        return "***"
    parts = address.split(",")
    if len(parts) >= 2:
        return f"***, {parts[-1].strip()}"
    return "***"


# ─── Ký request bằng HMAC (Lớp toàn vẹn) ─────────────────────────────

def generate_order_hmac(order_body: dict, timestamp: str) -> str:
    """
    Lớp SECURE 4 — Tạo chữ ký HMAC-SHA256 cho request đặt hàng.
    Chữ ký = HMAC_SHA256(secret, canonical_body + "|" + timestamp)
    Canonical body là JSON với các khóa được sắp xếp để đảm bảo thứ tự xác định.
    """
    canonical = _json.dumps(order_body, sort_keys=True, separators=(",", ":")) + "|" + timestamp
    sig = _hmac.new(
        settings.hmac_secret.encode(),
        canonical.encode(),
        hashlib.sha256,
    ).hexdigest()
    return sig


def verify_order_hmac(order_body: dict, timestamp: str, provided_sig: str) -> bool:
    """
    Lớp SECURE 4 — Xác minh chữ ký HMAC khớp với nội dung request.
    Trả về False nếu nội dung bị giả mạo hoặc chữ ký thiếu/không hợp lệ.
    Dùng so sánh thời gian cố định để ngăn chặn tấn công timing attack.
    """
    expected = generate_order_hmac(order_body, timestamp)
    return _hmac.compare_digest(expected, provided_sig)

