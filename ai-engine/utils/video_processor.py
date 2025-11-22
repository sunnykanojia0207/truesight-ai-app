import cv2
import numpy as np
import tempfile
import os
import shutil
from PIL import Image
from typing import Dict, Any, List
import asyncio
from concurrent.futures import ThreadPoolExecutor

from services.image_analysis_service import get_image_analysis_service
from utils.logger import setup_logger

logger = setup_logger(__name__)

class VideoProcessor:
    """
    Processor for analyzing video content frame by frame.
    """
    
    def __init__(self):
        self.image_service = get_image_analysis_service()
        self.executor = ThreadPoolExecutor(max_workers=4)

    async def process_video(self, video_path: str, interval_seconds: float = 1.0) -> Dict[str, Any]:
        """
        Process video file and analyze frames at specified intervals.
        
        Args:
            video_path: Path to the video file
            interval_seconds: Interval between frames to analyze
            
        Returns:
            Dictionary containing video analysis results
        """
        frames = self._extract_frames(video_path, interval_seconds)
        
        if not frames:
            raise ValueError("No frames could be extracted from the video")
            
        logger.info(f"Extracted {len(frames)} frames from video")
        
        # Analyze frames
        # We'll run this in a thread pool to avoid blocking the event loop
        loop = asyncio.get_event_loop()
        frame_analyses = []
        
        for frame_data in frames:
            # Analyze each frame
            # For video, we might want a lighter version of analysis, but for now we use the full pipeline
            # We run this in the executor
            result = await loop.run_in_executor(
                self.executor, 
                self._analyze_frame, 
                frame_data["image"], 
                frame_data["timestamp"]
            )
            frame_analyses.append(result)
            
        # Aggregate video-level results
        return self._aggregate_video_results(frame_analyses)

    def _extract_frames(self, video_path: str, interval: float) -> List[Dict[str, Any]]:
        """Extract frames from video at given interval."""
        frames = []
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            logger.error(f"Failed to open video: {video_path}")
            return []
            
        fps = cap.get(cv2.CAP_PROP_FPS)
        if fps <= 0:
            fps = 30.0 # Fallback
            
        frame_interval = int(fps * interval)
        if frame_interval == 0:
            frame_interval = 1
            
        count = 0
        frame_number = 0
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
                
            if count % frame_interval == 0:
                # Convert BGR to RGB
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pil_image = Image.fromarray(rgb_frame)
                
                timestamp = count / fps
                frames.append({
                    "image": pil_image,
                    "timestamp": timestamp,
                    "frame_number": count
                })
                
            count += 1
            
        cap.release()
        return frames

    def _analyze_frame(self, image: Image.Image, timestamp: float) -> Dict[str, Any]:
        """Analyze a single frame."""
        # Use the image analysis service
        # We pass a dummy filename since it's a frame
        result = self.image_service.analyze_image(image, filename=f"frame_{timestamp}.jpg")
        
        # Add timestamp to result
        result["timestamp"] = timestamp
        return result

    def _aggregate_video_results(self, frame_analyses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Aggregate results from all frames into a video-level result."""
        if not frame_analyses:
            return {}
            
        # Calculate average scores
        total_truth_score = sum(f["truthScore"] for f in frame_analyses)
        avg_truth_score = total_truth_score / len(frame_analyses)
        
        # Collect timeline data
        timeline = []
        for f in frame_analyses:
            timeline.append({
                "frameNumber": f.get("frameNumber", 0), # Note: analyze_image doesn't return frameNumber, we need to inject it or use timestamp
                "timestamp": f["timestamp"],
                "truthScore": f["truthScore"]
            })
            
        # Aggregate deepfake detections
        total_faces = 0
        deepfake_faces = []
        
        for f in frame_analyses:
            df = f.get("deepfakeDetection", {})
            total_faces += df.get("facesDetected", 0)
            # We could collect all deepfake faces, but that might be too much data
            # Let's just keep the ones with high confidence
            for face in df.get("deepfakeFaces", []):
                if face.get("confidence", 0) > 0.7:
                    deepfake_faces.append(face)
        
        # Aggregate metadata (use the first frame's metadata or average compression)
        avg_compression = sum(f["metadata"]["compressionScore"] for f in frame_analyses) / len(frame_analyses)
        
        return {
            "truthScore": round(avg_truth_score, 2),
            "aiGeneratedProbability": round(100 - avg_truth_score, 2),
            "realProbability": round(avg_truth_score, 2),
            "frameAnalyses": timeline,
            "deepfakeDetection": {
                "facesDetected": total_faces,
                "deepfakeFaces": deepfake_faces[:10] # Limit to top 10 to avoid huge payload
            },
            "metadata": {
                "compressionScore": round(avg_compression, 1),
                "ganFingerprint": {
                    "detected": any(f["metadata"]["ganFingerprint"]["detected"] for f in frame_analyses),
                    "confidence": max([f["metadata"]["ganFingerprint"]["confidence"] for f in frame_analyses] or [0])
                }
            },
            "processingTime": 0 # Calculated by caller
        }

# Global instance
_video_processor = None

def get_video_processor() -> VideoProcessor:
    """Get or create global VideoProcessor instance"""
    global _video_processor
    if _video_processor is None:
        _video_processor = VideoProcessor()
    return _video_processor
