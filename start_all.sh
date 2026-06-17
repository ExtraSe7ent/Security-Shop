#!/bin/bash

# Màu sắc cho terminal dễ nhìn
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Đang khởi động toàn bộ hệ thống Security-Shop...${NC}\n"

# 1. Chạy Database & Redis (Docker)
echo -e "${BLUE}[1/4] Khởi động PostgreSQL và Redis qua Docker...${NC}"
docker-compose up -d

# Chờ PostgreSQL thực sự sẵn sàng nhận kết nối
echo -e "${YELLOW}⏳ Chờ PostgreSQL khởi động...${NC}"
until docker-compose exec -T db pg_isready -U admin -d ecommerce_db > /dev/null 2>&1; do
  sleep 1
done
echo -e "${GREEN}✅ PostgreSQL đã sẵn sàng.${NC}"

# 2. Chạy Hacker Server (Cổng 4000)
echo -e "${BLUE}[2/4] Khởi động Hacker Server...${NC}"
cd hacker_server
node server.js &
HACKER_PID=$!
cd ..

# 3. Chạy Backend (FastAPI trên Cổng 8000)
echo -e "${BLUE}[3/4] Khởi động Backend (FastAPI)...${NC}"
cd backend
source venv/bin/activate
uvicorn app.main:app --reload &
BACKEND_PID=$!
cd ..

# 4. Chạy Frontend (React trên Cổng 3000)
echo -e "${BLUE}[4/4] Khởi động Frontend (React/Vite)...${NC}"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo -e "\n${GREEN}✅ HOÀN TẤT! Toàn bộ hệ thống đã chạy thành công.${NC}"
echo -e "🌐 Frontend:    http://localhost:3000"
echo -e "⚙️  Backend:     http://localhost:8000"
echo -e "😈 Hacker Server: http://localhost:4000"
echo -e "\n${RED}🛑 BẤM Ctrl + C để tắt toàn bộ hệ thống.${NC}\n"

# Bắt sự kiện Ctrl+C (SIGINT) để tự động tắt gọn gàng các tiến trình chạy ngầm
trap "echo -e '\n${RED}🛑 Đang tắt toàn bộ hệ thống...${NC}'; kill $BACKEND_PID $HACKER_PID $FRONTEND_PID; docker-compose stop; exit 0" SIGINT SIGTERM

# Chờ các tiến trình chạy (nếu không script sẽ kết thúc ngay)
wait
