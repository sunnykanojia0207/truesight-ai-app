# Analyze URL API Documentation

## Endpoint

### POST /api/analyze/url

Analyze content from a URL (direct links, YouTube, Instagram).

**Request:**
- Method: POST
- Content-Type: application/json
- Body:
```json
{
  "url": "https://example.com/image.jpg",
  "type": "auto"  // Optional: "image", "video", or "auto" (default)
}
```

**Parameters:**
- `url` (required): The URL of the content to analyze
- `type` (optional): Expected content type
  - `"auto"`: Auto-detect from URL and content-type header (default)
  - `"image"`: Expect an image file
  - `"video"`: Expect a video file

**Supported URL Types:**

1. **Direct URLs**: Direct links to image or video files
   - Images: JPEG, PNG, WebP
   - Videos: MP4, MOV, WebM

2. **YouTube URLs**: 
   - `https://www.youtube.com/watch?v=VIDEO_ID`
   - `https://youtu.be/VIDEO_ID`
   - Note: Currently returns 501 Not Implemented (placeholder for future implementation)

3. **Instagram URLs**:
   - `https://www.instagram.com/p/POST_ID/`
   - Note: Currently returns 501 Not Implemented (placeholder for future implementation)

**Response (Success - 200):**
```json
{
  "analysisId": "analysis-1234567890",
  "status": "processing",
  "contentType": "image",
  "source": {
    "url": "https://example.com/image.jpg",
    "type": "direct"
  },
  "file": {
    "size": 1024000,
    "mimeType": "image/jpeg"
  }
}
```

**Response Fields:**
- `analysisId`: Unique identifier for the analysis
- `status`: Current status ("processing", "completed", "failed")
- `contentType`: Detected content type ("image" or "video")
- `source.type`: Source platform ("direct", "youtube", "instagram")
- `file.size`: File size in bytes
- `file.mimeType`: Detected MIME type

**Error Responses:**

**400 Bad Request - Missing URL:**
```json
{
  "error": {
    "code": "MISSING_URL",
    "message": "URL is required"
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "uuid-here"
}
```

**400 Bad Request - Invalid URL:**
```json
{
  "error": {
    "code": "INVALID_URL",
    "message": "Invalid URL format"
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "uuid-here"
}
```

**400 Bad Request - File Too Large:**
```json
{
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "Content size exceeds maximum limit",
    "details": {
      "size": 15728640,
      "maxSize": 10485760
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "uuid-here"
}
```

**404 Not Found:**
```json
{
  "error": {
    "code": "INVALID_URL",
    "message": "Content not found at the provided URL"
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "uuid-here"
}
```

**408 Request Timeout:**
```json
{
  "error": {
    "code": "DOWNLOAD_TIMEOUT",
    "message": "Download timeout - content took too long to download"
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "uuid-here"
}
```

**501 Not Implemented (YouTube/Instagram):**
```json
{
  "error": {
    "code": "NOT_IMPLEMENTED",
    "message": "YouTube video extraction is not yet implemented",
    "details": {
      "feature": "youtube-download",
      "videoId": "dQw4w9WgXcQ"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "uuid-here"
}
```

## Error Codes

- `MISSING_URL`: No URL provided in request
- `INVALID_URL`: URL format is invalid or content is inaccessible
- `FILE_TOO_LARGE`: Downloaded content exceeds size limits
- `INVALID_FILE_TYPE`: Content type doesn't match expected type
- `DOWNLOAD_TIMEOUT`: Download took longer than 60 seconds
- `DOWNLOAD_FAILED`: General download error
- `NOT_IMPLEMENTED`: Feature not yet implemented (YouTube/Instagram)

## Testing with cURL

### Analyze Direct Image URL
```bash
curl -X POST http://localhost:3000/api/analyze/url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/image.jpg",
    "type": "auto"
  }'
```

### Analyze Direct Video URL
```bash
curl -X POST http://localhost:3000/api/analyze/url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/video.mp4",
    "type": "video"
  }'
```

### Analyze YouTube URL (Not Yet Implemented)
```bash
curl -X POST http://localhost:3000/api/analyze/url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }'
```

## Security & Validation

1. **URL Validation**: Only HTTP/HTTPS protocols allowed
2. **Content-Type Verification**: Validates actual content type from headers
3. **File Signature Validation**: Uses magic bytes to verify file type
4. **Size Limits**: 
   - Images: 10MB max
   - Videos: 100MB max
5. **Timeout Protection**: 60-second download timeout
6. **Automatic Cleanup**: Downloaded files removed after 1 hour

## Future Enhancements

- YouTube video extraction using yt-dlp
- Instagram media extraction
- Support for more social media platforms (Twitter, TikTok, etc.)
- Thumbnail extraction for videos
- Metadata preservation from source URLs
