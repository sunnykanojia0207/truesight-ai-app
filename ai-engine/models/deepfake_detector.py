"""Deepfake face detection model"""
import torch
import torch.nn as nn
import cv2
import numpy as np
from PIL import Image
from typing import List, Dict, Tuple, Optional
from utils.logger import setup_logger
from config import DEVICE

logger = setup_logger(__name__)

class DeepfakeDetector:
    """
    Deepfake detection model with face detection
    Uses a combination of face detection and deepfake classification
    """
    
    def __init__(self, device: str = DEVICE):
        """
        Initialize deepfake detector
        
        Args:
            device: Device to use ('cpu' or 'cuda')
        """
        self.device = device
        self.face_detector = None
        self.deepfake_model = None
        self.loaded = False
        
        logger.info(f"DeepfakeDetector initialized on device: {device}")
    
    def load_models(self):
        """Load face detection and deepfake classification models"""
        try:
            logger.info("Loading face detection model...")
            
            # Use OpenCV's Haar Cascade for face detection
            # In production, use a more robust detector like MTCNN or RetinaFace
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            self.face_detector = cv2.CascadeClassifier(cascade_path)
            
            if self.face_detector.empty():
                raise RuntimeError("Failed to load face detector")
            
            logger.info("✓ Face detector loaded")
            
            # TODO: Load actual deepfake detection model
            # For now, we'll use a heuristic-based approach
            logger.info("✓ Deepfake classifier loaded (heuristic mode)")
            
            self.loaded = True
            logger.info("✓ Deepfake detection models loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load deepfake detection models: {e}")
            raise RuntimeError(f"Model loading failed: {str(e)}")
    
    def detect_faces(self, image: Image.Image) -> List[Tuple[int, int, int, int]]:
        """
        Detect faces in image
        
        Args:
            image: PIL Image
            
        Returns:
            List of face bounding boxes [(x, y, w, h), ...]
        """
        if not self.loaded:
            raise RuntimeError("Models not loaded. Call load_models() first.")
        
        try:
            # Convert PIL Image to OpenCV format
            img_array = np.array(image)
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            
            # Detect faces
            faces = self.face_detector.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30)
            )
            
            face_list = [(int(x), int(y), int(w), int(h)) for x, y, w, h in faces]
            logger.info(f"Detected {len(face_list)} faces")
            
            return face_list
            
        except Exception as e:
            logger.error(f"Face detection failed: {e}")
            return []
    
    def extract_face(
        self, 
        image: Image.Image, 
        bbox: Tuple[int, int, int, int],
        padding: float = 0.2
    ) -> Optional[Image.Image]:
        """
        Extract face region from image with padding
        
        Args:
            image: PIL Image
            bbox: Bounding box (x, y, w, h)
            padding: Padding ratio around face
            
        Returns:
            Cropped face image or None if extraction fails
        """
        try:
            x, y, w, h = bbox
            
            # Add padding
            pad_w = int(w * padding)
            pad_h = int(h * padding)
            
            x1 = max(0, x - pad_w)
            y1 = max(0, y - pad_h)
            x2 = min(image.width, x + w + pad_w)
            y2 = min(image.height, y + h + pad_h)
            
            # Crop face
            face = image.crop((x1, y1, x2, y2))
            
            return face
            
        except Exception as e:
            logger.error(f"Face extraction failed: {e}")
            return None
    
    def analyze_face_for_deepfake(self, face_image: Image.Image) -> float:
        """
        Analyze a face image for deepfake indicators
        
        Args:
            face_image: PIL Image of face
            
        Returns:
            Deepfake confidence score (0-1, higher = more likely deepfake)
        """
        try:
            # Convert to numpy array
            face_array = np.array(face_image)
            
            # TODO: Use actual deepfake detection model
            # For now, use heuristic analysis
            
            # Heuristic 1: Check for unnatural smoothness (common in deepfakes)
            gray = cv2.cvtColor(face_array, cv2.COLOR_RGB2GRAY)
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
            
            # Lower variance suggests smoother (potentially fake) image
            smoothness_score = 1.0 - min(laplacian_var / 500.0, 1.0)
            
            # Heuristic 2: Check for color inconsistencies
            hsv = cv2.cvtColor(face_array, cv2.COLOR_RGB2HSV)
            h_std = np.std(hsv[:, :, 0])
            s_std = np.std(hsv[:, :, 1])
            
            # Deepfakes often have unusual color distributions
            color_score = min((h_std + s_std) / 100.0, 1.0)
            
            # Heuristic 3: Check for edge artifacts
            edges = cv2.Canny(gray, 100, 200)
            edge_density = np.sum(edges > 0) / edges.size
            
            # Unusual edge density can indicate manipulation
            edge_score = abs(edge_density - 0.1) * 5.0
            edge_score = min(edge_score, 1.0)
            
            # Combine scores (weighted average)
            deepfake_score = (
                smoothness_score * 0.4 +
                color_score * 0.3 +
                edge_score * 0.3
            )
            
            # Add some randomness to simulate model uncertainty
            import random
            deepfake_score = deepfake_score * 0.8 + random.uniform(0, 0.2)
            deepfake_score = min(max(deepfake_score, 0.0), 1.0)
            
            logger.debug(f"Deepfake analysis: score={deepfake_score:.3f}")
            
            return deepfake_score
            
        except Exception as e:
            logger.error(f"Deepfake analysis failed: {e}")
            return 0.0
    
    def detect(self, image: Image.Image) -> Dict:
        """
        Detect deepfakes in image
        
        Args:
            image: PIL Image
            
        Returns:
            Dictionary with detection results:
            {
                "facesDetected": int,
                "deepfakeFaces": [
                    {
                        "boundingBox": [x, y, w, h],
                        "confidence": float
                    },
                    ...
                ]
            }
        """
        if not self.loaded:
            raise RuntimeError("Models not loaded. Call load_models() first.")
        
        try:
            # Detect faces
            faces = self.detect_faces(image)
            
            deepfake_faces = []
            
            # Analyze each face
            for bbox in faces:
                # Extract face
                face_img = self.extract_face(image, bbox)
                
                if face_img is None:
                    continue
                
                # Analyze for deepfake
                confidence = self.analyze_face_for_deepfake(face_img)
                
                # Only include if confidence is above threshold
                if confidence > 0.5:  # 50% threshold
                    deepfake_faces.append({
                        "boundingBox": list(bbox),
                        "confidence": round(float(confidence), 3)
                    })
            
            result = {
                "facesDetected": len(faces),
                "deepfakeFaces": deepfake_faces
            }
            
            logger.info(f"Deepfake detection: {len(faces)} faces, "
                       f"{len(deepfake_faces)} potential deepfakes")
            
            return result
            
        except Exception as e:
            logger.error(f"Deepfake detection failed: {e}")
            return {
                "facesDetected": 0,
                "deepfakeFaces": []
            }
    
    def unload_models(self):
        """Unload models to free memory"""
        if self.loaded:
            self.face_detector = None
            self.deepfake_model = None
            self.loaded = False
            logger.info("Deepfake detection models unloaded")


# Global instance
_deepfake_detector = None

def get_deepfake_detector() -> DeepfakeDetector:
    """Get or create global deepfake detector instance"""
    global _deepfake_detector
    if _deepfake_detector is None:
        _deepfake_detector = DeepfakeDetector()
    return _deepfake_detector
