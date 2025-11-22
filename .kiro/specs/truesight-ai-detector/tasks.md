# Implementation Plan

- [x] 1. Set up project structure and development environment



  - Create monorepo structure with frontend, backend, and ai-engine directories
  - Initialize package.json files for each service with appropriate dependencies
  - Create Docker Compose configuration for local development with MongoDB, Redis, and all services
  - Set up TypeScript configurations for frontend and backend
  - Create environment variable templates (.env.example) for each service
  - _Requirements: 12.1, 12.2, 12.3_

- [x] 2. Implement Backend Gateway core infrastructure



  - Create Express.js server with TypeScript configuration
  - Implement middleware stack (CORS, body-parser, error handling, logging with Winston)
  - Set up MongoDB connection with Mongoose and create connection pooling
  - Implement Redis client for rate limiting and caching
  - Create health check endpoint at /api/health
  - _Requirements: 8.4, 11.4, 12.4_

- [x] 3. Implement file upload handling in Backend Gateway



  - Configure Multer middleware for multipart/form-data handling with file size limits
  - Create POST /api/upload/image endpoint with file validation (JPEG, PNG, WebP, max 10MB)
  - Create POST /api/upload/video endpoint with file validation (MP4, MOV, WebM, max 100MB)
  - Implement file signature validation (magic bytes) for security
  - Implement temporary file storage with unique identifiers and automatic cleanup after 1 hour
  - _Requirements: 1.1, 2.1, 8.1, 8.2, 8.3, 8.5_

- [x] 4. Implement URL content fetching in Backend Gateway



  - Create POST /api/analyze/url endpoint with URL validation
  - Implement URL content downloader using Axios with timeout and size limits
  - Add support for direct image/video URLs with content-type detection
  - Add support for YouTube URL parsing and video extraction
  - Add support for Instagram URL parsing and media extraction
  - Implement error handling for inaccessible or invalid URLs
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5. Create MongoDB schemas and database service



  - Define Analysis document schema with all required fields and indexes
  - Create TTL index on expiresAt field for automatic deletion after 30 days
  - Implement database service methods (create, findById, update, findByUserId)
  - Implement pagination logic for history queries
  - _Requirements: 10.1, 10.4_

- [x] 6. Implement rate limiting and security middleware



  - Configure Redis-based rate limiter (10 requests per minute per IP)
  - Create rate limiting middleware and apply to upload/analyze endpoints
  - Implement request validation middleware with input sanitization
  - Add request ID generation for error tracking
  - _Requirements: 8.4, 11.4_

- [x] 7. Implement AI Engine communication layer in Backend Gateway



  - Create AI Engine client service using Axios with retry logic
  - Implement POST request to AI Engine /analyze/image endpoint
  - Implement POST request to AI Engine /analyze/video endpoint
  - Add circuit breaker pattern for AI Engine unavailability
  - Implement error mapping from AI Engine responses to backend error codes
  - _Requirements: 11.1, 12.2_

- [x] 8. Implement analysis orchestration endpoints

  - Create GET /api/analysis/:analysisId endpoint to retrieve analysis status and results
  - Implement async processing flow: accept upload → create analysis record → call AI Engine → update record
  - Add polling mechanism support for frontend to check analysis status
  - Implement error handling and status updates for failed analyses
  - _Requirements: 1.3, 2.3, 11.2, 11.5_

- [x] 9. Implement history endpoints in Backend Gateway


  - Create GET /api/history endpoint with pagination support
  - Implement query logic to fetch analyses sorted by creation date
  - Generate thumbnail URLs or base64 data for response
  - Handle empty history case
  - _Requirements: 10.2, 10.3, 10.5_

- [x] 10. Set up AI Engine FastAPI application



  - Create FastAPI application with Python 3.10+
  - Configure CORS middleware for backend gateway communication
  - Set up logging configuration
  - Create health check endpoint at /health with model status
  - Implement startup event to load all AI models into memory
  - _Requirements: 12.3, 12.4_

- [x] 11. Implement image preprocessing pipeline in AI Engine



  - Create image loading function with Pillow supporting JPEG, PNG, WebP
  - Implement image resizing and normalization for model input
  - Create tensor conversion utilities for PyTorch models
  - Add error handling for corrupted or invalid images
  - _Requirements: 1.1, 7.1_

- [x] 12. Implement CLIP-based real vs fake classifier



  - Load pre-trained CLIP model from Hugging Face Transformers
  - Create inference function that returns real vs AI-generated probabilities
  - Implement prompt engineering for optimal classification ("a real photograph" vs "an AI-generated image")
  - Add confidence score calculation
  - _Requirements: 7.1, 4.1, 4.2_

- [x] 13. Implement deepfake face detection



  - Integrate face detection model (e.g., MTCNN or RetinaFace) using PyTorch
  - Load deepfake detection model (e.g., FaceForensics++ trained model)
  - Create face extraction and preprocessing pipeline
  - Implement inference on detected faces with bounding box coordinates
  - Return list of detected faces with deepfake confidence scores
  - _Requirements: 7.2, 4.3_

- [x] 14. Implement GAN fingerprint detection



  - Load GAN fingerprint detection model (e.g., CNN-based GAN classifier)
  - Create preprocessing pipeline for GAN fingerprint analysis
  - Implement inference function returning detection confidence
  - Add support for detecting specific GAN architectures if possible
  - _Requirements: 7.3, 5.3_

- [x] 15. Implement image forgery detection
  - Load image forgery detection model (e.g., ManTraNet or similar)
  - Create inference pipeline that generates manipulation heatmap
  - Implement heatmap overlay generation as base64 encoded image
  - Return manipulated region coordinates and confidence scores
  - _Requirements: 7.4, 4.4_

- [x] 16. Implement metadata extraction and analysis
  - Create EXIF metadata extractor using Pillow
  - Implement compression artifact analysis using OpenCV
  - Calculate compression consistency score
  - Detect metadata stripping or anomalies
  - Return structured metadata object with all findings
  - _Requirements: 5.1, 5.2, 5.4_

- [x] 17. Implement model source prediction
  - Create classifier or heuristic system to identify generation source
  - Train or load model to detect Midjourney, DALL-E, Stable Diffusion, Sora, Runway signatures
  - Implement inference function returning predicted source and confidence
  - Return "Unknown" when source cannot be determined
  - _Requirements: 4.5_

- [x] 18. Implement Truth Score aggregation logic
  - Create weighted averaging function combining all detection model outputs
  - Define weights for each model (CLIP: 30%, deepfake: 25%, GAN: 20%, forgery: 15%, metadata: 10%)
  - Normalize final score to 0-100 range
  - Implement confidence-based weighting adjustments
  - _Requirements: 7.5_

- [x] 19. Implement POST /analyze/image endpoint in AI Engine
  - Create endpoint accepting multipart/form-data image uploads
  - Orchestrate all image analysis functions (CLIP, deepfake, GAN, forgery, metadata)
  - Aggregate results into unified response structure
  - Calculate and return processing time
  - Implement error handling for analysis failures
  - _Requirements: 1.4, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.5_

- [x] 20. Implement video processing pipeline in AI Engine
  - Create video frame extractor using ffmpeg-python at 1-second intervals
  - Implement batch processing for extracted frames
  - Create frame-by-frame analysis using image analysis pipeline
  - Generate timeline data with Truth Score per frame
  - Calculate average Truth Score across all frames
  - _Requirements: 2.2, 2.3, 2.4_

- [x] 21. Implement POST /analyze/video endpoint in AI Engine
  - Create endpoint accepting multipart/form-data video uploads
  - Orchestrate video frame extraction and analysis
  - Aggregate frame-level results into video-level response
  - Return timeline data for visualization
  - Implement timeout protection for long videos
  - _Requirements: 2.1, 2.3, 2.4, 11.5_

- [x] 22. Set up Frontend React application with Vite



  - Initialize React + TypeScript project with Vite
  - Configure Tailwind CSS with custom theme
  - Install and configure shadcn/ui components
  - Set up Zustand store for global state management
  - Configure React Query for API data fetching
  - Create Axios instance with base URL and interceptors
  - _Requirements: 9.4, 12.1_

- [x] 23. Create Upload Component with file upload support



  - Build drag-and-drop zone using shadcn/ui components
  - Implement file input with accept attribute for images and videos
  - Add file validation (type and size) before upload
  - Create upload progress indicator with percentage
  - Implement error display for validation failures
  - Add visual feedback for drag-over state
  - _Requirements: 1.1, 1.2, 1.5, 2.1, 2.5, 9.4_

- [x] 24. Add URL input and screenshot paste to Upload Component
  - Create URL input field with validation
  - Implement paste event listener for screenshot detection
  - Add keyboard shortcut support (Ctrl+V / Cmd+V)
  - Create mode switcher UI (file / URL / screenshot tabs)
  - Implement clipboard image data extraction
  - Add error handling for invalid clipboard content
  - _Requirements: 3.1, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 25. Implement upload API integration in Frontend
  - Create API service functions for image upload, video upload, and URL analysis
  - Implement FormData construction for file uploads
  - Add upload progress tracking using Axios progress events
  - Implement error handling and user-friendly error messages
  - Store analysis ID in Zustand store after successful upload
  - Navigate to results page after upload completion
  - _Requirements: 1.2, 1.3, 2.1, 3.2, 3.3, 3.4_

- [x] 26. Create Results Dashboard Component structure
  - Build responsive layout with sections for score, breakdown, visualization, and metadata
  - Create Truth Score gauge component using SVG or chart library
  - Implement loading state with skeleton screens
  - Add error state display for failed analyses
  - Create polling mechanism to check analysis status every 2 seconds
  - _Requirements: 1.3, 1.4, 9.1, 9.2, 9.3, 9.5_

- [x] 27. Implement probability breakdown visualization
  - Create bar chart or pie chart showing AI-generated vs Real percentages
  - Display predicted source model with icon or badge
  - Add confidence indicators for each metric
  - Implement responsive design for mobile devices
  - _Requirements: 4.1, 4.2, 4.5, 9.3_

- [x] 28. Implement image viewer with overlays
  - Create zoomable image viewer component
  - Implement deepfake face bounding box overlays with labels
  - Add manipulation heatmap overlay with opacity control
  - _Requirements: 2.4_

- [x] 29. Implement metadata and technical details display
  - Create expandable accordion for EXIF metadata
  - Display compression score with visual indicator
  - Show GAN fingerprint detection results
  - Create technical details section with all forensic indicators
  - Handle missing metadata gracefully
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 30. Implement video timeline visualization
  - Create timeline scrubber showing Truth Score variation over time
  - Implement frame-by-frame navigation
  - Add hover tooltips showing score at specific timestamps
  - Create visual indicators for suspicious frames
  - _Requirements: 2.4_

- [x] 31. Create History View Component
  - Build grid layout for analysis thumbnails using CSS Grid
  - Implement pagination controls (previous/next, page numbers)
  - Create history item cards with thumbnail, Truth Score badge, and timestamp
  - Add click handler to navigate to full results
  - Implement empty state message when no history exists
  - _Requirements: 10.2, 10.3, 10.5_

- [x] 32. Implement history API integration
  - Create API service function for fetching history with pagination
  - Implement React Query hook for history data with caching
  - Add infinite scroll or pagination controls
  - Handle loading and error states
  - _Requirements: 10.2_

- [x] 33. Implement responsive design and mobile optimization
  - Create responsive breakpoints for desktop (1024px+), tablet (768-1023px), and mobile (<768px)
  - Optimize Upload Component layout for mobile devices
  - Adjust Results Dashboard layout for smaller screens
  - Test and fix History View grid on mobile
  - Ensure touch-friendly controls and adequate spacing
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 34. Implement error handling and user feedback
  - Create toast notification system for success/error messages
  - Implement error boundary components for graceful error handling
  - Add retry mechanisms for failed API requests
  - Display user-friendly error messages for all error codes
  - Implement extended processing time message for long analyses
  - _Requirements: 11.1, 11.2, 11.3, 11.5_

- [x] 35. Add loading states and progress indicators
  - Implement skeleton loaders for Results Dashboard
  - Create progress bar for upload operations
  - Add spinner for analysis status polling
  - Display estimated time remaining during analysis
  - Ensure all loading states provide visual feedback within 100ms
  - _Requirements: 1.3, 9.4, 9.5_

- [x] 36. Set up testing infrastructure for Backend Gateway


  - Install Jest and Supertest testing dependencies
  - Configure Jest for TypeScript with ts-jest
  - Create test database configuration for MongoDB
  - Set up test environment variables
  - Create test utilities and helpers
  - _Requirements: 8.4, 11.4_

- [x] 37. Write integration tests for Backend Gateway


  - Create test suite for upload endpoints with various file types and sizes
  - Test URL analysis endpoint with valid and invalid URLs
  - Test rate limiting behavior with multiple requests
  - Test error handling scenarios
  - Test database operations with test data
  - _Requirements: 1.1, 1.5, 2.1, 2.5, 3.5, 8.4_

- [x] 38. Set up testing infrastructure for AI Engine


  - Install pytest and pytest-asyncio dependencies
  - Configure pytest for async FastAPI testing
  - Create test fixtures for sample images and videos
  - Set up mock models for faster testing
  - _Requirements: 7.1, 7.5_

- [x] 39. Write unit tests for AI Engine analysis functions


  - Test image preprocessing pipeline with various formats
  - Test each model inference function with sample data
  - Test Truth Score aggregation logic with different input combinations
  - Test metadata extraction with images containing and missing EXIF data
  - Test video frame extraction and processing
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 40. Set up E2E testing infrastructure for Frontend


  - Install Playwright or Cypress for E2E testing
  - Configure test environment with mock backend
  - Create test fixtures and utilities
  - Set up CI/CD integration for automated testing
  - _Requirements: 9.4, 11.2_

- [ ] 41. Write E2E tests for Frontend workflows
  - Test complete upload-to-results flow for images
  - Test complete upload-to-results flow for videos
  - Test URL analysis workflow
  - Test screenshot paste functionality
  - Test history view and navigation
  - Test responsive design on different viewport sizes
  - _Requirements: 1.1, 1.2, 2.1, 3.1, 6.2, 9.1, 9.2, 9.3, 10.2, 10.3_

- [x] 42. Create Docker configurations for deployment
  - Write Dockerfile for Frontend with multi-stage build
  - Write Dockerfile for Backend Gateway with Node.js
  - Write Dockerfile for AI Engine with Python and model dependencies
  - Update Docker Compose for production configuration
  - Add volume mounts for persistent data
  - _Requirements: 12.5_

- [x] 43. Implement environment configuration and secrets management
  - Create environment variable validation on startup for all services
  - Document all required environment variables in README
  - Implement configuration loading with defaults
  - Add API key authentication between Backend Gateway and AI Engine
  - _Requirements: 8.5, 12.1_
