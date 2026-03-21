# Football Talent Analysis System

An AI-powered platform for analyzing football performance through video analysis. Upload videos of football drills and get detailed metrics on player performance including speed, balance, agility, stride length, and coordination.

## Architecture

This is a full-stack application with:
- **Backend**: Python Flask API with OpenCV and MediaPipe for AI analysis
- **Frontend**: Next.js 16 with React for modern UI
- **Database**: MongoDB for data persistence
- **Authentication**: JWT-based authentication with bcrypt password hashing

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- MongoDB (local or Atlas)
- pnpm (or npm/yarn)

### 1. Setup Backend

```bash
# Install Python dependencies
uv init --bare
uv add flask flask-cors python-dotenv pymongo pydantic werkzeug opencv-python mediapipe numpy bcrypt pyjwt

# Or use pip
pip install -r requirements.txt
```

### 2. Configure Environment

Create a `.env` file in the project root:

```bash
# Copy from example
cp .env.example .env

# Edit .env with your configuration
```

Edit `.env` with your settings:
```
MONGO_URI=mongodb://localhost:27017/football_analysis
JWT_SECRET=your-secret-key-change-in-production
FLASK_ENV=development
API_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
```

### 3. Start Backend

```bash
python run.py
```

The API will be available at `http://localhost:5000`

API endpoints:
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/videos/upload` - Upload video
- `POST /api/videos/{id}/analyze` - Analyze video
- `GET /api/videos/results/{id}` - Get analysis results
- `GET /api/videos/user-videos` - Get user's videos

### 4. Setup Frontend

```bash
# Install dependencies
pnpm install

# Create .env.local (optional, defaults work locally)
# API_URL=http://localhost:5000

# Start dev server
pnpm dev
```

The frontend will be available at `http://localhost:3000`

## Project Structure

```
.
├── api/                          # Python Flask backend
│   ├── app.py                   # Main Flask app
│   ├── config.py                # Configuration
│   ├── db.py                    # MongoDB connection
│   ├── models.py                # Pydantic schemas
│   ├── auth.py                  # Authentication helpers
│   ├── analysis.py              # AI analysis engine
│   ├── routes_auth.py           # Auth endpoints
│   └── routes_video.py          # Video endpoints
├── app/                          # Next.js frontend
│   ├── page.tsx                 # Home page
│   ├── login/                   # Login page
│   ├── register/                # Register page
│   ├── dashboard/               # Main dashboard
│   ├── results/[id]/            # Results page
│   ├── api/                     # Next.js API routes (proxy)
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Global styles
├── components/                   # React components
│   ├── header.tsx               # App header
│   ├── video-upload-form.tsx    # Upload form
│   └── ui/                      # shadcn/ui components
├── lib/                          # Utilities
│   ├── auth-context.tsx         # Auth state management
│   └── protected-route.tsx      # Route protection
├── run.py                        # Flask server entry point
├── pyproject.toml               # Python dependencies
└── package.json                 # Node.js dependencies
```

## Key Features

### Authentication
- User registration with email and password
- Secure login with JWT tokens
- Password hashing with bcrypt
- Protected routes for authenticated users

### Video Analysis
- Support for multiple video formats (MP4, MOV, AVI, MKV)
- Video upload with metadata
- AI-powered analysis using:
  - **MediaPipe Pose Detection**: Detects 33 body landmarks
  - **OpenCV**: Frame extraction and processing
  - **Custom Metrics**: Calculates performance indicators

### Performance Metrics
1. **Speed Metrics**
   - Average speed (0-100)
   - Max speed (0-100)

2. **Agility Metrics**
   - Balance score (0-100)
   - Agility score (0-100)
   - Stride length (0-100)

3. **Overall Score** (0-100)
   - Composite of all metrics
   - Normalized for easy comparison

4. **Analysis Metadata**
   - Frames processed
   - Confidence level
   - Processing time

## API Examples

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "player123",
    "email": "player@example.com",
    "password": "securepass123",
    "full_name": "John Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "player@example.com",
    "password": "securepass123"
  }'
```

### Upload Video
```bash
curl -X POST http://localhost:5000/api/videos/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "video=@path/to/video.mp4" \
  -F "title=Sprint Test 1" \
  -F "drill_type=sprint" \
  -F "duration_seconds=30"
```

### Analyze Video
```bash
curl -X POST http://localhost:5000/api/videos/{video_id}/analyze \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Results
```bash
curl -X GET http://localhost:5000/api/videos/results/{result_id} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Technology Stack

### Backend
- **Flask**: Lightweight Python web framework
- **MongoDB**: Document database
- **MediaPipe**: ML framework for pose detection
- **OpenCV**: Computer vision library
- **NumPy**: Numerical computing
- **PyJWT**: JWT token handling
- **bcrypt**: Password hashing

### Frontend
- **Next.js 16**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Component library
- **SWR**: Data fetching and caching

## Configuration

### Environment Variables

**Backend (.env)**
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens (change in production!)
- `FLASK_ENV`: Environment (development/production)
- `API_HOST`: API host (default: 0.0.0.0)
- `API_PORT`: API port (default: 5000)
- `FRONTEND_URL`: Frontend URL for CORS

**Frontend (.env.local)**
- `API_URL`: Backend API URL (default: http://localhost:5000)

## Deployment

### Backend (Python Flask)
1. Set `FLASK_ENV=production`
2. Update `JWT_SECRET` with a strong value
3. Update `MONGO_URI` with production MongoDB connection
4. Deploy to Heroku, Railway, or any Python hosting

### Frontend (Next.js)
1. Update `API_URL` to production backend URL
2. Run `pnpm build`
3. Deploy to Vercel, Netlify, or any Node.js hosting

## Development Tips

### Debug Mode
Add debug statements with `console.log("[v0] ...")`

### Testing Uploads
The system accepts videos up to 500MB. For testing, use short video clips.

### Video Processing
Frame sampling rate is set to 5 (processes every 5th frame). Adjust in `api/config.py` for performance vs accuracy trade-offs.

## Troubleshooting

### MongoDB Connection Fails
- Ensure MongoDB is running: `mongod`
- Check `MONGO_URI` in `.env`
- For MongoDB Atlas, whitelist your IP

### Video Upload Fails
- Check video format (MP4, MOV, AVI, MKV)
- Ensure file size < 500MB
- Verify permissions on upload folder

### Analysis Errors
- Ensure FFmpeg is installed (required by OpenCV)
- Check video file integrity
- Verify sufficient disk space for processing

### CORS Issues
- Check `FRONTEND_URL` in backend config
- Ensure backend is running on correct port
- Check browser console for specific errors

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please refer to the documentation or create an issue in the repository.
