import { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Eye, EyeOff, Layers } from 'lucide-react';

interface ForgeryAnalysisProps {
    imageUrl?: string;
    heatmapBase64?: string;
}

export default function ForgeryAnalysis({ imageUrl, heatmapBase64 }: ForgeryAnalysisProps) {
    const [opacity, setOpacity] = useState(0.5);
    const [showHeatmap, setShowHeatmap] = useState(true);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const containerRef = useRef<HTMLDivElement>(null);

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 4));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.5, 1));

    const handleMouseDown = (e: React.MouseEvent) => {
        if (scale > 1) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && scale > 1) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => setIsDragging(false);
    const handleMouseLeave = () => setIsDragging(false);

    // Reset position when scale goes back to 1
    useEffect(() => {
        if (scale === 1) {
            setPosition({ x: 0, y: 0 });
        }
    }, [scale]);

    if (!imageUrl || !heatmapBase64) {
        return null;
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Forgery Analysis</h3>

                <div className="flex items-center space-x-4">
                    {/* Opacity Control */}
                    <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-gray-500">Opacity</span>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={opacity}
                            onChange={(e) => setOpacity(parseFloat(e.target.value))}
                            className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            disabled={!showHeatmap}
                        />
                    </div>

                    {/* Toggle Heatmap */}
                    <button
                        onClick={() => setShowHeatmap(!showHeatmap)}
                        className={`p-2 rounded-lg transition-colors ${showHeatmap ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                            }`}
                        title={showHeatmap ? "Hide Heatmap" : "Show Heatmap"}
                    >
                        {showHeatmap ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Viewer Container */}
            <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden border border-gray-200">
                <div
                    ref={containerRef}
                    className="relative w-full h-full flex items-center justify-center cursor-move"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    style={{
                        cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
                    }}
                >
                    <div
                        className="relative transition-transform duration-200 ease-out"
                        style={{
                            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`
                        }}
                    >
                        {/* Original Image */}
                        <img
                            src={imageUrl}
                            alt="Original content"
                            className="max-w-full max-h-full object-contain select-none pointer-events-none"
                        />

                        {/* Heatmap Overlay */}
                        {showHeatmap && (
                            <img
                                src={`data:image/jpeg;base64,${heatmapBase64}`}
                                alt="Manipulation heatmap"
                                className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none mix-blend-multiply"
                                style={{ opacity }}
                            />
                        )}
                    </div>
                </div>

                {/* Controls Overlay */}
                <div className="absolute bottom-4 right-4 flex space-x-2">
                    <button
                        onClick={handleZoomOut}
                        disabled={scale <= 1}
                        className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg text-gray-700 hover:bg-white disabled:opacity-50 transition-all"
                    >
                        <ZoomOut className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleZoomIn}
                        disabled={scale >= 4}
                        className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg text-gray-700 hover:bg-white disabled:opacity-50 transition-all"
                    >
                        <ZoomIn className="w-5 h-5" />
                    </button>
                </div>

                {/* Legend Overlay */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg text-xs">
                    <div className="font-semibold text-gray-900 mb-2 flex items-center">
                        <Layers className="w-3 h-3 mr-1" />
                        Error Level Analysis
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                            <span className="text-gray-600">Low Error (Original)</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                            <span className="text-gray-600">High Error (Manipulated)</span>
                        </div>
                    </div>
                </div>
            </div>

            <p className="mt-4 text-sm text-gray-500">
                Use the opacity slider to compare the heatmap with the original image.
                High error regions (red/bright) often indicate digital manipulation or foreign artifacts.
            </p>
        </div>
    );
}
