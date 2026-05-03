#!/usr/bin/env bash
set -e

# Install backend dependencies
cd backend
pip install -r requirements.txt -q
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "Backend started (PID $BACKEND_PID) → http://localhost:8000"

# Install and start frontend
cd ../frontend
npm install --silent
npm run dev &
FRONTEND_PID=$!
echo "Frontend started (PID $FRONTEND_PID) → http://localhost:5173"

echo ""
echo "============================="
echo "  MF Portfolio Intelligence"
echo "============================="
echo "  Frontend : http://localhost:5173"
echo "  Backend  : http://localhost:8000"
echo "  API Docs : http://localhost:8000/docs"
echo "============================="

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
