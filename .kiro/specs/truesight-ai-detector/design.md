# Design Document

## Overview

TrueSight AI is a three-tier web application consisting of a React frontend, Node.js backend gateway, and Python AI engine. The system processes images and videos to detect AI-generated content, deepfakes, and manipulations. The architecture separates concerns: the frontend handles user interaction and visualization, the backend manages orchestration and data persistence, and the AI engine performs computationally intensive analysis.

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                  (React + Vite + Tailwind)                   │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Upload     │  │   Results    │  │   History    │     │
│  │  Component   │  │  Dashboard   │  │    View      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API (HTTP/JSON)
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    Backend Gateway                           │
│                      (Node.js + Express)                     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    Upload    │  │     URL      │  │   Database   │     │
│  │   Handler    │  │   Fetcher    │  │   Service    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API (HTTP/JSON)
                         │
┌────────────────────────▼────────────────────────────────────┐
│                      AI Engine                               │
│                   (Python + FastAPI)                         │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Deepfake   │  │     GAN      │  │   Metadata   │     │
│  │   Detector   │  │  Fingerprint │  │   Analyzer   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │     CLIP     │  │   Forgery    │  │    Video     │     │
│  │  Classifier  │  │   Detector   │  │   Processor  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 18 with Vite for fast development
- TypeScript for type safety
- Tailwind CSS for styling
- shadcn/ui for component library
- Zustand for state management
- React Query for API data fetching and caching
- Axios for HTTP requests

**Backend Gateway:**
- Node.js 18+ with Express.js
- TypeScript
- Multer for file upload handling
- MongoDB with Mongoose for data persistence
- Redis for rate limiting and caching
- Axios for AI Engine communication
- Winston for logging

**AI Engine:**
- Python 3.10+
- FastAPI for REST API
- PyTorch for deep learning models
- OpenCV for image/video processing
- Transformers (Hugging Face) for CLIP models
- Pillow for image manipulation
- ffmpeg-python for video processing
- NumPy for numerical operations

**Infrastructure:**
- Docker for containerization
- Docker Compose for local development
- Environment-based configuration

## Components and Interfaces

### Frontend Components

#### 1. Upload Component
**Purpose:** Handle file uploads, URL inputs, and screenshot paste

**Props:**
```typescript
interface UploadComponentProps {
  onUploadComplete: (analysisId: string) => void;
  onError: (error: Error) => void;
}
```

**State:**
```typescript
interface UploadState {
  uploadMode: 'file' | 'url' | 'screenshot';
  isUploading: boolean;
  progress: number;
  error: string | null;
}
```

**Key Features:**
- Drag-and-drop zone with visual feedback
- File type and size validation
- URL input with validation
- Clipboard paste detection for screenshots
- Upload progress indicator

#### 2. Results Dashboard Component
**Purpose:** Display analysis results with visualizations

**Props:**
```typescript
interface ResultsDashboardProps {
  analysisId: string;
}
```

**State:**
```typescript
interface AnalysisResult {
  truthScore: number;
  aiGeneratedProbability: number;
  realProbability: number;
  deepfakeDetection: {
    facesDetected: number;
    deepfakeFaces: Array<{
      boundingBox: [number, number, number, number];
      confidence: number;
    }>;
  };
  manipulationHeatmap: string; // Base64 encoded image
  metadata: {
    exif: Record<string, any>;
    compressionScore: number;
    ganFingerprint: {
      detected: boolean;
      confidence: number;
    };
  };
  predictedSource: 'Midjourney' | 'DALL-E' | 'Stable Diffusion' | 'Sora' | 'Runway' | 'Unknown';
  processingTime: number;
}
```

**Key Features:**
- Truth Score gauge visualization
- Probability breakdown chart
- Interactive image viewer with overlays
- Metadata accordion
- Technical details expandable section

#### 3. History View Component
**Purpose:** Display user's analysis history

**Props:**
```typescript
interface HistoryViewProps {
  userId?: string;
}
```

**Key Features:**
- Grid layout of analysis thumbnails
- Truth Score badges
- Date/time stamps
- Click to view full results
- Pagination for large histories

### Backend Gateway API Endpoints

#### POST /api/upload/image
**Purpose:** Accept image file uploads

**Request:**
```typescript
Content-Type: multipart/form-data
{
  file: File; // Image file
}
```

**Response:**
```typescript
{
  analysisId: string;
  status: 'processing' | 'completed' | 'failed';
  estimatedTime: number; // seconds
}
```

#### POST /api/upload/video
**Purpose:** Accept video file uploads

**Request:**
```typescript
Content-Type: multipart/form-data
{
  file: File; // Video file
}
```

**Response:**
```typescript
{
  analysisId: string;
  status: 'processing';
  estimatedTime: number;
}
```

#### POST /api/analyze/url
**Purpose:** Analyze content from URL

**Request:**
```typescript
{
  url: string;
  type: 'image' | 'video' | 'auto';
}
```

**Response:**
```typescript
{
  analysisId: string;
  status: 'processing';
}
```

#### GET /api/analysis/:analysisId
**Purpose:** Retrieve analysis results

**Response:**
```typescript
{
  id: string;
  status: 'processing' | 'completed' | 'failed';
  result?: AnalysisResult;
  error?: string;
  createdAt: string;
  completedAt?: string;
}
```

#### GET /api/history
**Purpose:** Retrieve user's analysis history

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
}
```

**Response:**
```typescript
{
  analyses: Array<{
    id: string;
    thumbnail: string;
    truthScore: number;
    createdAt: string;
    contentType: 'image' | 'video';
  }>;
  total: number;
  page: number;
  totalPages: number;
}
```

### AI Engine API Endpoints

#### POST /analyze/image
**Purpose:** Analyze image for AI generation and manipulation

**Request:**
```typescript
Content-Type: multipart/form-data
{
  image: File;
}
```

**Response:**
```typescript
{
  truthScore: number;
  aiGeneratedProbability: number;
  realProbability: number;
  deepfakeDetection: DeepfakeResult;
  manipulationHeatmap: string;
  metadata: MetadataResult;
  predictedSource: string;
  processingTime: number;
}
```

#### POST /analyze/video
**Purpose:** Analyze video for AI generation and deepfakes

**Request:**
```typescript
Content-Type: multipart/form-data
{
  video: File;
}
```

**Response:**
```typescript
{
  truthScore: number;
  frameAnalyses: Array<{
    frameNumber: number;
    timestamp: number;
    truthScore: number;
  }>;
  deepfakeDetection: DeepfakeResult;
  metadata: MetadataResult;
  processingTime: number;
}
```

#### GET /health
**Purpose:** Health check endpoint

**Response:**
```typescript
{
  status: 'healthy' | 'unhealthy';
  models: {
    clipClassifier: boolean;
    deepfakeDetector: boolean;
    ganDetector: boolean;
    forgeryDetector: boolean;
  };
}
```

## Data Models

### MongoDB Schemas

#### Analysis Document
```typescript
{
  _id: ObjectId;
  userId?: string; // Optional for anonymous users
  contentType: 'image' | 'video';
  sourceType: 'upload' | 'url' | 'screenshot';
  sourceUrl?: string;
  filePath: string; // Temporary storage path
  thumbnail: string; // Base64 or URL
  status: 'processing' | 'completed' | 'failed';
  result?: {
    truthScore: number;
    aiGeneratedProbability: number;
    realProbability: number;
    deepfakeDetection: {
      facesDetected: number;
      deepfakeFaces: Array<{
        boundingBox: [number, number, number, number];
        confidence: number;
      }>;
    };
    manipulationHeatmap?: string;
    metadata: {
      exif?: Record<string, any>;
      compressionScore: number;
      ganFingerprint: {
        detected: boolean;
        confidence: number;
      };
    };
    predictedSource: string;
    processingTime: number;
    videoTimeline?: Array<{
      frameNumber: number;
      timestamp: number;
      truthScore: number;
    }>;
  };
  error?: string;
  createdAt: Date;
  completedAt?: Date;
  expiresAt: Date; // TTL index for automatic deletion
}
```

## Error Handling

### Frontend Error Handling

**Upload Errors:**
- File size exceeded: Display user-friendly message with size limit
- Invalid file type: Show supported formats
- Network errors: Retry mechanism with exponential backoff

**Analysis Errors:**
- Timeout: Display extended processing message
- Service unavailable: Show maintenance message
- Invalid content: Explain why content cannot be analyzed

### Backend Gateway Error Handling

**Error Response Format:**
```typescript
{
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  requestId: string;
}
```

**Error Codes:**
- `FILE_TOO_LARGE`: File exceeds size limit
- `INVALID_FILE_TYPE`: Unsupported file format
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `AI_ENGINE_UNAVAILABLE`: AI service is down
- `ANALYSIS_FAILED`: Analysis encountered an error
- `INVALID_URL`: URL is malformed or inaccessible

**Error Handling Strategy:**
- Log all errors with Winston
- Return appropriate HTTP status codes
- Sanitize error messages for security
- Implement circuit breaker for AI Engine calls

### AI Engine Error Handling

**Model Loading Errors:**
- Retry model loading on startup
- Return unhealthy status if models fail to load
- Log detailed error information

**Analysis Errors:**
- Catch and log exceptions during inference
- Return partial results if possible
- Timeout protection for long-running analyses

## Testing Strategy

### Frontend Testing

**Unit Tests:**
- Component rendering tests with React Testing Library
- State management tests for Zustand stores
- Utility function tests

**Integration Tests:**
- Upload flow end-to-end
- API integration with mocked backend
- Error handling scenarios

**E2E Tests:**
- Complete user workflows with Playwright
- Cross-browser compatibility testing

### Backend Gateway Testing

**Unit Tests:**
- Route handler logic
- Validation middleware
- Database service methods

**Integration Tests:**
- API endpoint testing with Supertest
- Database operations with test database
- AI Engine communication with mocked responses

**Load Tests:**
- Rate limiting verification
- Concurrent upload handling
- Database query performance

### AI Engine Testing

**Unit Tests:**
- Model inference functions
- Image preprocessing pipelines
- Metadata extraction functions

**Integration Tests:**
- End-to-end analysis with sample images/videos
- Model output validation
- Performance benchmarking

**Model Validation:**
- Accuracy testing with labeled datasets
- False positive/negative rate analysis
- Inference time measurements

## Performance Considerations

### Frontend Optimization
- Lazy load components with React.lazy
- Image optimization with WebP format
- Code splitting by route
- Memoization of expensive computations
- Virtual scrolling for history view

### Backend Gateway Optimization
- Redis caching for repeated analyses
- Connection pooling for database
- Request queuing for AI Engine
- Compression for API responses
- CDN for static assets

### AI Engine Optimization
- Model quantization for faster inference
- Batch processing for video frames
- GPU acceleration with CUDA
- Model caching in memory
- Async processing with background workers

## Security Considerations

### File Upload Security
- Validate file signatures (magic bytes)
- Sanitize filenames
- Scan for malware
- Isolate file processing
- Automatic cleanup of temporary files

### API Security
- Rate limiting per IP and user
- Input validation and sanitization
- CORS configuration
- API key authentication for AI Engine
- Request size limits

### Data Privacy
- No permanent storage of uploaded content
- Automatic deletion after 30 days
- Optional anonymous usage
- No tracking of user behavior
- GDPR compliance considerations

## Deployment Architecture

### Development Environment
```yaml
services:
  frontend:
    - Vite dev server on port 5173
  backend:
    - Express server on port 3000
  ai-engine:
    - FastAPI server on port 8000
  mongodb:
    - MongoDB on port 27017
  redis:
    - Redis on port 6379
```

### Production Considerations
- Container orchestration with Docker Compose or Kubernetes
- Load balancing for AI Engine instances
- Database replication and backups
- Monitoring with Prometheus and Grafana
- Logging aggregation with ELK stack
- SSL/TLS termination at load balancer
