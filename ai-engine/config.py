"""Configuration settings for AI Engine"""
import os
from pathlib import Path

# API Configuration
API_KEY = os.getenv("API_KEY", "")

# Model Configuration
MODELS_DIR = Path(os.getenv("MODELS_DIR", "./models"))
DEVICE = os.getenv("DEVICE", "cpu")  # 'cuda' or 'cpu'

# Processing Configuration
MAX_VIDEO_DURATION_SECONDS = int(os.getenv("MAX_VIDEO_DURATION_SECONDS", "300"))
FRAME_EXTRACTION_INTERVAL_SECONDS = int(os.getenv("FRAME_EXTRACTION_INTERVAL_SECONDS", "1"))
MAX_BATCH_SIZE = int(os.getenv("MAX_BATCH_SIZE", "8"))

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# Ensure models directory exists
MODELS_DIR.mkdir(parents=True, exist_ok=True)
