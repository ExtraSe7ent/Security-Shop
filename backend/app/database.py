from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()  # đọc file .env

DATABASE_URL = os.getenv("DATABASE_URL")

# Tạo kết nối tới PostgreSQL
engine = create_engine(DATABASE_URL)

# Mỗi request tới API sẽ dùng 1 session riêng
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class cho tất cả models (bảng database)
Base = declarative_base()

# Hàm này được gọi trong mọi API endpoint để lấy DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()