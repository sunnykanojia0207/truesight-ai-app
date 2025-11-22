"""GAN fingerprint detection model"""
import numpy as np
import cv2
from PIL import Image
from scipy import fftpack
from typing import Dict, Tuple
from utils.logger import setup_logger
from config import DEVICE

logger = setup_logger(__name__)

class GANDetector:
    """
    GAN fingerprint detector
    Detects GAN-generated images by analyzing frequency domain patterns
    and statistical artifacts common in GAN outputs
    """
    
    def __init__(self, device: str = DEVICE):
        """
        Initialize GAN detector
        
        Args:
            device: Device to use ('cpu' or 'cuda')
        """
        self.device = device
        self.loaded = False
        
        # Thresholds for detection
        self.frequency_threshold = 0.15
        self.pattern_threshold = 0.20
        self.color_threshold = 0.18
        
        logger.info(f"GANDetector initialized on device: {device}")
    
    def load_model(self):
        """Load GAN detection model (or initialize heuristics)"""
        try:
            logger.info("Loading GAN detection model...")
            
            # TODO: Load actual trained GAN detection model
            # For now, we use frequency analysis and statistical methods
            
            self.loaded = True
            logger.info("✓ GAN detector loaded (heuristic mode)")
            
        except Exception as e:
            logger.error(f"Failed to load GAN detector: {e}")
            raise RuntimeError(f"Model loading failed: {str(e)}")
    
    def analyze_frequency_domain(self, image: np.ndarray) -> float:
        """
        Analyze frequency domain for GAN artifacts
        GANs often leave characteristic patterns in frequency space
        
        Args:
            image: Image as numpy array
            
        Returns:
            Confidence score (0-1)
        """
        try:
            # Convert to grayscale
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            else:
                gray = image
            
            # Apply 2D FFT
            f_transform = fftpack.fft2(gray)
            f_shift = fftpack.fftshift(f_transform)
            magnitude_spectrum = np.abs(f_shift)
            
            # Analyze high-frequency components
            # GANs often have unusual high-frequency patterns
            rows, cols = magnitude_spectrum.shape
            crow, ccol = rows // 2, cols // 2
            
            # Create mask for high frequencies
            mask = np.ones((rows, cols), np.uint8)
            r = min(rows, cols) // 4
            center = [crow, ccol]
            x, y = np.ogrid[:rows, :cols]
            mask_area = (x - center[0]) ** 2 + (y - center[1]) ** 2 <= r * r
            mask[mask_area] = 0
            
            # Calculate high-frequency energy
            high_freq_energy = np.sum(magnitude_spectrum * mask)
            total_energy = np.sum(magnitude_spectrum)
            
            high_freq_ratio = high_freq_energy / (total_energy + 1e-10)
            
            # Normalize to 0-1 range
            score = min(high_freq_ratio * 10, 1.0)
            
            logger.debug(f"Frequency analysis score: {score:.3f}")
            return score
            
        except Exception as e:
            logger.error(f"Frequency analysis failed: {e}")
            return 0.0
    
    def analyze_color_distribution(self, image: np.ndarray) -> float:
        """
        Analyze color distribution for GAN artifacts
        GANs may produce unnatural color distributions
        
        Args:
            image: Image as numpy array (RGB)
            
        Returns:
            Confidence score (0-1)
        """
        try:
            # Convert to HSV for better color analysis
            hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)
            
            # Calculate histograms
            h_hist = cv2.calcHist([hsv], [0], None, [180], [0, 180])
            s_hist = cv2.calcHist([hsv], [1], None, [256], [0, 256])
            v_hist = cv2.calcHist([hsv], [2], None, [256], [0, 256])
            
            # Normalize histograms
            h_hist = h_hist.flatten() / (h_hist.sum() + 1e-10)
            s_hist = s_hist.flatten() / (s_hist.sum() + 1e-10)
            v_hist = v_hist.flatten() / (v_hist.sum() + 1e-10)
            
            # Calculate entropy (measure of randomness)
            h_entropy = -np.sum(h_hist * np.log2(h_hist + 1e-10))
            s_entropy = -np.sum(s_hist * np.log2(s_hist + 1e-10))
            v_entropy = -np.sum(v_hist * np.log2(v_hist + 1e-10))
            
            # GANs often have lower entropy in certain channels
            # or unusual entropy patterns
            avg_entropy = (h_entropy + s_entropy + v_entropy) / 3
            
            # Expected entropy for natural images is around 6-7
            entropy_deviation = abs(avg_entropy - 6.5) / 6.5
            score = min(entropy_deviation, 1.0)
            
            logger.debug(f"Color distribution score: {score:.3f}")
            return score
            
        except Exception as e:
            logger.error(f"Color analysis failed: {e}")
            return 0.0
    
    def analyze_texture_patterns(self, image: np.ndarray) -> float:
        """
        Analyze texture patterns for GAN artifacts
        GANs may produce repetitive or unnatural textures
        
        Args:
            image: Image as numpy array
            
        Returns:
            Confidence score (0-1)
        """
        try:
            # Convert to grayscale
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            else:
                gray = image
            
            # Calculate Local Binary Pattern (LBP) features
            # This captures texture information
            radius = 1
            n_points = 8 * radius
            
            # Simple LBP implementation
            # Use int32 to be safe, though uint8 is enough for radius=1
            lbp = np.zeros(gray.shape, dtype=np.int32)
            for i in range(radius, gray.shape[0] - radius):
                for j in range(radius, gray.shape[1] - radius):
                    center = gray[i, j]
                    code = 0
                    for k in range(n_points):
                        angle = 2 * np.pi * k / n_points
                        x = int(i + radius * np.cos(angle))
                        y = int(j + radius * np.sin(angle))
                        if x < gray.shape[0] and y < gray.shape[1]:
                            if gray[x, y] >= center:
                                code |= (1 << k)
                    lbp[i, j] = code
            
            # Calculate LBP histogram
            lbp_hist, _ = np.histogram(lbp.flatten(), bins=256, range=(0, 256))
            lbp_hist = lbp_hist / (lbp_hist.sum() + 1e-10)
            
            # Calculate uniformity (GANs may have more uniform patterns)
            uniformity = np.max(lbp_hist)
            score = min(uniformity * 5, 1.0)
            
            logger.debug(f"Texture pattern score: {score:.3f}")
            return score
            
        except Exception as e:
            logger.error(f"Texture analysis failed: {e}")
            return 0.0
    
    def detect(self, image: Image.Image) -> Dict:
        """
        Detect GAN fingerprints in image
        
        Args:
            image: PIL Image
            
        Returns:
            Dictionary with detection results:
            {
                "detected": bool,
                "confidence": float (0-1)
            }
        """
        if not self.loaded:
            raise RuntimeError("Model not loaded. Call load_model() first.")
        
        try:
            # Convert to numpy array
            img_array = np.array(image)
            
            # Run multiple analyses
            freq_score = self.analyze_frequency_domain(img_array)
            color_score = self.analyze_color_distribution(img_array)
            texture_score = self.analyze_texture_patterns(img_array)
            
            # Weighted combination
            confidence = (
                freq_score * 0.4 +
                color_score * 0.3 +
                texture_score * 0.3
            )
            
            # Determine if GAN is detected
            detected = confidence > 0.5
            
            result = {
                "detected": bool(detected),
                "confidence": round(float(confidence), 3)
            }
            
            logger.info(f"GAN detection: detected={detected}, confidence={confidence:.3f}")
            
            return result
            
        except Exception as e:
            logger.error(f"GAN detection failed: {e}")
            return {
                "detected": False,
                "confidence": 0.0
            }
    
    def detect_gan_architecture(self, image: Image.Image) -> str:
        """
        Attempt to identify specific GAN architecture
        
        Args:
            image: PIL Image
            
        Returns:
            GAN architecture name or "Unknown"
        """
        # TODO: Implement architecture-specific detection
        # This would require trained classifiers for different GANs
        # (StyleGAN, ProGAN, BigGAN, etc.)
        
        return "Unknown"
    
    def unload_model(self):
        """Unload model to free memory"""
        if self.loaded:
            self.loaded = False
            logger.info("GAN detector unloaded")


# Global instance
_gan_detector = None

def get_gan_detector() -> GANDetector:
    """Get or create global GAN detector instance"""
    global _gan_detector
    if _gan_detector is None:
        _gan_detector = GANDetector()
    return _gan_detector
