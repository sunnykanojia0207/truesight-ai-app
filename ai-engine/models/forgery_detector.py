import torch
import torch.nn as nn
import numpy as np
import cv2
import base64
from PIL import Image
import io
from typing import Dict, Any, Tuple, List

class ForgeryDetector:
    """
    Detector for image forgery and manipulation using Error Level Analysis (ELA) 
    and simulated ManTraNet behavior for demonstration purposes.
    """
    
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.is_loaded = False
        self._load_model()

    def _load_model(self):
        """
        Load the forgery detection model.
        In a real implementation, this would load ManTraNet or similar weights.
        """
        try:
            # Placeholder for actual model loading
            # self.model = ManTraNet()
            # self.model.load_state_dict(torch.load("weights/mantranet.pth"))
            # self.model.to(self.device)
            # self.model.eval()
            
            print("Forgery detection model loaded (simulated)")
            self.is_loaded = True
        except Exception as e:
            print(f"Error loading forgery detection model: {e}")
            self.is_loaded = False

    def detect(self, image: Image.Image) -> Dict[str, Any]:
        """
        Detect image forgery and generate manipulation heatmap.
        
        Args:
            image: PIL Image object
            
        Returns:
            Dictionary containing:
            - is_manipulated: boolean
            - confidence: float (0-1)
            - heatmap: base64 encoded image string
            - regions: list of bounding boxes [x, y, w, h]
        """
        if not self.is_loaded:
            return {
                "is_manipulated": False,
                "confidence": 0.0,
                "heatmap": None,
                "regions": []
            }

        try:
            # Convert PIL image to numpy array (RGB)
            img_np = np.array(image.convert('RGB'))
            
            # 1. Generate Error Level Analysis (ELA) heatmap
            # This is a real forensic technique that works without a heavy DL model
            ela_heatmap = self._generate_ela_heatmap(image)
            
            # 2. Analyze the heatmap to find suspicious regions
            # Convert ELA to grayscale for processing
            gray_ela = cv2.cvtColor(ela_heatmap, cv2.COLOR_RGB2GRAY)
            
            # Threshold to find high-error regions (potential manipulations)
            _, thresh = cv2.threshold(gray_ela, 127, 255, cv2.THRESH_BINARY)
            
            # Find contours of suspicious regions
            contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            regions = []
            total_suspicious_area = 0
            img_area = img_np.shape[0] * img_np.shape[1]
            
            for contour in contours:
                # Filter small noise
                if cv2.contourArea(contour) > 100:
                    x, y, w, h = cv2.boundingRect(contour)
                    regions.append([int(x), int(y), int(w), int(h)])
                    total_suspicious_area += w * h
            
            # Calculate confidence based on suspicious area ratio and max intensity
            # This is a heuristic; a real model would output a probability map
            max_intensity = np.max(gray_ela)
            area_ratio = total_suspicious_area / img_area
            
            # Normalize confidence
            confidence = min(1.0, (max_intensity / 255.0) * 0.5 + (area_ratio * 10))
            if len(regions) == 0:
                confidence = 0.0
                
            is_manipulated = confidence > 0.5
            
            # 3. Create visualization heatmap (overlay)
            # Create a color map version of the ELA for visualization
            heatmap_vis = cv2.applyColorMap(gray_ela, cv2.COLORMAP_JET)
            
            # Convert to base64
            heatmap_b64 = self._encode_image_to_base64(heatmap_vis)
            
            return {
                "is_manipulated": is_manipulated,
                "confidence": float(confidence),
                "heatmap": heatmap_b64,
                "regions": regions
            }
            
        except Exception as e:
            print(f"Error in forgery detection: {e}")
            return {
                "is_manipulated": False,
                "confidence": 0.0,
                "heatmap": None,
                "regions": [],
                "error": str(e)
            }

    def _generate_ela_heatmap(self, image: Image.Image, quality: int = 90) -> np.ndarray:
        """
        Generate Error Level Analysis (ELA) heatmap.
        ELA saves the image at a specific quality level and compares it to the original.
        """
        # Save original to buffer
        original_buffer = io.BytesIO()
        image.save(original_buffer, 'JPEG', quality=100)
        original_buffer.seek(0)
        
        # Save resaved version to buffer
        resaved_buffer = io.BytesIO()
        image.save(resaved_buffer, 'JPEG', quality=quality)
        resaved_buffer.seek(0)
        
        # Load as OpenCV arrays
        original_cv = cv2.imdecode(np.frombuffer(original_buffer.getvalue(), np.uint8), 1)
        resaved_cv = cv2.imdecode(np.frombuffer(resaved_buffer.getvalue(), np.uint8), 1)
        
        # Calculate absolute difference
        ela_image = cv2.absdiff(original_cv, resaved_cv)
        
        # Enhance the brightness of the difference to make it visible
        # Scale the values to use the full 0-255 range
        max_val = np.max(ela_image)
        if max_val > 0:
            scale = 255.0 / max_val
            ela_image = cv2.convertScaleAbs(ela_image, alpha=scale)
            
        return ela_image

    def _encode_image_to_base64(self, image_np: np.ndarray) -> str:
        """Convert numpy image to base64 string."""
        success, buffer = cv2.imencode('.jpg', image_np)
        if not success:
            return ""
        return f"data:image/jpeg;base64,{base64.b64encode(buffer).decode('utf-8')}"

# Global instance
_forgery_detector = None

def get_forgery_detector() -> ForgeryDetector:
    """Get or create global ForgeryDetector instance"""
    global _forgery_detector
    if _forgery_detector is None:
        _forgery_detector = ForgeryDetector()
    return _forgery_detector

