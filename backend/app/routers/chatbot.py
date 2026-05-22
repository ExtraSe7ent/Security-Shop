import os
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.database import get_db
from app.chatbot.gemini_chat import chat_secure, chat_vuln

router = APIRouter()
MODE = os.getenv("MODE", "secure")

# Rate limiter — giới hạn 10 request/phút mỗi IP
limiter = Limiter(key_func=get_remote_address)


class ChatRequest(BaseModel):
    message: str


@router.post("/")
@limiter.limit("10/minute")  # ✅ SECURE #10: Rate limiting
def chat(request: Request, req: ChatRequest, db: Session = Depends(get_db)):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    if MODE == "vuln":
        # ⚠️ VULN: không filter, không rate limit thực sự
        reply = chat_vuln(req.message, db)
    else:
        # ✅ SECURE: có filter + rate limit
        reply = chat_secure(req.message, db)

    return {"reply": reply, "mode": MODE}