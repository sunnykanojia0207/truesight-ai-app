import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { analysisService } from '../services/analysisService';
import { AnalysisResult } from '../services/api';
import TruthScoreGauge from './TruthScoreGauge';
import ProbabilityBreakdown from './ProbabilityBreakdown';
import MetadataViewer from './MetadataViewer';
import ForgeryAnalysis from './ForgeryAnalysis';
import VideoTimeline from './VideoTimeline';
import AnalysisLoader from './AnalysisLoader';

export default function ResultsDashboard() {
    const { analysisId } = useParams<{ analysisId: string }>();
    const navigate = useNavigate();

    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    // Video specific state
    const [currentTime, setCurrentTime] = useState(0);
    const [videoDuration, setVideoDuration] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (!analysisId) return;

        let pollInterval: NodeJS.Timeout;

        const fetchResult = async () => {
            try {
                const data = await analysisService.getAnalysisResult(analysisId);
                setResult(data);

                if (data.status === 'completed' || data.status === 'failed') {
                    setLoading(false);
                    if (data.status === 'failed') {
                        setError(data.error || 'Analysis failed');
                    }
                    return true; // Stop polling
                }
                return false; // Continue polling
            } catch (err: any) {
                console.error("Error fetching analysis:", err);
                if (err.response && err.response.status === 404) {
                    setError('Analysis not found');
                    setLoading(false);
                    return true;
                }
                return false;
            }
        };

        fetchResult();

        pollInterval = setInterval(async () => {
            const shouldStop = await fetchResult();
            if (shouldStop) {
                clearInterval(pollInterval);
            }
        }, 2000);

        return () => clearInterval(pollInterval);
    }, [analysisId]);

    const handleVideoTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleVideoLoadedMetadata = () => {
        if (videoRef.current) {
            setVideoDuration(videoRef.current.duration);
        }
    };

    const handleTimelineSeek = (time: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    if (loading) {
        return <AnalysisLoader />;
    }

    if (error || !result) {
        return (
            <div className="max-w-2xl mx-auto mt-8 p-6 bg-red-50 border border-red-200 rounded-lg text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-red-900 mb-2">Analysis Failed</h2>
                <p className="text-red-700 mb-6">{error || 'An unknown error occurred'}</p>
                <button
                    onClick={() => navigate('/')}
                    className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    const analysisData = result.result;
    const isVideo = result.contentType === 'video';

    return (
        <div className="space-y-6 md:space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    <span className="text-sm sm:text-base">Back to Upload</span>
                </button>
                <div className="text-xs sm:text-sm text-gray-500 break-all">
                    ID: {analysisId}
                </div>
            </div>

            {/* Main Score Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
                    <div className="flex-1 text-center md:text-left w-full">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Analysis Results</h1>
                        <p className="text-sm sm:text-base text-gray-500 mb-4">
                            Our AI models have analyzed this content for signs of manipulation and generation.
                        </p>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-4">
                            <div className="px-3 sm:px-4 py-2 bg-gray-100 rounded-lg">
                                <span className="block text-xs text-gray-500 uppercase">Type</span>
                                <span className="font-medium text-sm sm:text-base capitalize">{result.contentType || 'Image'}</span>
                            </div>
                            <div className="px-3 sm:px-4 py-2 bg-gray-100 rounded-lg">
                                <span className="block text-xs text-gray-500 uppercase">Source</span>
                                <span className="font-medium text-sm sm:text-base">{analysisData?.predictedSource || 'Unknown'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-shrink-0">
                        <TruthScoreGauge score={analysisData?.truthScore || 0} size={window.innerWidth < 640 ? 200 : 240} />
                    </div>
                </div>
            </div>

            {/* Video Player Section (if video) */}
            {isVideo && result.mediaUrl && (
                <div className="bg-black rounded-xl overflow-hidden shadow-lg">
                    <video
                        ref={videoRef}
                        src={result.mediaUrl}
                        className="w-full max-h-[300px] sm:max-h-[400px] md:max-h-[500px] mx-auto"
                        controls
                        onTimeUpdate={handleVideoTimeUpdate}
                        onLoadedMetadata={handleVideoLoadedMetadata}
                    />
                </div>
            )}

            {/* Grid Layout for Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                {/* Probability Breakdown */}
                <ProbabilityBreakdown
                    realProbability={analysisData?.realProbability || 0}
                    aiGeneratedProbability={analysisData?.aiGeneratedProbability || 0}
                    predictedSource={analysisData?.predictedSource}
                />

                {/* Deepfake Detection */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 h-full">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Deepfake Detection</h3>
                    {analysisData?.deepfakeDetection?.facesDetected ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                                <span className="text-sm sm:text-base text-gray-700">Faces Detected</span>
                                <span className="font-bold text-gray-900">{analysisData.deepfakeDetection.facesDetected}</span>
                            </div>
                            {analysisData.deepfakeDetection.deepfakeFaces.length > 0 ? (
                                <div className="p-3 sm:p-4 bg-red-50 border border-red-100 rounded-lg">
                                    <p className="text-sm sm:text-base text-red-700 font-medium flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                                        Deepfake faces detected!
                                    </p>
                                </div>
                            ) : (
                                <div className="p-3 sm:p-4 bg-green-50 border border-green-100 rounded-lg">
                                    <p className="text-sm sm:text-base text-green-700 font-medium">No deepfake faces detected.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm sm:text-base text-gray-500 italic">No faces detected in the content.</p>
                    )}
                </div>
            </div>

            {/* Video Timeline (if video) */}
            {isVideo && analysisData?.timeline && (
                <VideoTimeline
                    timeline={analysisData.timeline}
                    duration={videoDuration}
                    currentTime={currentTime}
                    onSeek={handleTimelineSeek}
                />
            )}

            {/* Forgery Analysis Heatmap (if image) */}
            {!isVideo && analysisData?.manipulationHeatmap && (
                <ForgeryAnalysis
                    imageUrl={result.mediaUrl}
                    heatmapBase64={analysisData.manipulationHeatmap}
                />
            )}

            {/* Metadata Section */}
            {analysisData?.metadata && (
                <MetadataViewer metadata={analysisData.metadata} />
            )}
        </div>
    );
}
