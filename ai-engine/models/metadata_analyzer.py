import cv2
import numpy as np
from PIL import Image, ExifTags
from typing import Dict, Any, List, Optional
import os
from datetime import datetime

class MetadataAnalyzer:
    """
    Analyzer for image metadata, EXIF data, and compression artifacts.
    """
    
    def __init__(self):
        self.suspicious_software = [
            "Adobe Photoshop", "GIMP", "Paint.NET", "Midjourney", 
            "Stable Diffusion", "DALL-E", "Canva"
        ]

    def analyze(self, image: Image.Image, file_path: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyze image metadata and compression artifacts.
        
        Args:
            image: PIL Image object
            file_path: Optional path to the file (for file system metadata)
            
        Returns:
            Dictionary containing:
            - exif: Dict of EXIF data
            - compression_score: float (0-100, lower means more likely manipulated/recompressed)
            - software_detected: str or None
            - is_metadata_stripped: boolean
            - anomalies: List[str]
        """
        results = {
            "exif": {},
            "compression_score": 100.0,
            "software_detected": None,
            "is_metadata_stripped": False,
            "anomalies": []
        }
        
        # 1. Extract EXIF Data
        try:
            exif_data = image._getexif()
            if exif_data:
                for tag_id, value in exif_data.items():
                    tag = ExifTags.TAGS.get(tag_id, tag_id)
                    # Sanitize value for JSON serialization
                    results["exif"][tag] = self._sanitize_exif_value(value)
                    
                # Check for software signatures
                if "Software" in results["exif"]:
                    software = results["exif"]["Software"]
                    results["software_detected"] = software
                    for susp in self.suspicious_software:
                        if susp.lower() in software.lower():
                            results["anomalies"].append(f"Suspicious editing software detected: {software}")
            else:
                results["is_metadata_stripped"] = True
                results["anomalies"].append("No EXIF metadata found (possibly stripped)")
                
        except Exception as e:
            results["anomalies"].append(f"Error extracting EXIF: {str(e)}")

        # 2. Compression/Quality Analysis
        try:
            # Estimate JPEG quality if applicable
            if image.format == 'JPEG' or (file_path and file_path.lower().endswith(('.jpg', '.jpeg'))):
                # This is a heuristic estimation
                # In a real scenario, we might parse quantization tables
                pass
            
            # Analyze noise/compression consistency (simple variance check)
            # Convert to numpy
            img_np = np.array(image.convert('RGB'))
            gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)
            
            # Calculate local variance (noise level)
            # High variance in smooth areas might indicate noise insertion or recompression artifacts
            # This is a simplified metric
            laplacian = cv2.Laplacian(gray, cv2.CV_64F)
            noise_variance = np.var(laplacian)
            
            # Heuristic: Extremely low noise might indicate synthetic generation (smoothness)
            # Extremely high noise might indicate re-saving
            if noise_variance < 100:
                results["anomalies"].append("Unusually low noise levels (possible synthetic generation)")
                results["compression_score"] -= 20
            
            # Check for quantization artifacts (blockiness)
            # We can look at 8x8 block boundaries
            if img_np.shape[0] > 16 and img_np.shape[1] > 16:
                # Simple check for grid-like artifacts
                pass

        except Exception as e:
            results["anomalies"].append(f"Error in compression analysis: {str(e)}")

        return results

    def _sanitize_exif_value(self, value: Any) -> Any:
        """Helper to sanitize EXIF values for JSON serialization"""
        if isinstance(value, bytes):
            try:
                return value.decode()
            except:
                return str(value)
        
        # Handle IFDRational (has numerator/denominator)
        if hasattr(value, 'numerator') and hasattr(value, 'denominator'):
            return float(value.numerator) / float(value.denominator) if value.denominator != 0 else 0.0
            
        # Handle tuples/lists recursively
        if isinstance(value, (list, tuple)):
            return [self._sanitize_exif_value(v) for v in value]
            
        # Handle dictionaries recursively
        if isinstance(value, dict):
            return {str(k): self._sanitize_exif_value(v) for k, v in value.items()}
            
        # Basic types pass through
        if isinstance(value, (str, int, float, bool, type(None))):
            return value
            
        # Fallback for everything else
        return str(value)

# Global instance
_metadata_analyzer = None

def get_metadata_analyzer() -> MetadataAnalyzer:
    """Get or create global MetadataAnalyzer instance"""
    global _metadata_analyzer
    if _metadata_analyzer is None:
        _metadata_analyzer = MetadataAnalyzer()
    return _metadata_analyzer
