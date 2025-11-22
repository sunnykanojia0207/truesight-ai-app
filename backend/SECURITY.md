# Security & Rate Limiting Documentation

## Overview

The TrueSight AI Backend Gateway implements multiple layers of security to protect against common attacks and abuse.

## Security Middleware

### 1. Helmet

Helmet sets various HTTP headers to protect against common web vulnerabilities:

- **X-DNS-Prefetch-Control**: Controls browser DNS prefetching
- **X-Frame-Options**: Prevents clickjacking attacks
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-XSS-Protection**: Enables XSS filter in older browsers
- **Strict-Transport-Security**: Enforces HTTPS connections
- **Content-Security-Policy**: Controls resource loading

### 2. CORS (Cross-Origin Resource Sharing)

Configured to allow requests only from trusted origins:

```typescript
{
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id']
}
```

### 3. Request ID Tracking

Every request receives a unique ID for tracking across logs:

- Accepts `X-Request-ID` header from client
- Generates UUID if not provided
- Returns ID in response headers
- Useful for debugging and request tracing

### 4. Input Sanitization

All user input is sanitized to prevent injection attacks:

**String Sanitization:**
- Removes angle brackets (`<>`)
- Removes `javascript:` protocol
- Removes event handlers (`onclick=`, etc.)
- Limits string length to 10,000 characters
- Trims whitespace

**Query Parameter Sanitization:**
- Applied to all query parameters
- Prevents SQL/NoSQL injection
- Removes malicious characters

**Request Body Validation:**
- Validates required fields
- Sanitizes string values
- Enforces data types

### 5. File Upload Security

**Magic Bytes Validation:**
- Verifies actual file type using file signatures
- Prevents malicious files disguised with fake extensions

**Filename Sanitization:**
- Removes path traversal attempts (`../`)
- Removes special characters
- Limits filename length
- Uses UUID-based naming

**Size Limits:**
- Images: 10MB maximum
- Videos: 100MB maximum
- Enforced at multiple levels (Multer, validation, download)

## Rate Limiting

Rate limiting is implemented using Redis for distributed rate limiting across multiple server instances.

### Configuration

Environment variables:
```bash
RATE_LIMIT_WINDOW_MS=60000      # 1 minute window
RATE_LIMIT_MAX_REQUESTS=10      # Max requests per window
```

### Rate Limiters

#### 1. General API Rate Limiter

Applied to all API endpoints except health checks:

- **Limit**: 10 requests per minute per IP
- **Response**: 429 Too Many Requests
- **Headers**: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`

#### 2. Upload Rate Limiter

Applied to file upload endpoints:

- **Limit**: 5 requests per minute per IP (half of general limit)
- **Endpoints**: `/api/upload/image`, `/api/upload/video`
- **Purpose**: Prevent abuse of file storage

#### 3. URL Analysis Rate Limiter

Applied to URL analysis endpoints:

- **Limit**: 5 requests per minute per IP (half of general limit)
- **Endpoints**: `/api/analyze/url`
- **Purpose**: Prevent abuse of external resource fetching

### Rate Limit Response

When rate limit is exceeded:

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 60
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Response Headers:**
- `RateLimit-Limit`: Maximum requests allowed
- `RateLimit-Remaining`: Requests remaining in current window
- `RateLimit-Reset`: Timestamp when limit resets

## Validation Middleware

### ObjectId Validation

Validates MongoDB ObjectId format before database queries:

```typescript
// Usage
router.get('/:analysisId', validateObjectId('analysisId'), getAnalysis);
```

**Validates:**
- 24 hexadecimal characters
- Prevents invalid database queries
- Returns 400 error for invalid IDs

### Pagination Validation

Validates pagination parameters:

```typescript
// Usage
router.get('/', validatePagination, getHistory);
```

**Validates:**
- `page`: Must be >= 1
- `limit`: Must be between 1 and 100
- Prevents excessive database queries
- Returns 400 error for invalid parameters

### Content-Type Validation

Validates request Content-Type header:

```typescript
// Usage
router.post('/upload', validateContentType(['multipart/form-data']), upload);
```

**Validates:**
- Required Content-Type header
- Matches allowed types
- Returns 400 error for invalid types

## Error Handling

All security violations return structured error responses:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {
      // Additional context (only in development)
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "uuid-here"
}
```

### Common Error Codes

- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INVALID_ID_FORMAT`: Invalid ObjectId
- `INVALID_PAGINATION`: Invalid pagination parameters
- `MISSING_BODY`: Request body required but not provided
- `INVALID_CONTENT_TYPE`: Invalid Content-Type header
- `FILE_TOO_LARGE`: File exceeds size limit
- `INVALID_FILE_TYPE`: File type not allowed

## Logging

All security events are logged:

- Rate limit violations
- Invalid input attempts
- File upload attempts
- Authentication failures (when implemented)

**Log Format:**
```
2024-01-01 00:00:00 [warn]: Rate limit exceeded for IP: 192.168.1.1
2024-01-01 00:00:00 [warn]: Invalid ObjectId format: invalid-id
```

## Best Practices

### For Developers

1. **Always validate input**: Use validation middleware on all routes
2. **Sanitize user data**: Never trust user input
3. **Use rate limiters**: Apply appropriate rate limiters to endpoints
4. **Log security events**: Track suspicious activity
5. **Keep dependencies updated**: Regularly update security packages

### For Deployment

1. **Set strong CORS origins**: Don't use `*` in production
2. **Use HTTPS**: Always use TLS in production
3. **Configure rate limits**: Adjust based on expected traffic
4. **Monitor logs**: Set up alerts for security events
5. **Use environment variables**: Never hardcode secrets

## Testing Rate Limits

### Test General Rate Limit

```bash
# Send 11 requests quickly (limit is 10)
for i in {1..11}; do
  curl -X GET http://localhost:3000/api/health
  echo "Request $i"
done
```

### Test Upload Rate Limit

```bash
# Send 6 upload requests quickly (limit is 5)
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/upload/image \
    -F "file=@test.jpg"
  echo "Request $i"
done
```

### Check Rate Limit Headers

```bash
curl -v http://localhost:3000/api/health
# Look for RateLimit-* headers in response
```

## Future Enhancements

- [ ] JWT authentication
- [ ] API key management
- [ ] IP whitelisting/blacklisting
- [ ] Request signing
- [ ] DDoS protection
- [ ] Captcha integration for suspicious activity
- [ ] Geolocation-based rate limiting
- [ ] User-based rate limiting (in addition to IP-based)
