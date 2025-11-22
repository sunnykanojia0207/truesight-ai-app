# Running TrueSight AI

## Quick Start Guide

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- MongoDB (optional - can use Docker)
- Redis (optional - can use Docker)

## Option 1: Run Everything with Docker (Recommended)

```bash
# From project root
docker-compose up
```

This will start:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- AI Engine: http://localhost:8000
- MongoDB: localhost:27017
- Redis: localhost:6379

## Option 2: Run Services Individually

### 1. Start MongoDB and Redis (with Docker)

```bash
docker-compose up mongodb redis
```

Or install them locally on your system.

### 2. Start Backend Gateway

```bash
# Terminal 1
cd backend
npm install
npm run dev
```

Backend will run on http://localhost:3000

### 3. Start AI Engine

```bash
# Terminal 2
cd ai-engine
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

AI Engine will run on http://localhost:8000

### 4. Start Frontend

```bash
# Terminal 3
cd frontend
npm install
npm run dev
```

Frontend will run on http://localhost:5173

## Testing the Application

### 1. Open Frontend
Navigate to http://localhost:5173

### 2. Upload an Image
- Drag and drop an image or click to browse
- Supported formats: JPEG, PNG, WebP (max 10MB)
- Click "Analyze" button

### 3. View Results
- You'll be redirected to the results page
- The analysis will show:
  - Truth Score (0-100)
  - AI-generated probability
  - Deepfake detection results
  - GAN fingerprint detection

## API Endpoints

### Backend Gateway
- Health: http://localhost:3000/api/health
- Upload Image: POST http://localhost:3000/api/upload/image
- Upload Video: POST http://localhost:3000/api/upload/video
- Get Analysis: GET http://localhost:3000/api/analysis/:id
- History: GET http://localhost:3000/api/history

### AI Engine
- Health: http://localhost:8000/health
- Analyze Image: POST http://localhost:8000/analyze/image
- API Docs: http://localhost:8000/docs

## Environment Variables

### Backend (.env)
```bash
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/truesight
REDIS_URL=redis://localhost:6379
AI_ENGINE_URL=http://localhost:8000
AI_ENGINE_API_KEY=dev-secret-key-change-in-production
CORS_ORIGIN=http://localhost:5173
```

### AI Engine (.env)
```bash
API_KEY=dev-secret-key-change-in-production
DEVICE=cpu
LOG_LEVEL=INFO
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:3000/api
```

## Troubleshooting

### Frontend won't start
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Backend won't connect to MongoDB
- Make sure MongoDB is running: `docker-compose up mongodb`
- Check connection string in backend/.env

### AI Engine errors
```bash
cd ai-engine
pip install --upgrade -r requirements.txt
```

### CORS errors
- Make sure CORS_ORIGIN in backend/.env matches frontend URL
- Default: http://localhost:5173

## Development Tips

### Hot Reload
All services support hot reload:
- Frontend: Vite automatically reloads
- Backend: tsx watch reloads on changes
- AI Engine: uvicorn --reload reloads on changes

### Logs
- Backend: logs/combined.log and logs/error.log
- AI Engine: Console output
- Frontend: Browser console

### Testing API Directly

```bash
# Upload image
curl -X POST http://localhost:3000/api/upload/image \
  -F "file=@test.jpg"

# Check health
curl http://localhost:3000/api/health
curl http://localhost:8000/health
```

## What's Working

✅ **Backend Gateway**
- File upload (images & videos)
- URL analysis (direct URLs)
- Database storage
- Rate limiting
- Security middleware

✅ **AI Engine**
- CLIP-based classification
- Deepfake face detection
- GAN fingerprint detection
- Image preprocessing

✅ **Frontend**
- File upload with drag & drop
- Progress indicators
- Navigation
- Error handling

## What's Not Implemented Yet

❌ Video processing (returns mock data)
❌ URL input in frontend
❌ Screenshot paste
❌ Results visualization
❌ History view
❌ Image forgery detection
❌ Metadata extraction
❌ Model source prediction

## Next Steps

1. **Test the current system**: Upload an image and see the analysis
2. **Check logs**: Monitor backend and AI engine logs
3. **Continue development**: Build remaining UI components

## Support

If you encounter issues:
1. Check all services are running
2. Verify environment variables
3. Check logs for errors
4. Ensure ports are not in use

## Quick Commands

```bash
# Install all dependencies
npm install && cd backend && npm install && cd ../frontend && npm install && cd ..

# Start everything (requires Docker)
docker-compose up

# Start backend only
cd backend && npm run dev

# Start AI engine only
cd ai-engine && uvicorn main:app --reload

# Start frontend only
cd frontend && npm run dev
```

Enjoy using TrueSight AI! 🔍
