import React, { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';

interface TimelineFrame {
    timestamp: number;
    frame_index: number;
    truth_score: number;
    is_manipulated: boolean;
}

interface VideoTimelineProps {
    timeline: TimelineFrame[];
    duration?: number;
    currentTime?: number;
    onSeek?: (time: number) => void;
}

export default function VideoTimeline({ timeline, duration, currentTime = 0, onSeek }: VideoTimelineProps) {
    const sortedTimeline = useMemo(() =>
        [...timeline].sort((a, b) => a.timestamp - b.timestamp),
        [timeline]);

    const maxTime = duration || (sortedTimeline.length > 0 ? sortedTimeline[sortedTimeline.length - 1].timestamp : 0);

    if (sortedTimeline.length === 0) return null;

    // Calculate SVG path for the score line
    const getPath = (width: number, height: number) => {
        if (sortedTimeline.length < 2) return '';

        const points = sortedTimeline.map(frame => {
            const x = (frame.timestamp / maxTime) * width;
            const y = height - (frame.truth_score / 100) * height;
            return `${x},${y}`;
        });

        return `M ${points.join(' L ')}`;
    };

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!onSeek || !maxTime) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        onSeek(percentage * maxTime);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Timeline</h3>

            <div className="relative h-48 w-full select-none" onClick={handleClick}>
                {/* Chart Container */}
                <div className="absolute inset-0 top-0 bottom-8">
                    <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 100">
                        {/* Background Grid */}
                        <line x1="0" y1="25" x2="1000" y2="25" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />
                        <line x1="0" y1="50" x2="1000" y2="50" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />
                        <line x1="0" y1="75" x2="1000" y2="75" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />

                        {/* Score Line */}
                        <path
                            d={getPath(1000, 100)}
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="2"
                            vectorEffect="non-scaling-stroke"
                        />

                        {/* Suspicious Frame Markers */}
                        {sortedTimeline.map((frame, i) => (
                            frame.truth_score < 50 && (
                                <circle
                                    key={i}
                                    cx={(frame.timestamp / maxTime) * 1000}
                                    cy={100 - frame.truth_score}
                                    r="3"
                                    fill="#ef4444"
                                    className="hover:r-4 transition-all"
                                />
                            )
                        ))}
                    </svg>

                    {/* Current Time Indicator */}
                    {maxTime > 0 && (
                        <div
                            className="absolute top-0 bottom-0 w-0.5 bg-gray-900 pointer-events-none"
                            style={{ left: `${(currentTime / maxTime) * 100}%` }}
                        >
                            <div className="w-2 h-2 bg-gray-900 rounded-full -ml-[3px] -mt-1"></div>
                        </div>
                    )}
                </div>

                {/* X-Axis Labels */}
                <div className="absolute bottom-0 left-0 right-0 h-6 flex justify-between text-xs text-gray-500">
                    <span>00:00</span>
                    <span>{formatTime(maxTime / 2)}</span>
                    <span>{formatTime(maxTime)}</span>
                </div>
            </div>

            <div className="mt-4 flex items-start space-x-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p>
                    Red dots indicate frames with low Truth Scores (below 50).
                    Drops in the blue line suggest potential manipulation at those specific timestamps.
                </p>
            </div>
        </div>
    );
}

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
