"""Analysis endpoints"""
from fastapi import APIRouter, File, UploadFile, HTTPException
from utils.logger import setup_logger

logger = setup_logger(__name__)
router = APIRouter(prefix="/analyze", tags=["analysis"])

@router.post("/image")
async def analyze_image(image: UploadFile = File(...)):
    """
    Analyze an image for AI generation and manipulation
    
    Args:
        image: Image file (JPEG, PNG, WebP)
        
    Returns:
        Analysis results including truth score, deepfake detection, etc.
    """
    import time
    
    try:
        logger.info(f"Received image analysis request: {image.filename}")
        
        # Validate file type
        if not image.content_type or not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read image data
        image_data = await image.read()
        
        # Load and preprocess image
        from utils.image_preprocessing import ImagePreprocessor
        from services.image_analysis_service import get_image_analysis_service
        
        preprocessor = ImagePreprocessor()
        pil_image = preprocessor.load_image(image_data)
        
        # Run analysis using service
        service = get_image_analysis_service()
        result = service.analyze_image(pil_image, filename=image.filename)
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing image: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.post("/video")
async def analyze_video(video: UploadFile = File(...)):
    """
    Analyze a video for AI generation and deepfakes
    
    Args:
        video: Video file (MP4, MOV, WebM)
        
    Returns:
        Analysis results including truth score, frame analysis, etc.
    """
    import time
    import tempfile
    import os
    import shutil
    
    start_time = time.time()
    temp_file_path = None
    
    try:
        logger.info(f"Received video analysis request: {video.filename}")
        
        # Validate file type
        if not video.content_type or not video.content_type.startswith('video/'):
            raise HTTPException(status_code=400, detail="File must be a video")
        
        # Save video to temporary file
        # We need a file on disk for OpenCV to read it
        suffix = os.path.splitext(video.filename)[1] if video.filename else ".mp4"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            shutil.copyfileobj(video.file, temp_file)
            temp_file_path = temp_file.name
            
        logger.info(f"Saved video to temporary file: {temp_file_path}")
        
        # Process video
        from utils.video_processor import get_video_processor
        processor = get_video_processor()
        
        # Run analysis (with 1 second interval)
        result = await processor.process_video(temp_file_path, interval_seconds=1.0)
        
        processing_time = time.time() - start_time
        result["processingTime"] = round(processing_time, 2)
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing video: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    finally:
        # Cleanup temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
                logger.info(f"Cleaned up temporary file: {temp_file_path}")
            except Exception as e:
                logger.error(f"Failed to delete temporary file: {e}")
        

