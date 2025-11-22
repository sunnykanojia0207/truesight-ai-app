# Database & Analysis API Documentation

## Analysis Schema

The Analysis document stores all information about content verification requests.

### Fields

- `_id`: Unique identifier (MongoDB ObjectId)
- `userId`: Optional user identifier for tracking user's analyses
- `contentType`: Type of content ("image" or "video")
- `sourceType`: How content was submitted ("upload", "url", or "screenshot")
- `sourceUrl`: Original URL if submitted via URL
- `filePath`: Path to stored file
- `thumbnail`: Thumbnail image (base64 or URL)
- `status`: Current status ("processing", "completed", "failed")
- `result`: Analysis results (only present when status is "completed")
- `error`: Error message (only present when status is "failed")
- `createdAt`: Timestamp when analysis was created
- `completedAt`: Timestamp when analysis completed
- `expiresAt`: Expiration date (30 days from creation)

### Indexes

- TTL index on `expiresAt` for automatic deletion after 30 days
- Index on `userId` and `createdAt` for efficient user queries
- Index on `status` for filtering by status

## API Endpoints

### GET /api/analysis/:analysisId

Retrieve analysis result by ID.

**Parameters:**
- `analysisId` (path): Analysis ID

**Response (200 OK):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "status": "completed",
  "contentType": "image",
  "sourceType": "upload",
  "sourceUrl": null,
  "result": {
    "truthScore": 85,
    "aiGeneratedProbability": 15,
    "realProbability": 85,
    "deepfakeDetection": {
      "facesDetected": 1,
      "deepfakeFaces": []
    },
    "manipulationHeatmap": "base64-encoded-image",
    "metadata": {
      "exif": {
        "Make": "Canon",
        "Model": "EOS 5D"
      },
      "compressionScore": 78,
      "ganFingerprint": {
        "detected": false,
        "confidence": 0.12
      }
    },
    "predictedSource": "Unknown",
    "processingTime": 2.5
  },
  "error": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "completedAt": "2024-01-01T00:00:02.500Z"
}
```

**Response (404 Not Found):**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Analysis not found",
    "details": {
      "analysisId": "507f1f77bcf86cd799439011"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "uuid-here"
}
```

### GET /api/history

Get analysis history with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1, min: 1)
- `limit` (optional): Items per page (default: 10, min: 1, max: 100)
- `userId` (optional): Filter by user ID

**Response (200 OK):**
```json
{
  "analyses": [
    {
      "id": "507f1f77bcf86cd799439011",
      "thumbnail": "base64-or-url",
      "truthScore": 85,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "contentType": "image",
      "sourceType": "upload",
      "status": "completed"
    },
    {
      "id": "507f1f77bcf86cd799439012",
      "thumbnail": "base64-or-url",
      "truthScore": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "contentType": "video",
      "sourceType": "url",
      "status": "processing"
    }
  ],
  "total": 42,
  "page": 1,
  "totalPages": 5
}
```

**Response (400 Bad Request - Invalid Pagination):**
```json
{
  "error": {
    "code": "INVALID_PAGINATION",
    "message": "Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100"
  }
}
```

## Testing with cURL

### Get Analysis Result
```bash
curl -X GET http://localhost:3000/api/analysis/507f1f77bcf86cd799439011
```

### Get History (All)
```bash
curl -X GET "http://localhost:3000/api/history?page=1&limit=10"
```

### Get History (By User)
```bash
curl -X GET "http://localhost:3000/api/history?userId=user123&page=1&limit=10"
```

## Database Service Functions

### createAnalysis(params)
Creates a new analysis record with status "processing".

**Parameters:**
- `userId` (optional): User identifier
- `contentType`: "image" or "video"
- `sourceType`: "upload", "url", or "screenshot"
- `sourceUrl` (optional): Original URL
- `filePath`: Path to stored file
- `thumbnail`: Thumbnail data

**Returns:** Created analysis document

### findAnalysisById(id)
Finds an analysis by its ID.

**Parameters:**
- `id`: Analysis ID

**Returns:** Analysis document or null

### updateAnalysis(id, updates)
Updates an analysis record.

**Parameters:**
- `id`: Analysis ID
- `updates`: Object with fields to update
  - `status`: New status
  - `result`: Analysis results
  - `error`: Error message
  - `completedAt`: Completion timestamp

**Returns:** Updated analysis document

### findAnalysesByUserId(userId, params)
Finds all analyses for a specific user with pagination.

**Parameters:**
- `userId`: User identifier
- `params`: Pagination parameters
  - `page`: Page number
  - `limit`: Items per page

**Returns:** Paginated result with analyses array and metadata

### findAllAnalyses(params)
Finds all analyses with pagination (for anonymous users or admin).

**Parameters:**
- `params`: Pagination parameters
  - `page`: Page number
  - `limit`: Items per page

**Returns:** Paginated result with analyses array and metadata

### deleteAnalysis(id)
Deletes an analysis by ID.

**Parameters:**
- `id`: Analysis ID

**Returns:** void

### getAnalysisStats(userId?)
Gets statistics about analyses.

**Parameters:**
- `userId` (optional): Filter by user

**Returns:** Statistics object with total count and breakdown by status

## Data Retention

- All analyses are automatically deleted 30 days after creation
- TTL index on `expiresAt` field handles automatic cleanup
- No manual cleanup required

## Example Usage in Code

```typescript
import { 
  createAnalysis, 
  findAnalysisById, 
  updateAnalysis 
} from './services/analysisService.js';

// Create new analysis
const analysis = await createAnalysis({
  contentType: 'image',
  sourceType: 'upload',
  filePath: '/uploads/file.jpg',
  thumbnail: 'base64-data',
});

// Update with results
await updateAnalysis(analysis._id, {
  status: 'completed',
  result: {
    truthScore: 85,
    // ... other result fields
  },
  completedAt: new Date(),
});

// Retrieve analysis
const result = await findAnalysisById(analysis._id);
```
