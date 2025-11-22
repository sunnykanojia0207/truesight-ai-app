"""Test script for image preprocessing"""
import sys
from pathlib import Path
from PIL import Image
import io

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from utils.image_preprocessing import ImagePreprocessor, validate_image_size
from utils.logger import setup_logger

logger = setup_logger(__name__)

def test_preprocessing():
    """Test image preprocessing pipeline"""
    logger.info("Testing image preprocessing pipeline...")
    
    # Create a test image
    test_image = Image.new('RGB', (512, 512), color='red')
    
    # Convert to bytes
    img_byte_arr = io.BytesIO()
    test_image.save(img_byte_arr, format='JPEG')
    img_bytes = img_byte_arr.getvalue()
    
    # Initialize preprocessor
    preprocessor = ImagePreprocessor(device='cpu')
    
    # Test loading
    logger.info("Testing image loading...")
    loaded_image = preprocessor.load_image(img_bytes)
    logger.info(f"✓ Image loaded: {loaded_image.size}")
    
    # Test validation
    logger.info("Testing image validation...")
    is_valid = validate_image_size(loaded_image)
    logger.info(f"✓ Image valid: {is_valid}")
    
    # Test CLIP preprocessing
    logger.info("Testing CLIP preprocessing...")
    clip_tensor = preprocessor.preprocess_for_clip(loaded_image)
    logger.info(f"✓ CLIP tensor shape: {clip_tensor.shape}")
    
    # Test deepfake preprocessing
    logger.info("Testing deepfake preprocessing...")
    deepfake_tensor = preprocessor.preprocess_for_deepfake(loaded_image)
    logger.info(f"✓ Deepfake tensor shape: {deepfake_tensor.shape}")
    
    # Test forgery preprocessing
    logger.info("Testing forgery preprocessing...")
    forgery_tensor = preprocessor.preprocess_for_forgery(loaded_image)
    logger.info(f"✓ Forgery tensor shape: {forgery_tensor.shape}")
    
    # Test resizing
    logger.info("Testing image resizing...")
    resized = preprocessor.resize_image(loaded_image, (256, 256))
    logger.info(f"✓ Resized image: {resized.size}")
    
    # Test normalization
    logger.info("Testing image normalization...")
    normalized = preprocessor.normalize_image(loaded_image)
    logger.info(f"✓ Normalized array shape: {normalized.shape}, range: [{normalized.min():.3f}, {normalized.max():.3f}]")
    
    # Test tensor conversion
    logger.info("Testing tensor conversion...")
    tensor = preprocessor.to_tensor(loaded_image)
    logger.info(f"✓ Tensor shape: {tensor.shape}")
    
    # Test image info
    logger.info("Testing image info extraction...")
    info = preprocessor.get_image_info(loaded_image)
    logger.info(f"✓ Image info: {info}")
    
    logger.info("✅ All preprocessing tests passed!")

if __name__ == "__main__":
    test_preprocessing()
