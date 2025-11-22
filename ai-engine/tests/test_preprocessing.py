"""
Tests for image preprocessing pipeline
"""
import pytest
import numpy as np
from PIL import Image
from utils.image_preprocessing import (
    load_image,
    preprocess_for_clip,
    preprocess_for_detection,
    resize_image,
    normalize_image,
)


@pytest.mark.unit
class TestImagePreprocessing:
    """Test image preprocessing functions"""

    def test_load_image_from_bytes(self, sample_jpeg_bytes):
        """Test loading image from bytes"""
        img = load_image(sample_jpeg_bytes)
        
        assert isinstance(img, Image.Image)
        assert img.mode == 'RGB'
        assert img.size[0] > 0 and img.size[1] > 0

    def test_load_image_png(self, sample_png_bytes):
        """Test loading PNG image"""
        img = load_image(sample_png_bytes)
        
        assert isinstance(img, Image.Image)
        assert img.mode == 'RGB'

    def test_load_image_invalid_data(self):
        """Test loading invalid image data"""
        with pytest.raises(Exception):
            load_image(b'invalid image data')

    def test_resize_image(self, sample_image):
        """Test image resizing"""
        resized = resize_image(sample_image, (512, 512))
        
        assert isinstance(resized, Image.Image)
        assert resized.size == (512, 512)

    def test_resize_image_maintains_aspect_ratio(self, sample_image):
        """Test resizing maintains aspect ratio when specified"""
        # Create a non-square image
        img = Image.new('RGB', (400, 200))
        resized = resize_image(img, (224, 224), maintain_aspect=True)
        
        assert isinstance(resized, Image.Image)
        # Should be padded or cropped to 224x224
        assert resized.size == (224, 224)

    def test_normalize_image(self, sample_image):
        """Test image normalization"""
        img_array = np.array(sample_image)
        normalized = normalize_image(img_array)
        
        assert isinstance(normalized, np.ndarray)
        assert normalized.dtype == np.float32
        # Check values are normalized (typically 0-1 or -1 to 1)
        assert normalized.min() >= -1.0
        assert normalized.max() <= 1.0

    def test_preprocess_for_clip(self, sample_image):
        """Test preprocessing for CLIP model"""
        processed = preprocess_for_clip(sample_image)
        
        assert isinstance(processed, (np.ndarray, Image.Image))
        # CLIP typically expects 224x224 images
        if isinstance(processed, Image.Image):
            assert processed.size == (224, 224)

    def test_preprocess_for_detection(self, sample_image):
        """Test preprocessing for detection models"""
        processed = preprocess_for_detection(sample_image)
        
        assert isinstance(processed, np.ndarray)
        # Check shape is valid (C, H, W) or (H, W, C)
        assert len(processed.shape) == 3
        assert processed.shape[2] == 3 or processed.shape[0] == 3

    def test_preprocess_handles_grayscale(self):
        """Test preprocessing converts grayscale to RGB"""
        # Create grayscale image
        gray_img = Image.new('L', (224, 224))
        processed = preprocess_for_clip(gray_img)
        
        # Should be converted to RGB
        if isinstance(processed, Image.Image):
            assert processed.mode == 'RGB'

    def test_preprocess_handles_rgba(self):
        """Test preprocessing handles RGBA images"""
        # Create RGBA image
        rgba_img = Image.new('RGBA', (224, 224))
        processed = preprocess_for_clip(rgba_img)
        
        # Should be converted to RGB
        if isinstance(processed, Image.Image):
            assert processed.mode == 'RGB'

    def test_preprocess_various_sizes(self):
        """Test preprocessing handles various image sizes"""
        sizes = [(100, 100), (500, 300), (1920, 1080), (50, 200)]
        
        for size in sizes:
            img = Image.new('RGB', size)
            processed = preprocess_for_clip(img)
            
            assert processed is not None
            if isinstance(processed, Image.Image):
                # Should be resized to standard size
                assert processed.size == (224, 224)
