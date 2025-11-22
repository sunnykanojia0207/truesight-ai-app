"""
Tests for Truth Score aggregation logic
"""
import pytest
from utils.score_aggregator import ScoreAggregator


@pytest.mark.unit
class TestScoreAggregator:
    """Test Truth Score aggregation"""

    def setup_method(self):
        """Set up test fixtures"""
        self.aggregator = ScoreAggregator()

    def test_calculate_truth_score_all_real(self):
        """Test score calculation when all models indicate real"""
        results = {
            'clip': {'ai_generated_probability': 10, 'real_probability': 90},
            'deepfake': {'faces_detected': 1, 'deepfake_faces': [{'confidence': 0.05}]},
            'gan': {'is_generated': False, 'confidence': 0.1},
            'forgery': {'is_manipulated': False, 'confidence': 0.0},
            'metadata': {'compression_score': 95, 'anomalies': []},
        }

        score = self.aggregator.calculate_truth_score(results)

        assert 'truth_score' in score
        assert 'ai_generated_probability' in score
        assert 'real_probability' in score
        assert score['truth_score'] > 80  # Should be high for real content
        assert score['truth_score'] <= 100
        assert score['ai_generated_probability'] < 20

    def test_calculate_truth_score_all_fake(self):
        """Test score calculation when all models indicate fake"""
        results = {
            'clip': {'ai_generated_probability': 95, 'real_probability': 5},
            'deepfake': {'faces_detected': 1, 'deepfake_faces': [{'confidence': 0.9}]},
            'gan': {'is_generated': True, 'confidence': 0.85},
            'forgery': {'is_manipulated': True, 'confidence': 0.8},
            'metadata': {'compression_score': 20, 'anomalies': ['stripped_exif']},
        }

        score = self.aggregator.calculate_truth_score(results)

        assert score['truth_score'] < 30  # Should be low for fake content
        assert score['truth_score'] >= 0
        assert score['ai_generated_probability'] > 70

    def test_calculate_truth_score_mixed_signals(self):
        """Test score calculation with mixed signals"""
        results = {
            'clip': {'ai_generated_probability': 50, 'real_probability': 50},
            'deepfake': {'faces_detected': 1, 'deepfake_faces': [{'confidence': 0.3}]},
            'gan': {'is_generated': False, 'confidence': 0.2},
            'forgery': {'is_manipulated': True, 'confidence': 0.6},
            'metadata': {'compression_score': 60, 'anomalies': []},
        }

        score = self.aggregator.calculate_truth_score(results)

        # Should be somewhere in the middle
        assert 30 <= score['truth_score'] <= 70
        assert 30 <= score['ai_generated_probability'] <= 70

    def test_calculate_truth_score_no_faces(self):
        """Test score calculation when no faces detected"""
        results = {
            'clip': {'ai_generated_probability': 20, 'real_probability': 80},
            'deepfake': {'faces_detected': 0, 'deepfake_faces': []},
            'gan': {'is_generated': False, 'confidence': 0.1},
            'forgery': {'is_manipulated': False, 'confidence': 0.0},
            'metadata': {'compression_score': 90, 'anomalies': []},
        }

        score = self.aggregator.calculate_truth_score(results)

        # Should still calculate score, adjusting weights
        assert 'truth_score' in score
        assert 'active_weights' in score
        # Deepfake detector should not be in active weights
        assert 'deepfake_detector' not in score['active_weights']

    def test_calculate_truth_score_missing_components(self):
        """Test score calculation with missing components"""
        results = {
            'clip': {'ai_generated_probability': 30, 'real_probability': 70},
            # Missing deepfake, gan, forgery
            'metadata': {'compression_score': 85, 'anomalies': []},
        }

        score = self.aggregator.calculate_truth_score(results)

        # Should still calculate score with available data
        assert 'truth_score' in score
        assert score['truth_score'] >= 0
        assert score['truth_score'] <= 100

    def test_component_scores_included(self):
        """Test that component scores are included in result"""
        results = {
            'clip': {'ai_generated_probability': 25, 'real_probability': 75},
            'deepfake': {'faces_detected': 0, 'deepfake_faces': []},
            'gan': {'is_generated': False, 'confidence': 0.15},
            'forgery': {'is_manipulated': False, 'confidence': 0.05},
            'metadata': {'compression_score': 88, 'anomalies': []},
        }

        score = self.aggregator.calculate_truth_score(results)

        assert 'component_scores' in score
        assert isinstance(score['component_scores'], dict)
        assert 'clip_classifier' in score['component_scores']

    def test_weights_sum_to_one(self):
        """Test that active weights sum to 1.0"""
        results = {
            'clip': {'ai_generated_probability': 30, 'real_probability': 70},
            'deepfake': {'faces_detected': 1, 'deepfake_faces': [{'confidence': 0.2}]},
            'gan': {'is_generated': False, 'confidence': 0.1},
            'forgery': {'is_manipulated': False, 'confidence': 0.0},
            'metadata': {'compression_score': 85, 'anomalies': []},
        }

        score = self.aggregator.calculate_truth_score(results)

        weights_sum = sum(score['active_weights'].values())
        assert abs(weights_sum - 1.0) < 0.001  # Allow small floating point error

    def test_truth_score_bounds(self):
        """Test that truth score is always within 0-100"""
        # Test extreme cases
        test_cases = [
            {
                'clip': {'ai_generated_probability': 0, 'real_probability': 100},
                'deepfake': {'faces_detected': 0, 'deepfake_faces': []},
                'gan': {'is_generated': False, 'confidence': 0.0},
                'forgery': {'is_manipulated': False, 'confidence': 0.0},
                'metadata': {'compression_score': 100, 'anomalies': []},
            },
            {
                'clip': {'ai_generated_probability': 100, 'real_probability': 0},
                'deepfake': {'faces_detected': 1, 'deepfake_faces': [{'confidence': 1.0}]},
                'gan': {'is_generated': True, 'confidence': 1.0},
                'forgery': {'is_manipulated': True, 'confidence': 1.0},
                'metadata': {'compression_score': 0, 'anomalies': ['all']},
            },
        ]

        for results in test_cases:
            score = self.aggregator.calculate_truth_score(results)
            assert 0 <= score['truth_score'] <= 100
            assert 0 <= score['ai_generated_probability'] <= 100

    def test_metadata_anomalies_increase_fake_probability(self):
        """Test that metadata anomalies increase fake probability"""
        results_no_anomalies = {
            'clip': {'ai_generated_probability': 20, 'real_probability': 80},
            'deepfake': {'faces_detected': 0, 'deepfake_faces': []},
            'gan': {'is_generated': False, 'confidence': 0.1},
            'forgery': {'is_manipulated': False, 'confidence': 0.0},
            'metadata': {'compression_score': 85, 'anomalies': []},
        }

        results_with_anomalies = {
            'clip': {'ai_generated_probability': 20, 'real_probability': 80},
            'deepfake': {'faces_detected': 0, 'deepfake_faces': []},
            'gan': {'is_generated': False, 'confidence': 0.1},
            'forgery': {'is_manipulated': False, 'confidence': 0.0},
            'metadata': {'compression_score': 85, 'anomalies': ['stripped_exif', 'inconsistent_compression']},
        }

        score_no_anomalies = self.aggregator.calculate_truth_score(results_no_anomalies)
        score_with_anomalies = self.aggregator.calculate_truth_score(results_with_anomalies)

        # Anomalies should decrease truth score
        assert score_with_anomalies['truth_score'] < score_no_anomalies['truth_score']
