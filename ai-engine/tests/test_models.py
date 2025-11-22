"""
Tests for AI model inference functions
"""
import pytest
from PIL import Image
import numpy as np


@pytest.mark.unit
class TestCLIPClassifier:
    """Test CLIP classifier model"""

    def test_clip_inference(self, sample_image):
        """Test CLIP model inference"""
        from models.clip_classifier import get_clip_classifier
        
        classifier = get_clip_classifier()
        result = classifier.classify(sample_image)
        
        assert 'real_probability' in result
        assert 'ai_generated_probability' in result
        assert 0 <= result['real_probability'] <= 100
        assert 0 <= result['ai_generated_probability'] <= 100
        # Probabilities should sum to approximately 100
        assert abs(result['real_probability'] + result['ai_generated_probability'] - 100) < 1

    def test_clip_batch_inference(self):
        """Test CLIP batch inference"""
        from models.clip_classifier import get_clip_classifier
        
        classifier = get_clip_classifier()
        images = [Image.new('RGB', (224, 224)) for _ in range(3)]
        
        results = [classifier.classify(img) for img in images]
        
        assert len(results) == 3
        for result in results:
            assert 'real_probability' in result
            assert 'ai_generated_probability' in result


@pytest.mark.unit
class TestDeepfakeDetector:
    """Test deepfake detection model"""

    def test_deepfake_detection(self, sample_image):
        """Test deepfake detection"""
        from models.deepfake_detector import get_deepfake_detector
        
        detector = get_deepfake_detector()
        result = detector.detect(sample_image)
        
        assert 'faces_detected' in result
        assert 'deepfake_faces' in result
        assert isinstance(result['faces_detected'], int)
        assert isinstance(result['deepfake_faces'], list)

    def test_deepfake_no_faces(self):
        """Test deepfake detection with no faces"""
        from models.deepfake_detector import get_deepfake_detector
        
        # Create image without faces (random noise)
        img = Image.new('RGB', (224, 224))
        
        detector = get_deepfake_detector()
        result = detector.detect(img)
        
        assert result['faces_detected'] >= 0
        assert isinstance(result['deepfake_faces'], list)

    def test_deepfake_face_structure(self, sample_image):
        """Test structure of detected face data"""
        from models.deepfake_detector import get_deepfake_detector
        
        detector = get_deepfake_detector()
        result = detector.detect(sample_image)
        
        for face in result['deepfake_faces']:
            assert 'bounding_box' in face
            assert 'confidence' in face
            assert len(face['bounding_box']) == 4
            assert 0 <= face['confidence'] <= 1


@pytest.mark.unit
class TestGANDetector:
    """Test GAN fingerprint detection"""

    def test_gan_detection(self, sample_image):
        """Test GAN fingerprint detection"""
        from models.gan_detector import get_gan_detector
        
        detector = get_gan_detector()
        result = detector.detect(sample_image)
        
        assert 'is_generated' in result
        assert 'confidence' in result
        assert isinstance(result['is_generated'], bool)
        assert 0 <= result['confidence'] <= 1

    def test_gan_detection_real_image(self):
        """Test GAN detection on real image"""
        from models.gan_detector import get_gan_detector
        
        # Create simple real image
        img = Image.new('RGB', (224, 224), color='white')
        
        detector = get_gan_detector()
        result = detector.detect(img)
        
        # Should have low confidence for simple image
        assert 'is_generated' in result
        assert 'confidence' in result


@pytest.mark.unit
class TestForgeryDetector:
    """Test image forgery detection"""

    def test_forgery_detection(self, sample_image):
        """Test forgery detection"""
        from models.forgery_detector import get_forgery_detector
        
        detector = get_forgery_detector()
        result = detector.detect(sample_image)
        
        assert 'is_manipulated' in result
        assert 'confidence' in result
        assert 'heatmap' in result
        assert 'regions' in result
        assert isinstance(result['is_manipulated'], bool)
        assert 0 <= result['confidence'] <= 1

    def test_forgery_heatmap_format(self, sample_image):
        """Test forgery heatmap format"""
        from models.forgery_detector import get_forgery_detector
        
        detector = get_forgery_detector()
        result = detector.detect(sample_image)
        
        if result['heatmap']:
            # Should be base64 encoded image
            assert isinstance(result['heatmap'], str)
            assert result['heatmap'].startswith('data:image/')

    def test_forgery_regions_structure(self, sample_image):
        """Test structure of detected manipulation regions"""
        from models.forgery_detector import get_forgery_detector
        
        detector = get_forgery_detector()
        result = detector.detect(sample_image)
        
        assert isinstance(result['regions'], list)
        for region in result['regions']:
            # Each region should be [x, y, w, h]
            assert len(region) == 4
            assert all(isinstance(coord, (int, float)) for coord in region)


@pytest.mark.unit
class TestSourcePredictor:
    """Test AI source prediction"""

    def test_source_prediction(self, sample_image):
        """Test source model prediction"""
        from models.source_predictor import get_source_predictor
        
        predictor = get_source_predictor()
        result = predictor.predict(sample_image)
        
        assert 'source' in result
        assert 'confidence' in result
        assert isinstance(result['source'], str)
        assert 0 <= result['confidence'] <= 1

    def test_source_prediction_known_sources(self, sample_image):
        """Test that predicted source is from known list"""
        from models.source_predictor import get_source_predictor
        
        known_sources = ['Midjourney', 'DALL-E', 'Stable Diffusion', 'Sora', 'Runway', 'Unknown']
        
        predictor = get_source_predictor()
        result = predictor.predict(sample_image)
        
        assert result['source'] in known_sources

    def test_source_prediction_probabilities(self, sample_image):
        """Test source prediction includes probabilities"""
        from models.source_predictor import get_source_predictor
        
        predictor = get_source_predictor()
        result = predictor.predict(sample_image)
        
        if 'probabilities' in result:
            assert isinstance(result['probabilities'], dict)
            # Probabilities should sum to approximately 1.0
            total = sum(result['probabilities'].values())
            assert abs(total - 1.0) < 0.01
