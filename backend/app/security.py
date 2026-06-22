"""
Security utilities: JWT tokens, password hashing, AES-256 encryption, data masking, HMAC signing.

Defense-in-depth layers:
  Layer 1 (Code):    Parameterized queries via ORM (handled in routers)
  Layer 2 (Data):    AES-256 encryption for credit card numbers (this module)
  Layer 3 (Access):  JWT authentication + ownership checks (this module + routers)
  Layer 4 (Integrity): HMAC-SHA256 request signing to prevent tampering during transit (this module)
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

# --- Password Hashing ---

def hash_password(password: str) -> str:
    """Hash password using native bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against native bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False


# --- JWT Tokens ---

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


# --- AES-256 Encryption (for credit card numbers) ---

def _get_aes_key() -> bytes:
    """Convert hex string to 16-byte key for AES-128 (or 32-byte for AES-256)."""
    return bytes.fromhex(settings.aes_key)


def encrypt_card_number(card_number: str) -> str:
    """
    Encrypt credit card number using AES-CBC with PKCS7 padding.
    Returns base64 encoded string: iv + ciphertext
    """
    key = _get_aes_key()
    iv = os.urandom(16)

    # Pad plaintext to block size
    padder = sym_padding.PKCS7(128).padder()
    padded_data = padder.update(card_number.encode()) + padder.finalize()

    # Encrypt
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv))
    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(padded_data) + encryptor.finalize()

    # Return iv + ciphertext as base64
    return base64.b64encode(iv + ciphertext).decode()


def decrypt_card_number(encrypted: str) -> str:
    """
    Decrypt credit card number from AES-CBC base64 string.
    """
    key = _get_aes_key()
    raw = base64.b64decode(encrypted)
    iv = raw[:16]
    ciphertext = raw[16:]

    # Decrypt
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv))
    decryptor = cipher.decryptor()
    padded_data = decryptor.update(ciphertext) + decryptor.finalize()

    # Unpad
    unpadder = sym_padding.PKCS7(128).unpadder()
    data = unpadder.update(padded_data) + unpadder.finalize()

    return data.decode()


# --- Data Masking ---

def mask_card_number(card_number: str) -> str:
    """
    Mask credit card number: 4532XXXXXXXX1234 -> ****-****-****-1234
    Shows only the last 4 digits.
    """
    if len(card_number) < 4:
        return "****"
    last_four = card_number[-4:]
    return f"****-****-****-{last_four}"


def mask_phone(phone: str) -> str:
    """Mask phone number: 0912345678 -> 091***678"""
    if len(phone) < 6:
        return "****"
    return f"{phone[:3]}***{phone[-3:]}"


def mask_address(address: str) -> str:
    """Mask address, showing only city/district."""
    if not address:
        return "***"
    parts = address.split(",")
    if len(parts) >= 2:
        return f"***, {parts[-1].strip()}"
    return "***"


# --- Request Signing with HMAC (Integrity Layer) ---

def generate_order_hmac(order_body: dict, timestamp: str) -> str:
    """
    SECURE Layer 4 - Generate HMAC-SHA256 signature for order request.
    Signature = HMAC_SHA256(secret, canonical_body + "|" + timestamp)
    Canonical body is JSON with keys sorted to ensure deterministic order.
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
    SECURE Layer 4 - Verify HMAC signature matches request body.
    Returns False if body tampered with or signature missing/invalid.
    Uses constant time comparison to prevent timing attacks.
    """
    expected = generate_order_hmac(order_body, timestamp)
    return _hmac.compare_digest(expected, provided_sig)
