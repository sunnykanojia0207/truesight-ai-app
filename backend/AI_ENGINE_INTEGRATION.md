# AI Engine Integration Documentation

## Overview

The Backend Gateway communicates with the AI Engine via REST API for content analysis. The integration includes retry logic, circuit breaker pattern, error mapping, and async processing.

## Architecture

```
Backend Gateway          AI Engine
     │                       │
     ├──► POST /analyze/image
     │    (multipart/form-data)
     │                       │
     │◄─── Analysis Results  │
     │                       │
     ├──► POST /analyze/video
     │    (multipart/form-data)
     │                       │
     │◄─── Analysis Results  │
     │                       │
     ├──► GET /health        │
     │                       │
     │◄─── Health Status     │
```

## Configuration

Environment variables:

```bash
AI_ENGINE_URL=http://localhost:8000
AI_ENGINE_API_KEY=your-secret-key
```

## AI Engine Client

### Features

1. **Circuit Breaker Pattern**
   - Prevents cascading failures
   - Opens after 5 consecutive failures
   - Automatically recovers after 1 minute
   - Half-open state for testing recovery

2. **Retry Logic**
   - Automatic retries on transient failures
   - Exponential backoff (handled by circuit breaker)

3. **Error Mapping**
   - Maps AI Engine errors to backend error codes
   - Provides user-friendly error messages

4. **Timeout Protection**
   - 2 minutes for image analysis
   - 4 minutes for video analysis
   - 5 seconds for health checks

### Circuit Breaker States

**CLOSED** (Normal Operation)
- All requests pass through
- Failures are counted
- Opens after threshold reached

**OPEN** (Failure Mode)
- All requests fail immediately
- Returns 503 Service Unavailable
- Transitions to HALF_OPEN after timeout

**HALF_OPEN** (Recovery Testing)
- Single request allowed through
- Success → CLOSED
- Failure → OPEN

### Circuit Breaker Configuration

```typescript
const CIRCUIT_BREAKER_THRESHOLD = 5;        // Open after 5 failures
const CIRCUIT_BREAKER_TIMEOUT = 60000;      // Try again after 1 minute
const CIRCUIT_BREAKER_RESET_TIMEOUT = 30000; // Reset after 30 seconds of success
```

## API Methods

### analyzeImage(filePath: string)

Sends an image to the AI Engine for analysis.

**Parameters:**
- `filePath`: Path to image file

**Returns:**
```typescript
{
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
  manipulationHeatmap: string;
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
}
```

**Errors:**
- `AI_ENGINE_UNAVAILABLE`: Circuit breaker open or connection failed
- `ANALYSIS_TIMEOUT`: Request exceeded timeout
- `INVALID_CONTENT`: AI Engine rejected the content
- `ANALYSIS_FAILED`: Analysis encountered an error

### analyzeVideo(filePath: string)

Sends a video to the AI Engine for analysis.

**Parameters:**
- `filePath`: Path to video file

**Returns:**
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

**Errors:** Same as analyzeImage

### checkAIEngineHealth()

Checks if the AI Engine is healthy.

**Returns:**
```typescript
{
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  models: {
    clipClassifier: boolean;
    deepfakeDetector: boolean;
    ganDetector: boolean;
    forgeryDetector: boolean;
  };
}
```

### getCircuitBreakerStatus()

Gets the current circuit breaker state.

**Returns:**
```typescript
{
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  lastFailureTime: number;
}
```

## Analysis Processor

The analysis processor handles async processing of content analysis.

### Workflow

1. **Upload/URL Submission**
   - File validated and saved
   - Analysis record created in database (status: "processing")
   - Response returned immediately to user

2. **Async Processing**
   - File sent to AI Engine
   - Results received and validated
   - Database updated with results (status: "completed")
   - File deleted after processing

3. **Error Handling**
   - Errors caught and logged
   - Database updated with error (status: "failed")
   - File deleted even on error

### Methods

#### startAnalysis(analysisId, filePath, contentType)

Starts async analysis processing (fire and forget).

**Parameters:**
- `analysisId`: Analysis record ID
- `filePath`: Path to content file
- `contentType`: "image" or "video"

**Behavior:**
- Returns immediately
- Processing happens in background
- Errors logged but don't throw

#### processImageAnalysis(analysisId, filePath)

Processes image analysis (internal).

**Steps:**
1. Call AI Engine
2. Update database with results
3. Clean up file

#### processVideoAnalysis(analysisId, filePath)

Processes video analysis (internal).

**Steps:**
1. Call AI Engine
2. Update database with results
3. Clean up file

## Error Handling

### Error Mapping

AI Engine errors are mapped to backend error codes:

| AI Engine Error | Backend Code | HTTP Status |
|----------------|--------------|-------------|
| Connection refused | AI_ENGINE_UNAVAILABLE | 503 |
| Timeout | ANALYSIS_TIMEOUT | 408 |
| 400 Bad Request | INVALID_CONTENT | 400 |
| 413 Payload Too Large | CONTENT_TOO_LARGE | 413 |
| 500 Internal Error | ANALYSIS_FAILED | 500 |

### Circuit Breaker Errors

When circuit breaker is OPEN:

```json
{
  "error": {
    "code": "AI_ENGINE_UNAVAILABLE",
    "message": "AI Engine is temporarily unavailable. Please try again later.",
    "details": {
      "retryAfter": 45
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "uuid-here"
}
```

## Health Check Integration

The `/api/health` endpoint includes AI Engine status:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "mongodb": "connected",
    "redis": "connected",
    "aiEngine": "connected"
  },
  "aiEngine": {
    "status": "healthy",
    "models": {
      "clipClassifier": true,
      "deepfakeDetector": true,
      "ganDetector": true,
      "forgeryDetector": true
    }
  },
  "circuitBreaker": {
    "state": "CLOSED",
    "failures": 0
  }
}
```

## Monitoring

### Logs

All AI Engine interactions are logged:

```
2024-01-01 00:00:00 [info]: Sending image to AI Engine: /uploads/file.jpg
2024-01-01 00:00:02 [info]: Image analysis completed successfully
2024-01-01 00:00:05 [error]: Circuit breaker OPEN after 5 failures
2024-01-01 00:01:05 [info]: Circuit breaker transitioning to HALF_OPEN
2024-01-01 00:01:06 [info]: Circuit breaker CLOSED after successful request
```

### Metrics to Monitor

- Circuit breaker state changes
- Analysis success/failure rates
- Processing times
- Timeout occurrences
- Error types and frequencies

## Testing

### Test Circuit Breaker

```bash
# Stop AI Engine to trigger failures
docker-compose stop ai-engine

# Make requests to trigger circuit breaker
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/upload/image \
    -F "file=@test.jpg"
done

# Check health to see circuit breaker state
curl http://localhost:3000/api/health
```

### Test Analysis Flow

```bash
# Upload image
RESPONSE=$(curl -X POST http://localhost:3000/api/upload/image \
  -F "file=@test.jpg")

# Extract analysis ID
ANALYSIS_ID=$(echo $RESPONSE | jq -r '.analysisId')

# Poll for results
while true; do
  STATUS=$(curl -s http://localhost:3000/api/analysis/$ANALYSIS_ID | jq -r '.status')
  echo "Status: $STATUS"
  
  if [ "$STATUS" != "processing" ]; then
    break
  fi
  
  sleep 2
done

# Get final results
curl http://localhost:3000/api/analysis/$ANALYSIS_ID | jq
```

## Best Practices

1. **Always use circuit breaker**: Prevents cascading failures
2. **Process async**: Don't block user requests
3. **Clean up files**: Delete after processing
4. **Log everything**: Track all AI Engine interactions
5. **Monitor health**: Check AI Engine status regularly
6. **Handle errors gracefully**: Update database even on failure
7. **Set appropriate timeouts**: Balance between patience and responsiveness

## Future Enhancements

- [ ] Retry with exponential backoff
- [ ] Request queuing for high load
- [ ] Multiple AI Engine instances (load balancing)
- [ ] Caching of analysis results
- [ ] Webhook notifications for completion
- [ ] Priority queue for urgent analyses
- [ ] Batch processing for multiple files
