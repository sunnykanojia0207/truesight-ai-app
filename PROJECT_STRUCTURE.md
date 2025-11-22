# TrueSight AI - Project Structure

## Directory Layout

```
truesight-ai/
├── frontend/                    # React frontend application
│   ├── src/
│   │   ├── main.tsx            # Application entry point
│   │   ├── App.tsx             # Root component
│   │   ├── index.css           # Global styles with Tailwind
│   │   └── vite-env.d.ts       # TypeScript environment definitions
│   ├── index.html              # HTML template
│   ├── vite.config.ts          # Vite configuration
│   ├── tsconfig.json           # TypeScript configuration
│   ├── tsconfig.node.json      # TypeScript config for Node
│   ├── tailwind.config.js      # Tailwind CSS configuration
│   ├── postcss.config.js       # PostCSS configuration
│   ├── package.json            # Frontend dependencies
│   ├── .env.example            # Environment variables template
│   ├── .eslintrc.cjs           # ESLint configuration
│   ├── Dockerfile              # Docker configuration
│   └── nginx.conf              # Nginx config for production
│
├── backend/                     # Node.js backend gateway
│   ├── src/
│   │   └── index.ts            # Server entry point
│   ├── tsconfig.json           # TypeScript configuration
│   ├── package.json            # Backend dependencies
│   ├── .env.example            # Environment variables template
│   └── Dockerfile              # Docker configuration
│
├── ai-engine/                   # Python AI engine
│   ├── main.py                 # FastAPI application entry
│   ├── requirements.txt        # Python dependencies
│   ├── .env.example            # Environment variables template
│   └── Dockerfile              # Docker configuration
│
├── .kiro/                       # Kiro spec files
│   └── specs/
│       └── truesight-ai-detector/
│           ├── requirements.md  # Feature requirements
│           ├── design.md        # System design
│           └── tasks.md         # Implementation tasks
│
├── docker-compose.yml           # Docker Compose orchestration
├── package.json                 # Root package.json for monorepo
├── .gitignore                   # Git ignore rules
├── README.md                    # Project documentation
└── PROJECT_STRUCTURE.md         # This file

```

## Service Ports

- **Frontend**: http://localhost:5173
- **Backend Gateway**: http://localhost:3000
- **AI Engine**: http://localhost:8000
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379

## Technology Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- shadcn/ui for components
- Zustand for state management
- React Query for data fetching
- Axios for HTTP requests

### Backend Gateway
- Node.js 18+ with Express
- TypeScript
- MongoDB with Mongoose
- Redis for caching and rate limiting
- Multer for file uploads
- Winston for logging

### AI Engine
- Python 3.10+
- FastAPI for REST API
- PyTorch for deep learning
- OpenCV for image processing
- Transformers for CLIP models
- Pillow for image manipulation
- ffmpeg-python for video processing

## Getting Started

1. **Install dependencies**:
   ```bash
   # Frontend
   cd frontend && npm install
   
   # Backend
   cd backend && npm install
   
   # AI Engine
   cd ai-engine && pip install -r requirements.txt
   ```

2. **Set up environment variables**:
   ```bash
   cp frontend/.env.example frontend/.env
   cp backend/.env.example backend/.env
   cp ai-engine/.env.example ai-engine/.env
   ```

3. **Start with Docker Compose** (recommended):
   ```bash
   docker-compose up
   ```

   Or **start services individually**:
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev
   
   # Terminal 2 - AI Engine
   cd ai-engine && uvicorn main:app --reload --port 8000
   
   # Terminal 3 - Frontend
   cd frontend && npm run dev
   ```

## Next Steps

Continue with task 2: Implement Backend Gateway core infrastructure
