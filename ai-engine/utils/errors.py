"""Custom error classes"""

class ImageProcessingError(Exception):
    """Raised when image processing fails"""
    pass

class ModelLoadError(Exception):
    """Raised when model loading fails"""
    pass

class AnalysisError(Exception):
    """Raised when analysis fails"""
    pass

class InvalidImageError(Exception):
    """Raised when image is invalid or corrupted"""
    pass
