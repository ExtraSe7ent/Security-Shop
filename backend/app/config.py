"""App configuration."""

import os
from functools import lru_cache
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://admin:admin123@localhost:5432/ecommerce_db"

    # Security
    secret_key: str = "securityshop-v2-secret-2024-xyz"
    aes_key: str = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
    hmac_secret: str = "securityshop-hmac-secret-2024"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # AI
    gemini_api_key: str = ""

    # Mode Toggle
    mode: str = "base"

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


def is_secure() -> bool:
    return get_settings().mode.lower() == "secure"


def set_mode(new_mode: str) -> None:
    get_settings.cache_clear()
    os.environ["MODE"] = new_mode
