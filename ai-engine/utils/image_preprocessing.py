"""Image preprocessing utilities"""
import io
import numpy as np
from PIL import Image
import torch
from torchvision import transforms
from typing import Tuple, Optional
from utils.logger import setup_logger

logger = setup_logger(__name__)

# Standard image sizes for different models
CLIP_IMAGE_SIZE = 224
DEEPFAKE_IMAGE_SIZE = 256
FORGERY_IMAGE_SIZE = 512

class ImagePreprocessor:
    """Handles image loading, validation, and preprocessing"""
    
    def __init__(self, device: str = 'cpu'):
        """
        Initialize image preprocessor
        
        Args:
            device: Device to use ('cpu' or 'cuda')
        """
        self.device = device
        
        # Define transforms for different models
        self.clip_transform = transforms.Compose([
            transforms.Resize((CLIP_IMAGE_SIZE, CLIP_IMAGE_SIZE)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.48145466, 0.4578275, 0.40821073],
                std=[0.26862954, 0.26130258, 0.27577711]
            )
        ])
        
        self.deepfake_transform = transforms.Compose([
            transforms.Resize((DEEPFAKE_IMAGE_SIZE, DEEPFAKE_IMAGE_SIZE)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5])
        ])
        
        self.forgery_transform = transforms.Compose([
            transforms.Resize((FORGERY_IMAGE_SIZE, FORGERY_IMAGE_SIZE)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        
        logger.info(f"ImagePreprocessor initialized on device: {device}")
    
    def load_image(self, image_data: bytes) -> Image.Image:
        """
        Load image from bytes
        
        Args:
            image_data: Raw image bytes
            
        Returns:
            PIL Image object
            
        Raises:
            ValueError: If image cannot be loaded or is corrupted
        """
        try:
            image = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                logger.info(f"Converting image from {image.mode} to RGB")
                image = image.convert('RGB')
            
            # Verify image is valid
            image.verify()
            
            # Reopen after verify (verify closes the file)
            image = Image.open(io.BytesIO(image_data))
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            logger.info(f"Image loaded successfully: {image.size}")
            return image
            
        except Exception as e:
            logger.error(f"Failed to load image: {e}")
            raise ValueError(f"Invalid or corrupted image: {str(e)}")
    
    def preprocess_for_clip(self, image: Image.Image) -> torch.Tensor:
        """
        Preprocess image for CLIP model
        
        Args:
            image: PIL Image
            
        Returns:
            Preprocessed tensor ready for CLIP
        """
        try:
            tensor = self.clip_transform(image)
            tensor = tensor.unsqueeze(0)  # Add batch dimension
            tensor = tensor.to(self.device)
            logger.debug(f"Image preprocessed for CLIP: {tensor.shape}")
            return tensor
        except Exception as e:
            logger.error(f"Failed to preprocess for CLIP: {e}")
            raise ValueError(f"Preprocessing failed: {str(e)}")
    
    def preprocess_for_deepfake(self, image: Image.Image) -> torch.Tensor:
        """
        Preprocess image for deepfake detection model
        
        Args:
            image: PIL Image
            
        Returns:
            Preprocessed tensor ready for deepfake detection
        """
        try:
            tensor = self.deepfake_transform(image)
            tensor = tensor.unsqueeze(0)  # Add batch dimension
            tensor = tensor.to(self.device)
            logger.debug(f"Image preprocessed for deepfake detection: {tensor.shape}")
            return tensor
        except Exception as e:
            logger.error(f"Failed to preprocess for deepfake detection: {e}")
            raise ValueError(f"Preprocessing failed: {str(e)}")
    
    def preprocess_for_forgery(self, image: Image.Image) -> torch.Tensor:
        """
        Preprocess image for forgery detection model
        
        Args:
            image: PIL Image
            
        Returns:
            Preprocessed tensor ready for forgery detection
        """
        try:
            tensor = self.forgery_transform(image)
            tensor = tensor.unsqueeze(0)  # Add batch dimension
            tensor = tensor.to(self.device)
            logger.debug(f"Image preprocessed for forgery detection: {tensor.shape}")
            return tensor
        except Exception as e:
            logger.error(f"Failed to preprocess for forgery detection: {e}")
            raise ValueError(f"Preprocessing failed: {str(e)}")
    
    def resize_image(self, image: Image.Image, size: Tuple[int, int]) -> Image.Image:
        """
        Resize image to specified size
        
        Args:
            image: PIL Image
            size: Target size (width, height)
            
        Returns:
            Resized PIL Image
        """
        try:
            resized = image.resize(size, Image.Resampling.LANCZOS)
            logger.debug(f"Image resized from {image.size} to {size}")
            return resized
        except Exception as e:
            logger.error(f"Failed to resize image: {e}")
            raise ValueError(f"Resize failed: {str(e)}")
    
    def normalize_image(self, image: Image.Image) -> np.ndarray:
        """
        Normalize image to [0, 1] range
        
        Args:
            image: PIL Image
            
        Returns:
            Normalized numpy array
        """
        try:
            array = np.array(image).astype(np.float32) / 255.0
            logger.debug(f"Image normalized: shape={array.shape}, range=[{array.min():.3f}, {array.max():.3f}]")
            return array
        except Exception as e:
            logger.error(f"Failed to normalize image: {e}")
            raise ValueError(f"Normalization failed: {str(e)}")
    
    def to_tensor(self, image: Image.Image, normalize: bool = True) -> torch.Tensor:
        """
        Convert PIL Image to PyTorch tensor
        
        Args:
            image: PIL Image
            normalize: Whether to normalize to [0, 1]
            
        Returns:
            PyTorch tensor
        """
        try:
            if normalize:
                array = self.normalize_image(image)
            else:
                array = np.array(image)
            
            # Convert to tensor and change from HWC to CHW format
            tensor = torch.from_numpy(array).permute(2, 0, 1)
            tensor = tensor.to(self.device)
            logger.debug(f"Image converted to tensor: {tensor.shape}")
            return tensor
        except Exception as e:
            logger.error(f"Failed to convert to tensor: {e}")
            raise ValueError(f"Tensor conversion failed: {str(e)}")
    
    def get_image_info(self, image: Image.Image) -> dict:
        """
        Get information about the image
        
        Args:
            image: PIL Image
            
        Returns:
            Dictionary with image information
        """
        return {
            "size": image.size,
            "mode": image.mode,
            "format": image.format,
            "width": image.width,
            "height": image.height,
        }


def validate_image_size(image: Image.Image, max_size: int = 4096) -> bool:
    """
    Validate image dimensions
    
    Args:
        image: PIL Image
        max_size: Maximum dimension size
        
    Returns:
        True if valid, False otherwise
    """
    width, height = image.size
    if width > max_size or height > max_size:
        logger.warning(f"Image too large: {width}x{height} (max: {max_size})")
        return False
    if width < 32 or height < 32:
        logger.warning(f"Image too small: {width}x{height} (min: 32)")
        return False
    return True


def extract_image_patches(image: Image.Image, patch_size: int = 256, stride: int = 128) -> list:
    """
    Extract overlapping patches from image for detailed analysis
    
    Args:
        image: PIL Image
        patch_size: Size of each patch
        stride: Stride between patches
        
    Returns:
        List of image patches
    """
    patches = []
    width, height = image.size
    
    for y in range(0, height - patch_size + 1, stride):
        for x in range(0, width - patch_size + 1, stride):
            patch = image.crop((x, y, x + patch_size, y + patch_size))
            patches.append(patch)
    
    logger.info(f"Extracted {len(patches)} patches from image")
    return patches
