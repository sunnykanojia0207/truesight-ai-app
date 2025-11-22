# Requirements Document

## Introduction

TrueSight AI is a web application that enables users to verify whether images or videos are real or AI-generated. The system analyzes uploaded content using AI models and provides a comprehensive Truth Score with detailed breakdowns including AI-generated probability, deepfake detection, manipulated region visualization, metadata extraction, and model source prediction. The platform aims to combat misinformation and deepfake abuse by providing accessible verification tools.

## Glossary

- **TrueSight System**: The complete web application including frontend, backend API gateway, and AI engine
- **AI Engine**: The Python-based FastAPI service that performs AI inference and content analysis
- **Backend Gateway**: The Node.js service that orchestrates requests between frontend and AI Engine
- **Truth Score**: A numerical value (0-100) representing the likelihood that content is authentic
- **Content Item**: An image or video file submitted for analysis
- **Analysis Result**: The complete output including Truth Score, detection metrics, and metadata
- **User**: Any person accessing the TrueSight System through the web interface

## Requirements

### Requirement 1

**User Story:** As a user, I want to upload images for verification, so that I can determine if they are AI-generated or authentic

#### Acceptance Criteria

1. WHEN a User selects an image file from their device, THE TrueSight System SHALL accept files in JPEG, PNG, and WebP formats up to 10MB in size
2. WHEN a User drags and drops an image onto the upload zone, THE TrueSight System SHALL process the file and initiate analysis
3. WHEN an image upload completes, THE TrueSight System SHALL display a progress indicator during analysis
4. WHEN analysis completes, THE TrueSight System SHALL display the Truth Score with a value between 0 and 100
5. IF an uploaded file exceeds 10MB, THEN THE TrueSight System SHALL display an error message stating the size limit

### Requirement 2

**User Story:** As a user, I want to upload videos for verification, so that I can detect deepfakes and AI-generated video content

#### Acceptance Criteria

1. WHEN a User selects a video file from their device, THE TrueSight System SHALL accept files in MP4, MOV, and WebM formats up to 100MB in size
2. WHEN a video upload completes, THE AI Engine SHALL extract frames at 1-second intervals for analysis
3. WHEN video analysis completes, THE TrueSight System SHALL display the Truth Score averaged across all analyzed frames
4. WHEN video analysis completes, THE TrueSight System SHALL display a timeline showing Truth Score variations across the video duration
5. IF a video file exceeds 100MB, THEN THE TrueSight System SHALL display an error message stating the size limit

### Requirement 3

**User Story:** As a user, I want to submit content via URL, so that I can verify images and videos from social media and websites without downloading them

#### Acceptance Criteria

1. WHEN a User pastes a URL into the input field, THE TrueSight System SHALL validate the URL format before processing
2. WHEN a User submits a valid image URL, THE Backend Gateway SHALL download the content and forward it to the AI Engine
3. WHEN a User submits a YouTube URL, THE Backend Gateway SHALL extract the video and process it through the AI Engine
4. WHEN a User submits an Instagram URL, THE Backend Gateway SHALL extract the media content and process it through the AI Engine
5. IF a URL is invalid or inaccessible, THEN THE TrueSight System SHALL display an error message indicating the URL cannot be processed

### Requirement 4

**User Story:** As a user, I want to see a detailed breakdown of the analysis, so that I can understand why content is flagged as real or fake

#### Acceptance Criteria

1. WHEN analysis completes, THE TrueSight System SHALL display the AI-generated probability as a percentage
2. WHEN analysis completes, THE TrueSight System SHALL display the real content probability as a percentage
3. WHEN deepfake faces are detected, THE TrueSight System SHALL highlight detected face regions with bounding boxes
4. WHEN manipulated regions are detected, THE TrueSight System SHALL overlay a heatmap showing areas of highest manipulation probability
5. WHEN analysis completes, THE TrueSight System SHALL display the predicted source model if detected (Midjourney, DALL-E, Stable Diffusion, Sora, Runway, or Unknown)

### Requirement 5

**User Story:** As a user, I want to view metadata and technical analysis, so that I can see forensic evidence of manipulation

#### Acceptance Criteria

1. WHEN analysis completes, THE TrueSight System SHALL extract and display EXIF metadata including camera model, timestamp, and GPS coordinates if present
2. WHEN analysis completes, THE AI Engine SHALL analyze compression artifacts and display a compression consistency score
3. WHEN analysis completes, THE AI Engine SHALL detect GAN fingerprints and display the detection confidence level
4. WHEN metadata is missing or stripped, THE TrueSight System SHALL indicate that metadata was not found
5. WHEN analysis completes, THE TrueSight System SHALL display a technical details section with all forensic indicators

### Requirement 6

**User Story:** As a user, I want to use screenshot upload mode, so that I can quickly verify content displayed on my screen

#### Acceptance Criteria

1. WHEN a User activates screenshot mode, THE TrueSight System SHALL provide instructions for capturing a screenshot
2. WHEN a User pastes a screenshot from clipboard, THE TrueSight System SHALL accept the image data and initiate analysis
3. WHEN screenshot upload completes, THE TrueSight System SHALL process the content identically to file uploads
4. THE TrueSight System SHALL support screenshot paste functionality using Ctrl+V or Cmd+V keyboard shortcuts
5. WHEN a User pastes non-image clipboard content, THE TrueSight System SHALL display an error message indicating invalid content type

### Requirement 7

**User Story:** As a system administrator, I want the AI Engine to perform accurate deepfake detection, so that users receive reliable verification results

#### Acceptance Criteria

1. WHEN a Content Item is submitted, THE AI Engine SHALL apply a CLIP-based classifier to determine real versus fake probability
2. WHEN a Content Item contains faces, THE AI Engine SHALL apply deepfake detection models to each detected face
3. WHEN analyzing images, THE AI Engine SHALL apply GAN-fingerprint detection algorithms
4. WHEN analyzing images, THE AI Engine SHALL apply image forgery detection models to identify manipulated regions
5. WHEN all detection models complete, THE AI Engine SHALL aggregate results into a single Truth Score using weighted averaging

### Requirement 8

**User Story:** As a developer, I want the Backend Gateway to handle file uploads securely, so that user data is protected and the system remains performant

#### Acceptance Criteria

1. WHEN a User uploads a file, THE Backend Gateway SHALL validate file type and size before accepting the upload
2. WHEN a file upload is accepted, THE Backend Gateway SHALL store the file temporarily with a unique identifier
3. WHEN file processing completes, THE Backend Gateway SHALL delete temporary files within 1 hour
4. THE Backend Gateway SHALL implement rate limiting of 10 requests per minute per IP address
5. THE Backend Gateway SHALL sanitize all file uploads to prevent malicious code execution

### Requirement 9

**User Story:** As a user, I want the interface to be responsive and intuitive, so that I can easily verify content on any device

#### Acceptance Criteria

1. THE TrueSight System SHALL render correctly on desktop browsers with viewport widths of 1024 pixels or greater
2. THE TrueSight System SHALL render correctly on tablet devices with viewport widths between 768 and 1023 pixels
3. THE TrueSight System SHALL render correctly on mobile devices with viewport widths of 767 pixels or less
4. WHEN a User interacts with upload controls, THE TrueSight System SHALL provide visual feedback within 100 milliseconds
5. THE TrueSight System SHALL display loading states during analysis with estimated time remaining

### Requirement 10

**User Story:** As a user, I want to see my analysis history, so that I can review previous verification results

#### Acceptance Criteria

1. WHEN a User completes an analysis, THE Backend Gateway SHALL store the Analysis Result in the database
2. WHEN a User navigates to the history page, THE TrueSight System SHALL display a list of previous analyses with thumbnails and Truth Scores
3. WHEN a User clicks on a history item, THE TrueSight System SHALL display the complete Analysis Result
4. THE Backend Gateway SHALL retain Analysis Results for 30 days before automatic deletion
5. WHEN a User has no analysis history, THE TrueSight System SHALL display a message indicating no previous analyses exist

### Requirement 11

**User Story:** As a system administrator, I want the system to handle errors gracefully, so that users receive helpful feedback when issues occur

#### Acceptance Criteria

1. WHEN the AI Engine is unavailable, THE Backend Gateway SHALL return an error message indicating the service is temporarily unavailable
2. WHEN analysis fails due to unsupported content, THE TrueSight System SHALL display an error message explaining the content type is not supported
3. WHEN network errors occur during URL downloads, THE TrueSight System SHALL display an error message indicating the content could not be retrieved
4. WHEN the Backend Gateway encounters an error, THE TrueSight System SHALL log the error details for debugging purposes
5. IF analysis takes longer than 60 seconds, THEN THE TrueSight System SHALL display a message indicating extended processing time

### Requirement 12

**User Story:** As a developer, I want the system architecture to be modular and scalable, so that components can be developed and deployed independently

#### Acceptance Criteria

1. THE Frontend SHALL communicate with the Backend Gateway exclusively through REST API endpoints
2. THE Backend Gateway SHALL communicate with the AI Engine exclusively through REST API endpoints
3. THE AI Engine SHALL expose endpoints for image analysis, video analysis, and health checks
4. THE Backend Gateway SHALL implement health check endpoints for monitoring system status
5. THE TrueSight System SHALL support horizontal scaling of the AI Engine service to handle increased load
