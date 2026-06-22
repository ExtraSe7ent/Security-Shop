#!/bin/bash


GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' 

echo -e "${YELLOW}🚀 Starting Security-Shop...${NC}\n"

echo -e "${BLUE}[1/4] Starting PostgreSQL via Docker...${NC}"
docker-compose up -d

echo -e "${YELLOW}⏳ Waiting for PostgreSQL...${NC}"
until docker-compose exec -T postgres pg_isready -U admin -d ecommerce_db > /dev/null 2>&1; do
  sleep 1
done
echo -e "${GREEN}✅ PostgreSQL ready.${NC}"

echo -e "${BLUE}[2/4] Starting Hacker Server...${NC}"
cd hacker_server
node server.js &
HACKER_PID=$!
cd ..

echo -e "${BLUE}[3/4] Starting Backend (FastAPI)...${NC}"
cd backend
source venv/bin/activate
uvicorn app.main:app --reload &
BACKEND_PID=$!
cd ..

echo -e "${BLUE}[4/4] Starting Frontend (React/Vite)...${NC}"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo -e "\n${GREEN}✅ DONE! All systems running.${NC}"
echo -e "🌐 Frontend:    http://localhost:5173"
echo -e "⚙️  Backend:     http://localhost:8000"
echo -e "😈 Hacker Server: http://localhost:4000"
echo -e "\n${RED}🛑 Press Ctrl + C to stop all systems.${NC}\n"

trap "echo -e '\n${RED}🛑 Stopping all systems...${NC}'; kill $BACKEND_PID $HACKER_PID $FRONTEND_PID; docker-compose stop; exit 0" SIGINT SIGTERM

wait
