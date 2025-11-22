# 🔍 TrueSight AI - AI Real vs Fake Content Detector

TrueSight AI is a comprehensive web application that verifies whether images or videos are real or AI-generated. The system uses advanced AI models to detect deepfakes, manipulated content, and AI-generated media.

## 🚀 Features

- **Image Analysis**: Upload images to detect AI generation and manipulation
- **Video Analysis**: Analyze videos for deepfakes with frame-by-frame breakdown
- **URL Support**: Verify content from URLs (Instagram, YouTube, direct links)
- **Screenshot Mode**: Paste screenshots directly for quick verification
- **Detailed Reports**: Truth Score, probability breakdown, metadata analysis
- **History Tracking**: Review previous analyses

## 🏗️ Architecture

TrueSight AI consists of three main services:

- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **Backend Gateway**: Node.js + Express + MongoDB + Redis
- **AI Engine**: Python + FastAPI + PyTorch + Multiple AI Models

## 📋 Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- Docker and Docker Compose (recommended)
- MongoDB 7.0+
- Redis 7+

## 🛠️ Installation

### Using Docker Compose (Recommended)

1. Clone the repository
2. Copy environment files:
   ```bash
   cp frontend/.env.example frontend/.env
   cp backend/.env.example backend/.env
   cp ai-engine/.env.example ai-engine/.env
   ```
3. Start all services:
   ```bash
   npm run dev
   ```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- AI Engine: http://localhost:8000

### Manual Setup

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

#### Backend
```bash
cd backend
npm install
npm run dev
```

#### AI Engine
```bash
cd ai-engine
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

## 📝 Environment Variables

### Frontend (.env)
- `VITE_API_URL`: Backend API URL (default: http://localhost:3000/api)

### Backend (.env)
- `PORT`: Server port (default: 3000)
- `MONGODB_URI`: MongoDB connection string
- `REDIS_URL`: Redis connection string
- `AI_ENGINE_URL`: AI Engine URL
- `AI_ENGINE_API_KEY`: API key for AI Engine authentication

### AI Engine (.env)
- `API_KEY`: API key for authentication
- `MODELS_DIR`: Directory for AI models
- `DEVICE`: Computation device (cuda/cpu)

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# AI Engine tests
cd ai-engine
pytest
```

## 📦 Building for Production

```bash
npm run build
```

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 📄 License

MIT License - see LICENSE file for details
