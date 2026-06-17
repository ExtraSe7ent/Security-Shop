"""
Quản lý engine và phiên làm việc cơ sở dữ liệu.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base khai báo theo phong cách SQLAlchemy 2.0 — thay thế hàm declarative_base() đã lỗi thời."""
    pass


def get_db():
    """Dependency cung cấp một phiên cơ sở dữ liệu cho mỗi request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Tạo tất cả các bảng được định nghĩa bởi các model SQLAlchemy."""
    Base.metadata.create_all(bind=engine)
