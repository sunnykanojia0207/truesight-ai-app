import torch
import numpy as np
from PIL import Image
from typing import Dict, Tuple, Optional, Any
from config import DEVICE

class SourcePredictor:
    """
    Predictor for identifying the source model of AI-generated content.
    Supports detection of Midjourney, DALL-E, Stable Diffusion, etc.
    """
    
    def __init__(self, device: str = DEVICE):
        self.device = device
        self.sources = [
            "Midjourney", 
            "DALL-E", 
            "Stable Diffusion", 
            "Sora", 
            "Runway",
            "Unknown"
        ]
        self.is_loaded = False
        self._load_model()

    def _load_model(self):
        """
        Load the source prediction model.
        """
        try:
            # Placeholder for actual model loading
            # In a real implementation, this would be a fine-tuned ResNet or EfficientNet
            print("Source prediction model loaded (simulated)")
            self.is_loaded = True
        except Exception as e:
            print(f"Error loading source prediction model: {e}")
            self.is_loaded = False

    def predict(self, image: Image.Image) -> Dict[str, Any]:
        """
        Predict the source model of the image.
        
        Args:
            image: PIL Image object
            
        Returns:
            Dictionary containing:
            - source: str (predicted source name)
            - confidence: float (0-1)
            - probabilities: Dict[str, float]
        """
        if not self.is_loaded:
            return {
                "source": "Unknown",
                "confidence": 0.0,
                "probabilities": {s: 0.0 for s in self.sources}
            }

        try:
            # In a real implementation, we would run the image through the model
            # Here we'll use some heuristics based on image size/aspect ratio common to these models
            # or just return a mock result for now since we don't have the weights
            
            width, height = image.size
            ratio = width / height
            
            # Heuristics (very basic)
            probs = {s: 0.1 for s in self.sources}
            
            # Midjourney often produces specific aspect ratios and high detail
            if width == 1024 and height == 1024:
                probs["Midjourney"] += 0.3
                probs["DALL-E"] += 0.2
            elif abs(ratio - 1.5) < 0.1 or abs(ratio - 0.66) < 0.1: # 3:2 or 2:3
                probs["Stable Diffusion"] += 0.2
                
            # Normalize probabilities
            total = sum(probs.values())
            probs = {k: v / total for k, v in probs.items()}
            
            # Get top prediction
            predicted_source = max(probs, key=probs.get)
            confidence = probs[predicted_source]
            
            # If confidence is too low, return Unknown
            if confidence < 0.3:
                predicted_source = "Unknown"
            
            return {
                "source": predicted_source,
                "confidence": float(confidence),
                "probabilities": probs
            }
            
        except Exception as e:
            print(f"Error in source prediction: {e}")
            return {
                "source": "Unknown",
                "confidence": 0.0,
                "probabilities": {s: 0.0 for s in self.sources}
            }

# Global instance
_source_predictor = None

def get_source_predictor() -> SourcePredictor:
    """Get or create global SourcePredictor instance"""
    global _source_predictor
    if _source_predictor is None:
        _source_predictor = SourcePredictor()
    return _source_predictor
