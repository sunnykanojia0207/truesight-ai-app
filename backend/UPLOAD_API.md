# Upload API Documentation

## Endpoints

### POST /api/upload/image

Upload an image file for analysis.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: 
  - `file`: Image file (JPEG, PNG, or WebP)

**Validation:**
- Max file size: 10MB
- Allowed formats: JPEG, PNG, WebP
- File signature validation (magic bytes)

**Response (Success - 200):**
```json
{
  "analysisId": "analysis-1234567890",
  "status": "processing",
  "estimatedTime": 30,
  "file": {
    "originalName": "example.jpg",
    "size": 1024000,
    "mimeType": "image/jpeg"
  }
}
```

**Response (Error - 400):**
```json
{
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File size exceeds 10MB limit",
    "details": {
      "maxSize": "10",
      "actualSize": 15
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "uuid-here"
}
```

### POST /api/upload/video

Upload a video file for analysis.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: 
  - `file`: Video file (MP4, MOV, or WebM)

**Validation:**
- Max file size: 100MB
- Allowed formats: MP4, MOV, WebM
- File signature validation (magic bytes)

**Response (Success - 200):**
```json
{
  "analysisId": "analysis-1234567890",
  "status": "processing",
  "estimatedTime": 120,
  "file": {
    "originalName": "example.mp4",
    "size": 50240000,
    "mimeType": "video/mp4"
  }
}
```

## Error Codes

- `NO_FILE_UPLOADED`: No file was provided in the request
- `FILE_TOO_LARGE`: File exceeds the maximum size limit
- `INVALID_FILE_TYPE`: File type is not supported or doesn't match expected format

## Testing with cURL

### Upload Image
```bash
curl -X POST http://localhost:3000/api/upload/image \
  -F "file=@/path/to/image.jpg"
```

### Upload Video
```bash
curl -X POST http://localhost:3000/api/upload/video \
  -F "file=@/path/to/video.mp4"
```

## Security Features

1. **File Signature Validation**: Uses magic bytes to verify actual file type
2. **Filename Sanitization**: Removes dangerous characters and path traversal attempts
3. **Size Limits**: Enforces strict size limits per file type
4. **Automatic Cleanup**: Removes files older than 1 hour automatically
5. **Unique Filenames**: Uses UUIDs to prevent filename collisions
