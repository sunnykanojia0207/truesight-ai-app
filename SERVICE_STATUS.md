# TrueSight AI - Services Status

## ✅ Currently Running Services

### 1. Frontend (React + Vite)
- **Status**: ✅ RUNNING
- **URL**: http://localhost:5173/
- **Process ID**: 14
- **Description**: User interface for uploading and analyzing images/videos
- **Access**: Open http://localhost:5173/ in your browser

### 2. Backend Gateway (Node.js + Express)
- **Status**: ✅ RUNNING  
- **URL**: http://localhost:3000/
- **Process ID**: 13
- **Database**: MongoDB connected ✅
- **Redis**: Disabled (using memory-based rate limiting)
- **Health Check**: http://localhost:3000/api/health
- **Description**: API gateway handling uploads, database, and AI engine communication

### 3. AI Engine (Python + FastAPI)
- **Status**: ⏳ INSTALLING DEPENDENCIES
- **URL**: http://localhost:8000/ (when ready)
- **Process ID**: 17
- **Description**: AI models for deepfake detection and content analysis
- **Note**: Installing PyTorch, Transformers, and OpenCV (5-10 minutes)

## 🎯 What You Can Do Now

### Option 1: Test the Frontend & Backend
1. Open http://localhost:5173/ in your browser
2. The UI will load successfully
3. You can explore the interface
4. Analysis won't work until AI Engine finishes installing

### Option 2: Check Backend API
```bash
curl http://localhost:3000/api/health
```

### Option 3: Monitor AI Engine Installation
The AI engine is currently installing large ML libraries:
- PyTorch (~2GB)
- Transformers (~500MB)
- OpenCV and other dependencies

This typically takes 5-10 minutes on first install.

## 📊 Service URLs Summary

| Service | URL | Status |
|---------|-----|--------|
| Frontend | http://localhost:5173/ | ✅ Ready |
| Backend API | http://localhost:3000/ | ✅ Ready |
| AI Engine | http://localhost:8000/ | ⏳ Installing |

## 🔧 Commands

### Stop All Services
Run in PowerShell:
```powershell
# Stop all background processes
Get-Process | Where-Object {$_.ProcessName -like "*node*" -or $_.ProcessName -like "*python*"} | Stop-Process -Force
```

### Restart Individual Service
- **Backend**: `cd backend && npm run dev`
- **Frontend**: `cd frontend && npm run dev`  
- **AI Engine**: `start-ai-engine.bat`

## 📝 Notes

- MongoDB is running and connected
- Redis is disabled for testing (using in-memory rate limiting)
- File uploads are stored in `backend/uploads/`
- Logs are available in `backend/logs/`

## ⏰ Estimated Time to Full Operation

- Frontend: ✅ Ready now
- Backend: ✅ Ready now
- AI Engine: ⏳ 5-10 minutes (first-time installation)

Once AI Engine completes installation, all services will be fully operational!
