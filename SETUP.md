# Setup Guide - Football Talent Analysis System

This guide will walk you through setting up the AI Football Talent Analysis System for local development or production deployment.

## Prerequisites

### System Requirements
- **OS**: macOS, Linux, or Windows with WSL2
- **Python**: 3.9 or higher
- **Node.js**: 18.0 or higher
- **MongoDB**: Local installation or MongoDB Atlas account
- **RAM**: At least 4GB for smooth operation
- **Disk Space**: At least 10GB for videos and dependencies

### Installing Prerequisites

#### Python
```bash
# macOS with Homebrew
brew install python@3.11

# Ubuntu/Debian
sudo apt-get install python3.11 python3.11-venv

# Windows
# Download from https://www.python.org/downloads/
```

#### Node.js
```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Or download from https://nodejs.org/
```

#### MongoDB

**Option 1: Local Installation**
```bash
# macOS
brew tap mongodb/brew
brew install mongodb-community

# Ubuntu/Debian
curl https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
mongod
```

**Option 2: MongoDB Atlas (Cloud)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a cluster
4. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/football_analysis?retryWrites=true`

## Installation Steps

### 1. Clone or Download Repository
```bash
cd /path/to/project
```

### 2. Backend Setup

#### Create Python Environment
```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate
```

#### Install Python Dependencies
```bash
# Install uv (faster dependency manager)
pip install uv

# Install dependencies from pyproject.toml
uv add flask flask-cors python-dotenv pymongo pydantic werkzeug opencv-python mediapipe numpy bcrypt pyjwt

# Or use pip
pip install flask flask-cors python-dotenv pymongo pydantic werkzeug opencv-python mediapipe numpy bcrypt pyjwt
```

#### Configure Environment Variables
```bash
# Copy example file
cp .env.example .env

# Edit .env file with your settings
nano .env  # or use your preferred editor
```

**Required values in .env:**
```
MONGO_URI=mongodb://localhost:27017/football_analysis
# Or for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/football_analysis?retryWrites=true

JWT_SECRET=your-super-secret-key-change-this-in-production
FLASK_ENV=development
API_HOST=0.0.0.0
API_PORT=5000
FRONTEND_URL=http://localhost:3000
```

#### Verify Backend Setup
```bash
# Test Flask import
python -c "import flask; print('Flask OK')"

# Test other dependencies
python -c "import cv2; print('OpenCV OK')"
python -c "import mediapipe; print('MediaPipe OK')"
python -c "import pymongo; print('MongoDB OK')"
```

### 3. Frontend Setup

#### Install Node.js Dependencies
```bash
# Install pnpm (faster npm)
npm install -g pnpm

# Install project dependencies
pnpm install

# Or use npm
npm install
```

#### Configure Frontend (Optional)
```bash
# Create .env.local if you need custom API URL
echo "API_URL=http://localhost:5000" > .env.local
```

## Running the Application

### Start Backend (Terminal 1)
```bash
# Activate Python environment first (if not already)
source venv/bin/activate  # macOS/Linux
# or
venv\Scripts\activate  # Windows

# Start Flask server
python run.py

# You should see:
# [v0] Starting Football Analysis API on 0.0.0.0:5000
# [v0] Environment: development
```

### Start MongoDB (Terminal 2)
```bash
# Only if using local MongoDB
mongod

# You should see:
# [connection] connection accepted from ...
```

### Start Frontend (Terminal 3)
```bash
# Navigate to project root
pnpm dev

# You should see:
# ▲ Next.js 16.0.0
# Local: http://localhost:3000
```

## Verify Installation

1. **Check Backend API**
   ```bash
   curl http://localhost:5000/api/health
   # Should return: {"status": "ok", "message": "API is running"}
   ```

2. **Check Frontend**
   - Open http://localhost:3000
   - You should see the Football Analysis home page

3. **Test Registration**
   - Click "Sign Up"
   - Create an account
   - Should redirect to dashboard

4. **Test Video Upload**
   - On dashboard, click "Upload Video"
   - Select a video file (MP4, MOV, etc.)
   - Enter title and drill type
   - Upload should succeed

## Production Deployment

### Backend Deployment (Flask)

#### Using Heroku
```bash
# Install Heroku CLI
brew tap heroku/brew && brew install heroku

# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set MONGO_URI="your-mongodb-uri"
heroku config:set JWT_SECRET="your-secret-key"
heroku config:set FLASK_ENV="production"

# Deploy
git push heroku main

# Check logs
heroku logs --tail
```

#### Using Railway
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
railway up
```

#### Using Docker
```bash
# Create Dockerfile (if not exists)
cat > Dockerfile << 'EOF'
FROM python:3.11-slim
WORKDIR /app
COPY pyproject.toml .
RUN pip install -e .
COPY . .
CMD ["python", "run.py"]
EOF

# Build and run
docker build -t football-analysis .
docker run -p 5000:5000 --env-file .env football-analysis
```

### Frontend Deployment (Next.js)

#### Using Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# API_URL=https://your-backend-url.com
```

#### Using Netlify
```bash
# Build the app
pnpm build

# Deploy the .next folder to Netlify
# Set environment variable:
# API_URL=https://your-backend-url.com
```

### Database Deployment

#### MongoDB Atlas (Recommended)
1. Create cluster at https://www.mongodb.com/cloud/atlas
2. Get connection string
3. Add whitelist IP
4. Update `MONGO_URI` in production environment variables

## Troubleshooting

### Backend Won't Start

**Error: "Port 5000 already in use"**
```bash
# Kill process using port 5000
lsof -ti:5000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :5000   # Windows

# Or use different port
API_PORT=5001 python run.py
```

**Error: "MongoDB connection refused"**
```bash
# Check MongoDB is running
# Local: mongod must be running in another terminal
# Atlas: Check connection string and IP whitelist
```

**Error: "ModuleNotFoundError"**
```bash
# Reinstall dependencies
pip install --force-reinstall flask opencv-python mediapipe
```

### Frontend Won't Start

**Error: "Port 3000 already in use"**
```bash
pnpm dev -- -p 3001  # Use different port
```

**Error: "Cannot find API"**
```bash
# Check API_URL in .env.local
# Make sure backend is running on correct port
curl http://localhost:5000/api/health
```

### Video Upload Fails

**"File too large"**
- Max size is 500MB
- Reduce video resolution or duration

**"Invalid video format"**
- Ensure video is in MP4, MOV, AVI, or MKV format
- Try converting with FFmpeg:
  ```bash
  ffmpeg -i input.mov -c:v libx264 output.mp4
  ```

**"Analysis fails"**
- Check video file is valid
- Ensure sufficient disk space
- Check backend logs for errors

## Environment Variables Reference

### Backend (.env)
```
MONGO_URI              # MongoDB connection string (required)
JWT_SECRET             # Secret for JWT tokens (required, change in production!)
FLASK_ENV              # development or production (default: development)
API_HOST               # API host (default: 0.0.0.0)
API_PORT               # API port (default: 5000)
FRONTEND_URL           # Frontend URL for CORS (default: http://localhost:3000)
```

### Frontend (.env.local)
```
API_URL                # Backend API URL (default: http://localhost:5000)
```

## Next Steps

1. **Read the README.md** for feature overview and API documentation
2. **Explore the code** in `api/` and `app/` directories
3. **Test the features** - upload videos and analyze them
4. **Customize settings** in `api/config.py` for your needs
5. **Deploy to production** following the deployment guides

## Getting Help

- Check logs: `python run.py` and `pnpm dev`
- Review error messages carefully
- Check the README.md for API examples
- Verify all prerequisites are installed correctly

## Tips for Success

- Keep Python and Node.js updated
- Use virtual environments for Python
- Keep MongoDB running while developing
- Use VS Code or similar IDE for better development experience
- Test with small video files first
- Keep backups of your `.env` file (but never commit to git!)

Good luck with your Football Talent Analysis System!
