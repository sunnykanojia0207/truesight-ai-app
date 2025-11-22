"""
Pytest configuration and fixtures for AI Engine tests
"""
import pytest
import os
import sys
from pathlib import Path
from PIL import Image
import numpy as np
import io

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

# Set test environment
os.environ['DEVICE'] = 'cpu'
os.environ['LOG_LEVEL'] = 'ERROR'
os.environ['MODELS_DIR'] = './models'


@pytest.fixture
def sample_image():
    """Create a sample RGB image for testing"""
    # Create a 224x224 RGB image with random data
    img_array = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
    return Image.fromarray(img_array, mode='RGB')


@pytest.fixture
def sample_jpeg_bytes():
    """Create sample JPEG image bytes"""
    img_array = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
    img = Image.fromarray(img_array, mode='RGB')
    
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG')
    buffer.seek(0)
    return buffer.getvalue()


@pytest.fixture
def sample_png_bytes():
    """Create sample PNG image bytes"""
    img_array = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
    img = Image.fromarray(img_array, mode='RGB')
    
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    return buffer.getvalue()


@pytest.fixture
def sample_image_with_exif():
    """Create a sample image with EXIF metadata"""
    img_array = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
    img = Image.fromarray(img_array, mode='RGB')
    
    # Add EXIF data
    from PIL.ExifTags import TAGS
    exif_dict = {
        'Make': 'Canon',
        'Model': 'EOS 5D',
        'DateTime': '2024:01:01 12:00:00',
    }
    
    return img


@pytest.fixture
def sample_image_no_exif():
    """Create a sample image without EXIF metadata"""
    img_array = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
    return Image.fromarray(img_array, mode='RGB')


@pytest.fixture
def mock_clip_result():
    """Mock CLIP classifier result"""
    return {
        'real_probability': 75.5,
        'ai_generated_probability': 24.5,
        'confidence': 0.755,
    }


@pytest.fixture
def mock_deepfake_result():
    """Mock deepfake detection result"""
    return {
        'faces_detected': 1,
        'deepfake_faces': [
            {
                'bounding_box': [100, 100, 200, 200],
                'confidence': 0.15,
                'is_deepfake': False,
            }
        ],
    }


@pytest.fixture
def mock_gan_result():
    """Mock GAN detection result"""
    return {
        'is_generated': False,
        'confidence': 0.1,
        'gan_type': None,
    }


@pytest.fixture
def mock_forgery_result():
    """Mock forgery detection result"""
    return {
        'is_manipulated': False,
        'confidence': 0.0,
        'heatmap': None,
        'regions': [],
    }


@pytest.fixture
def mock_metadata_result():
    """Mock metadata analysis result"""
    return {
        'exif': {
            'Make': 'Canon',
            'Model': 'EOS 5D',
        },
        'compression_score': 85,
        'gan_fingerprint': {
            'detected': False,
            'confidence': 0.1,
        },
        'anomalies': [],
    }


@pytest.fixture
def mock_analysis_results():
    """Complete mock analysis results"""
    return {
        'clip': {
            'real_probability': 75.5,
            'ai_generated_probability': 24.5,
        },
        'deepfake': {
            'faces_detected': 1,
            'deepfake_faces': [],
        },
        'gan': {
            'is_generated': False,
            'confidence': 0.1,
        },
        'forgery': {
            'is_manipulated': False,
            'confidence': 0.0,
        },
        'metadata': {
            'compression_score': 85,
            'anomalies': [],
        },
    }
