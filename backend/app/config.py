"""
Cấu hình ứng dụng — đọc từ .env và cung cấp các thiết lập.
MODE điều khiển việc minh hoạ lỗ hổng bảo mật:
  - "base"   = code không an toàn thực tế (dùng để demo)
  - "secure" = áp dụng phòng thủ nhiều lớp
"""

import os
from functools import lru_cache
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    # Cơ sở dữ liệu
    database_url: str = "postgresql://admin:admin123@localhost:5432/ecommerce_db"

    # Bảo mật
    secret_key: str = "securityshop-v2-secret-2024-xyz"
    aes_key: str = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"  # 64 ký tự hex = 32 byte = AES-256
    hmac_secret: str = "securityshop-hmac-secret-2024"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # AI
    gemini_api_key: str = ""

    # Chuyển đổi chế độ
    mode: str = "base"  # "base" hoặc "secure"

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


def is_secure() -> bool:
    """Kiểm tra xem ứng dụng có đang chạy ở chế độ secure hay không."""
    return get_settings().mode.lower() == "secure"


def set_mode(new_mode: str) -> None:
    """Chuyển đổi chế độ trong lúc chạy (dùng cho mục đích demo)."""
    get_settings.cache_clear()
    os.environ["MODE"] = new_mode
