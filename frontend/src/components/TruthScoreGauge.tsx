import React from 'react';

interface TruthScoreGaugeProps {
    score: number;
    size?: number;
}

export default function TruthScoreGauge({ score, size = 200 }: TruthScoreGaugeProps) {
    // Normalize score to 0-100
    const normalizedScore = Math.max(0, Math.min(100, score));

    // Calculate color based on score
    // 0-40: Red (Fake)
    // 40-70: Yellow (Uncertain)
    // 70-100: Green (Real)
    let color = '#ef4444'; // Red
    if (normalizedScore >= 70) {
        color = '#22c55e'; // Green
    } else if (normalizedScore >= 40) {
        color = '#eab308'; // Yellow
    }

    // SVG parameters
    const strokeWidth = size * 0.1;
    const radius = (size - strokeWidth) / 2;
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;

    // We want a 180 degree arc (half circle)
    // So we only show half of the circumference
    const offset = circumference * ((100 - normalizedScore) / 200) + (circumference / 2);

    // Rotation to start from left (180 degrees)
    const rotation = 180;

    return (
        <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size / 1.5 }}>
            <svg width={size} height={size / 2 + strokeWidth} className="overflow-visible">
                {/* Background Track */}
                <path
                    d={`M ${strokeWidth / 2} ${center} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${center}`}
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                />

                {/* Progress Arc */}
                <path
                    d={`M ${strokeWidth / 2} ${center} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${center}`}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - normalizedScore / 200) + (circumference / 2)}
                    className="transition-all duration-1000 ease-out"
                />
            </svg>

            {/* Score Text */}
            <div className="absolute bottom-0 flex flex-col items-center">
                <span className="text-4xl font-bold text-gray-900">{Math.round(normalizedScore)}</span>
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Truth Score</span>
            </div>
        </div>
    );
}
