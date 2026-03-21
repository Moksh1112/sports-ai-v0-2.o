# Development Setup Guide

This document explains how to run the Football Talent Analysis System in development mode with both the Flask backend and Next.js frontend.

## Prerequisites

You need both Python and Node.js installed:
- Python 3.8+
- Node.js 18+
- pnpm (or npm/yarn)

## Quick Start (Two Terminal Windows)

### Terminal 1: Start the Flask Backend

```bash
# Navigate to project root
cd /path/to/project

# Install Python dependencies (first time only)
uv sync

# Start the Flask API server
uv run run.py
```

You should see output like:
```
[v0] Starting Football Analysis API on 0.0.0.0:5000
[v0] Environment: development
[v0] API available at http://localhost:5000
```

### Terminal 2: Start the Next.js Frontend

```bash
# Navigate to project root (in a new terminal)
cd /path/to/project

# Install Node dependencies (first time only)
pnpm install

# Start the Next.js development server
pnpm dev
```

You should see output like:
```
  ▲ Next.js 16.x.x
  ✓ Ready in 2.1s
  ➜ Local: http://localhost:3000
```

## Accessing the Application

1. Open your browser to `http://localhost:3000`
2. You should see the Football Talent Analysis landing page
3. Click "Sign Up" or "Sign In" to access the application

## Troubleshooting

### "Backend server is not running" Error

If you see this error when trying to log in or register:

1. Make sure you've started the Flask backend in Terminal 1
2. Check that it's running on port 5000: `http://localhost:5000/api/health` (if your backend has a health check)
3. Verify `.env.local` has `API_URL=http://localhost:5000`

### Port Already in Use

If port 5000 or 3000 is already in use:

**For Flask (port 5000):**
```bash
# Set a different port
export API_PORT=5001
uv run run.py
# Then update .env.local to API_URL=http://localhost:5001
```

**For Next.js (port 3000):**
```bash
pnpm dev -- -p 3001
```

### Python Dependencies Missing

If you get import errors or dependency resolution errors:

```bash
# Remove the lock file that may have conflicting versions
rm uv.lock

# Reinstall all dependencies
uv sync
```

If you see errors like "No solution found when resolving dependencies for pyjwt":
1. Delete `uv.lock` file
2. Run `uv sync` again
3. The tool will resolve compatible versions automatically

This happens because uv tries to find versions compatible across multiple Python environments. Removing the lock file forces it to recalculate.

### Node Dependencies Missing

If you get module not found errors:
```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## Environment Variables

See `.env.example` for all available environment variables. Local overrides go in `.env.local`:

```
API_URL=http://localhost:5000
FLASK_ENV=development
JWT_SECRET=dev-secret-key-change-in-production
```

## MongoDB Setup (Optional)

By default, the Flask backend uses MongoDB. For development:

### Using MongoDB Atlas (Cloud)
1. Create a MongoDB Atlas account
2. Create a cluster and get your connection string
3. Set in your environment: `MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/football_analysis`

### Using Local MongoDB
1. Install MongoDB locally
2. Start MongoDB: `mongod`
3. Connection string: `MONGO_URI=mongodb://localhost:27017/football_analysis`

## Development Tips

### Hot Reload
- **Next.js**: Automatically reloads when you save files
- **Flask**: Automatically reloads in development mode when you save Python files

### Debug Logging
Enable verbose logging by adding to your code:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Testing Authentication
Use the development credentials:
- Email: `test@example.com`
- Password: `password123`

(Note: Create these via the registration page first)

## Next Steps

1. Review the API documentation in `README.md`
2. Check the database schema in `SETUP.md`
3. Explore the codebase structure in the main folders:
   - `app/` - Next.js pages and API routes
   - `api/` - Flask backend code
   - `components/` - React components
   - `lib/` - Shared utilities

## Getting Help

If you encounter issues:
1. Check the error message - it usually tells you what's wrong
2. Ensure both servers are running
3. Check `.env.local` configuration
4. Review the setup guide in `SETUP.md`
5. Check Flask/Next.js logs for detailed errors
