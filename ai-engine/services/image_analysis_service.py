from PIL import Image
from typing import Dict, Any, Optional
import time

from models.clip_classifier import get_clip_classifier
from models.deepfake_detector import get_deepfake_detector
from models.gan_detector import get_gan_detector
from models.forgery_detector import get_forgery_detector
from models.metadata_analyzer import get_metadata_analyzer
from models.source_predictor import get_source_predictor
from utils.score_aggregator import ScoreAggregator

class ImageAnalysisService:
    """
    Service for orchestrating image analysis using multiple AI models.
    """
    
    def __init__(self):
        self.clip_classifier = get_clip_classifier()
        self.deepfake_detector = get_deepfake_detector()
        self.gan_detector = get_gan_detector()
        self.forgery_detector = get_forgery_detector()
        self.metadata_analyzer = get_metadata_analyzer()
        self.source_predictor = get_source_predictor()
        self.aggregator = ScoreAggregator()

    def analyze_image(self, image: Image.Image, filename: Optional[str] = None) -> Dict[str, Any]:
        """
        Run full analysis pipeline on an image.
        
        Args:
            image: PIL Image object
            filename: Optional filename for metadata analysis
            
        Returns:
            Dictionary containing full analysis results
        """
        start_time = time.time()
        
        # 1. Run CLIP classification
        clip_result = self.clip_classifier.classify(image)
        
        # 2. Run deepfake detection
        deepfake_result = self.deepfake_detector.detect(image)
        
        # 3. Run GAN detection
        gan_result = self.gan_detector.detect(image)
        
        # 4. Run Forgery detection
        forgery_result = self.forgery_detector.detect(image)
        
        # 5. Run Metadata analysis
        metadata_result = self.metadata_analyzer.analyze(image, file_path=filename)
        
        # 6. Run Source prediction
        source_result = self.source_predictor.predict(image)
        
        # 7. Aggregate results
        aggregation_results = self.aggregator.calculate_truth_score({
            "clip": clip_result,
            "deepfake": deepfake_result,
            "gan": gan_result,
            "forgery": forgery_result,
            "metadata": metadata_result
        })
        
        processing_time = time.time() - start_time
        
        # Construct final response structure
        return {
            "truthScore": aggregation_results["truth_score"],
            "aiGeneratedProbability": aggregation_results["ai_generated_probability"],
            "realProbability": aggregation_results["real_probability"],
            "deepfakeDetection": {
                "facesDetected": deepfake_result.get("faces_detected", 0),
                "deepfakeFaces": deepfake_result.get("deepfake_faces", [])
            },
            "manipulationHeatmap": forgery_result.get("heatmap", ""),
            "metadata": {
                "exif": metadata_result.get("exif", {}),
                "compressionScore": metadata_result.get("compression_score", 100),
                "ganFingerprint": {
                    "detected": gan_result.get("detected", False),
                    "confidence": gan_result.get("confidence", 0.0)
                },
                "anomalies": metadata_result.get("anomalies", [])
            },
            "predictedSource": source_result.get("source", "Unknown"),
            "processingTime": round(processing_time, 3),
            "componentScores": aggregation_results["component_scores"]
        }

# Global instance
_image_analysis_service = None

def get_image_analysis_service() -> ImageAnalysisService:
    """Get or create global ImageAnalysisService instance"""
    global _image_analysis_service
    if _image_analysis_service is None:
        _image_analysis_service = ImageAnalysisService()
    return _image_analysis_service
