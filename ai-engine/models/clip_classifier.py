"""CLIP-based real vs fake classifier"""
import torch
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
from typing import Dict, Tuple
from utils.logger import setup_logger
from config import DEVICE, MODELS_DIR

logger = setup_logger(__name__)

class CLIPClassifier:
    """
    CLIP-based classifier for detecting AI-generated vs real images
    Uses zero-shot classification with text prompts
    """
    
    def __init__(self, device: str = DEVICE):
        """
        Initialize CLIP classifier
        
        Args:
            device: Device to use ('cpu' or 'cuda')
        """
        self.device = device
        self.model = None
        self.processor = None
        self.loaded = False
        
        # Text prompts for classification
        self.prompts = {
            "real": [
                "a real photograph",
                "an authentic image",
                "a genuine photo taken with a camera",
                "a natural photograph",
                "a real-world image"
            ],
            "ai_generated": [
                "an AI-generated image",
                "a synthetic image",
                "a computer-generated image",
                "an artificial image",
                "a fake AI-created image"
            ]
        }
        
        logger.info(f"CLIPClassifier initialized on device: {device}")
    
    def load_model(self, model_name: str = "openai/clip-vit-base-patch32"):
        """
        Load CLIP model from Hugging Face
        
        Args:
            model_name: Name of the CLIP model to load
        """
        try:
            logger.info(f"Loading CLIP model: {model_name}")
            
            # Load model and processor
            self.model = CLIPModel.from_pretrained(model_name)
            self.processor = CLIPProcessor.from_pretrained(model_name)
            
            # Move model to device
            self.model = self.model.to(self.device)
            self.model.eval()  # Set to evaluation mode
            
            self.loaded = True
            logger.info(f"✓ CLIP model loaded successfully on {self.device}")
            
        except Exception as e:
            logger.error(f"Failed to load CLIP model: {e}")
            raise RuntimeError(f"CLIP model loading failed: {str(e)}")
    
    def classify(self, image: Image.Image) -> Dict[str, float]:
        """
        Classify image as real or AI-generated
        
        Args:
            image: PIL Image to classify
            
        Returns:
            Dictionary with probabilities:
            {
                "real_probability": float (0-100),
                "ai_generated_probability": float (0-100),
                "confidence": float (0-1)
            }
        """
        if not self.loaded:
            raise RuntimeError("Model not loaded. Call load_model() first.")
        
        try:
            # Prepare all prompts
            all_prompts = self.prompts["real"] + self.prompts["ai_generated"]
            
            # Process inputs
            inputs = self.processor(
                text=all_prompts,
                images=image,
                return_tensors="pt",
                padding=True
            )
            
            # Move inputs to device
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            # Get predictions
            with torch.no_grad():
                outputs = self.model(**inputs)
                logits_per_image = outputs.logits_per_image
                probs = logits_per_image.softmax(dim=1)
            
            # Calculate average probabilities for each category
            probs_cpu = probs.cpu().numpy()[0]
            
            num_real_prompts = len(self.prompts["real"])
            real_prob = probs_cpu[:num_real_prompts].mean()
            ai_prob = probs_cpu[num_real_prompts:].mean()
            
            # Normalize to sum to 1
            total = real_prob + ai_prob
            real_prob = real_prob / total
            ai_prob = ai_prob / total
            
            # Calculate confidence (how certain the model is)
            confidence = abs(real_prob - ai_prob)
            
            result = {
                "real_probability": float(real_prob * 100),
                "ai_generated_probability": float(ai_prob * 100),
                "confidence": float(confidence)
            }
            
            logger.info(f"CLIP classification: Real={result['real_probability']:.1f}%, "
                       f"AI={result['ai_generated_probability']:.1f}%, "
                       f"Confidence={result['confidence']:.2f}")
            
            return result
            
        except Exception as e:
            logger.error(f"CLIP classification failed: {e}")
            raise RuntimeError(f"Classification failed: {str(e)}")
    
    def classify_with_custom_prompts(
        self, 
        image: Image.Image, 
        real_prompts: list, 
        fake_prompts: list
    ) -> Dict[str, float]:
        """
        Classify image with custom prompts
        
        Args:
            image: PIL Image to classify
            real_prompts: List of prompts describing real images
            fake_prompts: List of prompts describing fake images
            
        Returns:
            Dictionary with probabilities
        """
        if not self.loaded:
            raise RuntimeError("Model not loaded. Call load_model() first.")
        
        try:
            all_prompts = real_prompts + fake_prompts
            
            inputs = self.processor(
                text=all_prompts,
                images=image,
                return_tensors="pt",
                padding=True
            )
            
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            with torch.no_grad():
                outputs = self.model(**inputs)
                logits_per_image = outputs.logits_per_image
                probs = logits_per_image.softmax(dim=1)
            
            probs_cpu = probs.cpu().numpy()[0]
            
            real_prob = probs_cpu[:len(real_prompts)].mean()
            fake_prob = probs_cpu[len(real_prompts):].mean()
            
            total = real_prob + fake_prob
            real_prob = real_prob / total
            fake_prob = fake_prob / total
            
            confidence = abs(real_prob - fake_prob)
            
            return {
                "real_probability": float(real_prob * 100),
                "ai_generated_probability": float(fake_prob * 100),
                "confidence": float(confidence)
            }
            
        except Exception as e:
            logger.error(f"Custom prompt classification failed: {e}")
            raise RuntimeError(f"Classification failed: {str(e)}")
    
    def get_image_features(self, image: Image.Image) -> torch.Tensor:
        """
        Extract image features using CLIP
        
        Args:
            image: PIL Image
            
        Returns:
            Image feature tensor
        """
        if not self.loaded:
            raise RuntimeError("Model not loaded. Call load_model() first.")
        
        try:
            inputs = self.processor(images=image, return_tensors="pt")
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            with torch.no_grad():
                image_features = self.model.get_image_features(**inputs)
            
            return image_features
            
        except Exception as e:
            logger.error(f"Feature extraction failed: {e}")
            raise RuntimeError(f"Feature extraction failed: {str(e)}")
    
    def unload_model(self):
        """Unload model to free memory"""
        if self.loaded:
            del self.model
            del self.processor
            if self.device == 'cuda':
                torch.cuda.empty_cache()
            self.loaded = False
            logger.info("CLIP model unloaded")


# Global instance
_clip_classifier = None

def get_clip_classifier() -> CLIPClassifier:
    """Get or create global CLIP classifier instance"""
    global _clip_classifier
    if _clip_classifier is None:
        _clip_classifier = CLIPClassifier()
    return _clip_classifier
