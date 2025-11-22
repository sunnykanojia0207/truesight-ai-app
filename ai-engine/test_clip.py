"""Test script for CLIP classifier"""
import sys
from pathlib import Path
from PIL import Image
import io

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from models.clip_classifier import CLIPClassifier
from utils.logger import setup_logger

logger = setup_logger(__name__)

def test_clip_classifier():
    """Test CLIP classifier"""
    logger.info("Testing CLIP classifier...")
    
    # Create a test image
    test_image = Image.new('RGB', (512, 512), color='blue')
    
    # Initialize classifier
    logger.info("Initializing CLIP classifier...")
    classifier = CLIPClassifier(device='cpu')
    
    # Load model
    logger.info("Loading CLIP model...")
    classifier.load_model()
    logger.info("✓ Model loaded")
    
    # Test classification
    logger.info("Testing classification...")
    result = classifier.classify(test_image)
    
    logger.info(f"✓ Classification results:")
    logger.info(f"  Real probability: {result['real_probability']:.2f}%")
    logger.info(f"  AI-generated probability: {result['ai_generated_probability']:.2f}%")
    logger.info(f"  Confidence: {result['confidence']:.2f}")
    
    # Test custom prompts
    logger.info("Testing custom prompts...")
    custom_result = classifier.classify_with_custom_prompts(
        test_image,
        real_prompts=["a photograph", "a real image"],
        fake_prompts=["a drawing", "a painting"]
    )
    
    logger.info(f"✓ Custom prompt results:")
    logger.info(f"  Real probability: {custom_result['real_probability']:.2f}%")
    logger.info(f"  AI-generated probability: {custom_result['ai_generated_probability']:.2f}%")
    
    # Test feature extraction
    logger.info("Testing feature extraction...")
    features = classifier.get_image_features(test_image)
    logger.info(f"✓ Features extracted: shape={features.shape}")
    
    # Unload model
    logger.info("Unloading model...")
    classifier.unload_model()
    logger.info("✓ Model unloaded")
    
    logger.info("✅ All CLIP tests passed!")

if __name__ == "__main__":
    test_clip_classifier()
