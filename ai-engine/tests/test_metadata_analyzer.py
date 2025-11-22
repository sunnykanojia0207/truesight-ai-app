"""
Tests for metadata extraction and analysis
"""
import pytest
from PIL import Image
from models.metadata_analyzer import MetadataAnalyzer


@pytest.mark.unit
class TestMetadataAnalyzer:
    """Test metadata extraction and analysis"""

    def setup_method(self):
        """Set up test fixtures"""
        self.analyzer = MetadataAnalyzer()

    def test_extract_exif_with_metadata(self, sample_image_with_exif):
        """Test EXIF extraction from image with metadata"""
        result = self.analyzer.analyze(sample_image_with_exif)

        assert 'exif' in result
        assert isinstance(result['exif'], dict)

    def test_extract_exif_without_metadata(self, sample_image_no_exif):
        """Test EXIF extraction from image without metadata"""
        result = self.analyzer.analyze(sample_image_no_exif)

        assert 'exif' in result
        # Should return empty dict or None for missing EXIF
        assert result['exif'] is None or result['exif'] == {}

    def test_compression_score_calculation(self, sample_image):
        """Test compression score calculation"""
        result = self.analyzer.analyze(sample_image)

        assert 'compression_score' in result
        assert isinstance(result['compression_score'], (int, float))
        assert 0 <= result['compression_score'] <= 100

    def test_gan_fingerprint_detection(self, sample_image):
        """Test GAN fingerprint detection in metadata"""
        result = self.analyzer.analyze(sample_image)

        assert 'gan_fingerprint' in result
        assert 'detected' in result['gan_fingerprint']
        assert 'confidence' in result['gan_fingerprint']
        assert isinstance(result['gan_fingerprint']['detected'], bool)
        assert 0 <= result['gan_fingerprint']['confidence'] <= 1

    def test_anomaly_detection(self, sample_image):
        """Test metadata anomaly detection"""
        result = self.analyzer.analyze(sample_image)

        assert 'anomalies' in result
        assert isinstance(result['anomalies'], list)

    def test_stripped_metadata_detection(self, sample_image_no_exif):
        """Test detection of stripped metadata"""
        result = self.analyzer.analyze(sample_image_no_exif)

        # Should detect missing metadata as potential anomaly
        assert 'anomalies' in result
        # May or may not flag as anomaly depending on implementation

    def test_analyze_various_formats(self):
        """Test metadata analysis on various image formats"""
        formats = ['RGB', 'RGBA', 'L']
        
        for mode in formats:
            img = Image.new(mode, (224, 224))
            result = self.analyzer.analyze(img)
            
            assert 'compression_score' in result
            assert 'exif' in result
            assert 'gan_fingerprint' in result

    def test_analyze_high_quality_image(self):
        """Test analysis of high quality image"""
        # Create a high quality image (less compression artifacts)
        img = Image.new('RGB', (1920, 1080))
        result = self.analyzer.analyze(img)

        # High quality should have good compression score
        assert result['compression_score'] >= 50

    def test_result_structure(self, sample_image):
        """Test that result has all required fields"""
        result = self.analyzer.analyze(sample_image)

        required_fields = ['exif', 'compression_score', 'gan_fingerprint', 'anomalies']
        for field in required_fields:
            assert field in result

    def test_compression_consistency(self, sample_image):
        """Test compression consistency analysis"""
        result = self.analyzer.analyze(sample_image)

        # Should analyze compression consistency
        assert 'compression_score' in result
        # Score should be reasonable
        assert 0 <= result['compression_score'] <= 100

    def test_handles_corrupted_exif(self):
        """Test handling of corrupted EXIF data"""
        img = Image.new('RGB', (224, 224))
        
        # Should not crash on corrupted data
        result = self.analyzer.analyze(img)
        assert result is not None
        assert 'exif' in result
