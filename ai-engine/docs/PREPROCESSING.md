# Image Preprocessing Pipeline

## Overview

The image preprocessing pipeline handles loading, validation, and transformation of images for various AI models. It ensures consistent input formats and handles edge cases gracefully.

## Components

### ImagePreprocessor Class

Main class for image preprocessing operations.

#### Initialization

```python
from utils.image_preprocessing import ImagePreprocessor

preprocessor = ImagePreprocessor(device='cpu')  # or 'cuda'
```

#### Methods

##### load_image(image_data: bytes) -> Image.Image

Loads an image from raw bytes and converts to RGB.

**Features:**
- Automatic RGB conversion
- Image validation
- Error handling for corrupted images

**Example:**
```python
with open('image.jpg', 'rb') as f:
    image_data = f.read()

image = preprocessor.load_image(image_data)
```

##### preprocess_for_clip(image: Image.Image) -> torch.Tensor

Preprocesses image for CLIP model (224x224).

**Transformations:**
- Resize to 224x224
- Convert to tensor
- Normalize with CLIP mean/std
- Add batch dimension

**Example:**
```python
tensor = preprocessor.preprocess_for_clip(image)
# Shape: [1, 3, 224, 224]
```

##### preprocess_for_deepfake(image: Image.Image) -> torch.Tensor

Preprocesses image for deepfake detection (256x256).

**Transformations:**
- Resize to 256x256
- Convert to tensor
- Normalize to [-1, 1]
- Add batch dimension

**Example:**
```python
tensor = preprocessor.preprocess_for_deepfake(image)
# Shape: [1, 3, 256, 256]
```

##### preprocess_for_forgery(image: Image.Image) -> torch.Tensor

Preprocesses image for forgery detection (512x512).

**Transformations:**
- Resize to 512x512
- Convert to tensor
- Normalize with ImageNet mean/std
- Add batch dimension

**Example:**
```python
tensor = preprocessor.preprocess_for_forgery(image)
# Shape: [1, 3, 512, 512]
```

##### resize_image(image: Image.Image, size: Tuple[int, int]) -> Image.Image

Resizes image to specified dimensions using LANCZOS resampling.

**Example:**
```python
resized = preprocessor.resize_image(image, (512, 512))
```

##### normalize_image(image: Image.Image) -> np.ndarray

Normalizes image pixel values to [0, 1] range.

**Example:**
```python
normalized = preprocessor.normalize_image(image)
# Values in range [0.0, 1.0]
```

##### to_tensor(image: Image.Image, normalize: bool = True) -> torch.Tensor

Converts PIL Image to PyTorch tensor.

**Example:**
```python
tensor = preprocessor.to_tensor(image)
# Shape: [3, H, W]
```

##### get_image_info(image: Image.Image) -> dict

Extracts metadata about the image.

**Returns:**
```python
{
    "size": (width, height),
    "mode": "RGB",
    "format": "JPEG",
    "width": 1024,
    "height": 768
}
```

## Utility Functions

### validate_image_size(image: Image.Image, max_size: int = 4096) -> bool

Validates image dimensions.

**Checks:**
- Maximum dimension ≤ 4096 pixels
- Minimum dimension ≥ 32 pixels

**Example:**
```python
from utils.image_preprocessing import validate_image_size

if validate_image_size(image):
    # Process image
    pass
else:
    # Handle invalid size
    pass
```

### extract_image_patches(image: Image.Image, patch_size: int = 256, stride: int = 128) -> list

Extracts overlapping patches for detailed analysis.

**Example:**
```python
from utils.image_preprocessing import extract_image_patches

patches = extract_image_patches(image, patch_size=256, stride=128)
# Returns list of PIL Images
```

## Image Sizes

Different models require different input sizes:

| Model | Size | Purpose |
|-------|------|---------|
| CLIP | 224x224 | Real vs AI classification |
| Deepfake | 256x256 | Face deepfake detection |
| Forgery | 512x512 | Manipulation detection |

## Normalization

### CLIP Normalization
```python
mean = [0.48145466, 0.4578275, 0.40821073]
std = [0.26862954, 0.26130258, 0.27577711]
```

### Deepfake Normalization
```python
mean = [0.5, 0.5, 0.5]
std = [0.5, 0.5, 0.5]
# Results in [-1, 1] range
```

### Forgery Normalization (ImageNet)
```python
mean = [0.485, 0.456, 0.406]
std = [0.229, 0.224, 0.225]
```

## Error Handling

The preprocessing pipeline includes comprehensive error handling:

### InvalidImageError
Raised when image cannot be loaded or is corrupted.

### ValueError
Raised when preprocessing operations fail.

**Example:**
```python
try:
    image = preprocessor.load_image(image_data)
    tensor = preprocessor.preprocess_for_clip(image)
except ValueError as e:
    logger.error(f"Preprocessing failed: {e}")
    # Handle error
```

## Testing

Run the test script to verify preprocessing:

```bash
python test_preprocessing.py
```

**Expected output:**
```
Testing image preprocessing pipeline...
Testing image loading...
✓ Image loaded: (512, 512)
Testing image validation...
✓ Image valid: True
Testing CLIP preprocessing...
✓ CLIP tensor shape: torch.Size([1, 3, 224, 224])
Testing deepfake preprocessing...
✓ Deepfake tensor shape: torch.Size([1, 3, 256, 256])
Testing forgery preprocessing...
✓ Forgery tensor shape: torch.Size([1, 3, 512, 512])
✅ All preprocessing tests passed!
```

## Performance Considerations

### Memory Usage
- Original image: ~H×W×3 bytes
- Tensor (float32): ~H×W×3×4 bytes
- Batch processing: Use appropriate batch sizes

### Speed Optimization
- Use GPU for tensor operations when available
- Batch multiple images together
- Cache preprocessed tensors if analyzing same image multiple times

### Best Practices

1. **Always validate images** before preprocessing
2. **Handle errors gracefully** with try-except blocks
3. **Log preprocessing steps** for debugging
4. **Use appropriate device** (CPU vs GPU)
5. **Clean up tensors** after use to free memory

## Integration Example

```python
from utils.image_preprocessing import ImagePreprocessor
from utils.logger import setup_logger

logger = setup_logger(__name__)

async def analyze_image(image_data: bytes):
    """Analyze image with preprocessing"""
    try:
        # Initialize preprocessor
        preprocessor = ImagePreprocessor(device='cuda')
        
        # Load and validate
        image = preprocessor.load_image(image_data)
        
        if not validate_image_size(image):
            raise ValueError("Image size invalid")
        
        # Preprocess for different models
        clip_tensor = preprocessor.preprocess_for_clip(image)
        deepfake_tensor = preprocessor.preprocess_for_deepfake(image)
        forgery_tensor = preprocessor.preprocess_for_forgery(image)
        
        # Run models (to be implemented)
        # clip_result = clip_model(clip_tensor)
        # deepfake_result = deepfake_model(deepfake_tensor)
        # forgery_result = forgery_model(forgery_tensor)
        
        return {
            "status": "success",
            "image_info": preprocessor.get_image_info(image)
        }
        
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        raise
```

## Next Steps

- Implement CLIP classifier (Task 12)
- Implement deepfake detector (Task 13)
- Implement GAN detector (Task 14)
- Implement forgery detector (Task 15)
