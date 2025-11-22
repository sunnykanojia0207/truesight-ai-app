# TrueSight AI Engine

## Overview

The AI Engine is a Python FastAPI service that performs AI-powered content verification. It analyzes images and videos to detect deepfakes, AI-generated content, and manipulations.

## Status: 🚧 IN PROGRESS

Task 10 complete - FastAPI application set up with basic structure.

## Features

### ✅ Implemented
- FastAPI application with CORS
- Health check endpoint
- API key authentication
- Logging configuration
- Environment-based configuration
- Analysis endpoints (mock responses)

### 🚧 In Progress
- Image preprocessing pipeline
- CLIP-based classifier
- Deepfake detection
- GAN fingerprint detection
- Image forgery detection
- Metadata extraction
- Video processing

## API Endpoints

### Health Check
```
GET /health
```
Returns AI Engine health and model status.

### Analyze Image
```
POST /analyze/image
Content-Type: multipart/form-data
X-API-Key: your-api-key

Body: image file
```
Analyzes an image for AI generation and manipulation.

### Analyze Video
```
POST /analyze/video
Content-Type: multipart/form-data
X-API-Key: your-api-key

Body: video file
```
Analyzes a video for deepfakes and AI generation.

## Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Run development server
uvicorn main:app --reload --port 8000
```

## Environment Variables

```bash
# API Configuration
API_KEY=your-secret-key

# Model Configuration
MODELS_DIR=./models
DEVICE=cpu  # or 'cuda' for GPU

# Processing Configuration
MAX_VIDEO_DURATION_SECONDS=300
FRAME_EXTRACTION_INTERVAL_SECONDS=1
MAX_BATCH_SIZE=8

# Logging
LOG_LEVEL=INFO
```

## Project Structure

```
ai-engine/
├── main.py                 # FastAPI application
├── config.py              # Configuration settings
├── requirements.txt       # Python dependencies
├── models/               # AI models directory
│   └── __init__.py
├── routes/               # API routes
│   ├── __init__.py
│   └── analyze.py        # Analysis endpoints
└── utils/                # Utility modules
    ├── __init__.py
    └── logger.py         # Logging utilities
```

## Testing

```bash
# Test health endpoint
curl http://localhost:8000/health

# Test image analysis (with API key)
curl -X POST http://localhost:8000/analyze/image \
  -H "X-API-Key: your-api-key" \
  -F "image=@test.jpg"

# Test video analysis (with API key)
curl -X POST http://localhost:8000/analyze/video \
  -H "X-API-Key: your-api-key" \
  -F "video=@test.mp4"

# View API documentation
open http://localhost:8000/docs
```

## Development

### Adding New Models

1. Create model class in `models/` directory
2. Load model in `main.py` startup event
3. Update `models_loaded` dictionary
4. Use model in analysis routes

### Adding New Endpoints

1. Create route in `routes/` directory
2. Include router in `main.py`
3. Add authentication if needed
4. Update documentation

## Next Steps

- [ ] Task 11: Implement image preprocessing pipeline
- [ ] Task 12: Implement CLIP-based classifier
- [ ] Task 13: Implement deepfake detection
- [ ] Task 14: Implement GAN fingerprint detection
- [ ] Task 15: Implement image forgery detection
- [ ] Task 16: Implement metadata extraction
- [ ] Task 17: Implement model source prediction
- [ ] Task 18: Implement Truth Score aggregation
- [ ] Task 19: Complete image analysis endpoint
- [ ] Task 20: Implement video processing
- [ ] Task 21: Complete video analysis endpoint

## License

MIT
