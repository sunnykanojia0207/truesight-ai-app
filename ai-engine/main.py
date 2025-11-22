from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
import os
from datetime import datetime
from dotenv import load_dotenv
from routes.analyze import router as analyze_router

# Load environment variables
load_dotenv()

# Configure logging
log_level = os.getenv("LOG_LEVEL", "INFO")
logging.basicConfig(
    level=getattr(logging, log_level),
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="TrueSight AI Engine",
    version="1.0.0",
    description="AI-powered content verification engine for detecting deepfakes and AI-generated media"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure based on environment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state for models
models_loaded = {
    "clipClassifier": False,
    "deepfakeDetector": False,
    "ganDetector": False,
    "forgeryDetector": False,
}

@app.on_event("startup")
async def startup_event():
    """Load AI models on startup"""
    logger.info("🚀 AI Engine starting up...")
    logger.info(f"📝 Log level: {log_level}")
    logger.info(f"🖥️  Device: {os.getenv('DEVICE', 'cpu')}")
    logger.info(f"📁 Models directory: {os.getenv('MODELS_DIR', './models')}")
    
    try:
        logger.info("📦 Loading AI models...")
        
        # Load CLIP classifier
        logger.info("  ⏳ Loading CLIP classifier...")
        from models.clip_classifier import get_clip_classifier
        clip_classifier = get_clip_classifier()
        clip_classifier.load_model()
        models_loaded["clipClassifier"] = True
        logger.info("  ✓ CLIP classifier loaded")
        
        # Load deepfake detector
        logger.info("  ⏳ Loading deepfake detector...")
        from models.deepfake_detector import get_deepfake_detector
        deepfake_detector = get_deepfake_detector()
        deepfake_detector.load_models()
        models_loaded["deepfakeDetector"] = True
        logger.info("  ✓ Deepfake detector loaded")
        
        # Load GAN detector
        logger.info("  ⏳ Loading GAN detector...")
        from models.gan_detector import get_gan_detector
        gan_detector = get_gan_detector()
        gan_detector.load_model()
        models_loaded["ganDetector"] = True
        logger.info("  ✓ GAN detector loaded")
        
        logger.info("  ⏳ Forgery detector (not implemented)")
        # models_loaded["forgeryDetector"] = True
        
        logger.info("✅ AI Engine ready")
    except Exception as e:
        logger.error(f"❌ Failed to load models: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("🛑 AI Engine shutting down...")
    
    try:
        # Unload CLIP classifier
        from models.clip_classifier import get_clip_classifier
        clip_classifier = get_clip_classifier()
        clip_classifier.unload_model()
        
        # Unload deepfake detector
        from models.deepfake_detector import get_deepfake_detector
        deepfake_detector = get_deepfake_detector()
        deepfake_detector.unload_models()
        
        # Unload GAN detector
        from models.gan_detector import get_gan_detector
        gan_detector = get_gan_detector()
        gan_detector.unload_model()
    except Exception as e:
        logger.error(f"Error unloading models: {e}")
    
    logger.info("✅ Shutdown complete")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "TrueSight AI Engine",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": {
            "health": "/health",
            "analyze_image": "/analyze/image",
            "analyze_video": "/analyze/video"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint with model status"""
    all_models_loaded = all(models_loaded.values())
    
    return {
        "status": "healthy" if all_models_loaded else "degraded",
        "timestamp": datetime.now().isoformat(),
        "models": models_loaded,
        "environment": {
            "device": os.getenv("DEVICE", "cpu"),
            "models_dir": os.getenv("MODELS_DIR", "./models"),
        }
    }

# Include routers
app.include_router(analyze_router)

# API key authentication middleware
@app.middleware("http")
async def verify_api_key(request, call_next):
    """Verify API key for protected endpoints"""
    # Skip authentication for health and root endpoints
    if request.url.path in ["/", "/health", "/docs", "/redoc", "/openapi.json"]:
        return await call_next(request)
    
    # Check API key
    api_key = request.headers.get("X-API-Key")
    expected_key = os.getenv("API_KEY")
    
    if expected_key and api_key != expected_key:
        logger.warning(f"Unauthorized access attempt from {request.client.host}")
        raise HTTPException(status_code=401, detail="Invalid or missing API key")
    
    return await call_next(request)
