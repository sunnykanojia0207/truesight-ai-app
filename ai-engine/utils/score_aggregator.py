from typing import Dict, Any, List
import numpy as np

class ScoreAggregator:
    """
    Aggregates results from multiple detection models to calculate a final Truth Score.
    """
    
    def __init__(self):
        # Base weights for each component
        self.weights = {
            "clip_classifier": 0.30,
            "deepfake_detector": 0.25,
            "gan_detector": 0.20,
            "forgery_detector": 0.15,
            "metadata_analysis": 0.10
        }

    def calculate_truth_score(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate the final Truth Score based on individual model results.
        
        Args:
            results: Dictionary containing results from each model:
                - clip: {real_probability: float, ...}
                - deepfake: {is_deepfake: bool, max_confidence: float, ...}
                - gan: {is_generated: bool, confidence: float, ...}
                - forgery: {is_manipulated: bool, confidence: float, ...}
                - metadata: {compression_score: float, anomalies: List, ...}
                
        Returns:
            Dictionary containing:
            - truth_score: float (0-100, where 100 is definitely real)
            - ai_probability: float (0-100)
            - component_scores: Dict[str, float]
        """
        
        # 1. Normalize individual scores to "Fake Probability" (0-1)
        fake_probs = {}
        
        # CLIP Classifier
        if "clip" in results:
            fake_probs["clip_classifier"] = results["clip"].get("ai_generated_probability", 0) / 100.0
        else:
            fake_probs["clip_classifier"] = 0.0
            
        # Deepfake Detector
        if "deepfake" in results:
            df_res = results["deepfake"]
            # If faces detected, use the confidence of the most fake face
            if df_res.get("faces_detected", 0) > 0:
                # Assuming deepfake detector returns confidence of being fake
                # We need to check the structure of deepfake result
                # Let's assume it has a 'deepfake_score' or we iterate over faces
                faces = df_res.get("deepfake_faces", [])
                if faces:
                    max_conf = max([f.get("confidence", 0) for f in faces])
                    fake_probs["deepfake_detector"] = max_conf
                else:
                    fake_probs["deepfake_detector"] = 0.0
            else:
                # If no faces, this model shouldn't contribute heavily or should be neutral
                # For now, we'll set it to 0 but we might want to dynamically adjust weights
                fake_probs["deepfake_detector"] = 0.0
                # Adjust weights later
        else:
            fake_probs["deepfake_detector"] = 0.0

        # GAN Detector
        if "gan" in results:
            gan_res = results["gan"]
            fake_probs["gan_detector"] = gan_res.get("confidence", 0) if gan_res.get("is_generated") else 0.0
        else:
            fake_probs["gan_detector"] = 0.0
            
        # Forgery Detector
        if "forgery" in results:
            forg_res = results["forgery"]
            fake_probs["forgery_detector"] = forg_res.get("confidence", 0) if forg_res.get("is_manipulated") else 0.0
        else:
            fake_probs["forgery_detector"] = 0.0
            
        # Metadata Analysis
        if "metadata" in results:
            meta_res = results["metadata"]
            # Compression score is 0-100 (100 is good/real)
            # So fake prob is (100 - score) / 100
            comp_score = meta_res.get("compression_score", 100)
            fake_probs["metadata_analysis"] = (100 - comp_score) / 100.0
            
            # Boost fake prob if anomalies exist
            if meta_res.get("anomalies"):
                fake_probs["metadata_analysis"] = min(1.0, fake_probs["metadata_analysis"] + 0.2)
        else:
            fake_probs["metadata_analysis"] = 0.0

        # 2. Dynamic Weight Adjustment
        current_weights = self.weights.copy()
        
        # If no faces detected, remove deepfake detector from weights and redistribute
        if "deepfake" in results and results["deepfake"].get("faces_detected", 0) == 0:
            del current_weights["deepfake_detector"]
            
        # Normalize weights to sum to 1
        total_weight = sum(current_weights.values())
        if total_weight > 0:
            current_weights = {k: v / total_weight for k, v in current_weights.items()}
        
        # 3. Calculate Weighted Average Fake Probability
        final_fake_prob = 0.0
        for component, weight in current_weights.items():
            prob = fake_probs.get(component, 0.0)
            final_fake_prob += prob * weight
            
        # 4. Convert to Truth Score (Real Probability)
        # Truth Score = 100 - (Fake Probability * 100)
        truth_score = max(0.0, min(100.0, 100.0 - (final_fake_prob * 100.0)))
        
        return {
            "truth_score": round(truth_score, 1),
            "ai_generated_probability": round(final_fake_prob * 100, 1),
            "real_probability": round(truth_score, 1),
            "component_scores": {k: round(v * 100, 1) for k, v in fake_probs.items()},
            "active_weights": current_weights
        }
