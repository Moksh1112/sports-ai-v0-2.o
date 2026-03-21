#!/bin/bash

# Football Talent Analysis - Development Server Starter
# This script starts both the Flask backend and Next.js frontend

echo "=========================================="
echo "Football Talent Analysis - Dev Starter"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

# Check if Node is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    exit 1
fi

echo -e "${BLUE}ℹ️  Starting Flask backend on http://localhost:5000...${NC}"
uv run run.py &
FLASK_PID=$!

sleep 2

echo -e "${BLUE}ℹ️  Starting Next.js frontend on http://localhost:3000...${NC}"
pnpm dev &
NEXTJS_PID=$!

echo ""
echo -e "${GREEN}✅ Both servers are starting!${NC}"
echo ""
echo "Flask PID:   $FLASK_PID"
echo "Next.js PID: $NEXTJS_PID"
echo ""
echo "Open http://localhost:3000 in your browser"
echo ""
echo "To stop all servers, press Ctrl+C"
echo ""

# Keep the script running
wait $FLASK_PID $NEXTJS_PID
