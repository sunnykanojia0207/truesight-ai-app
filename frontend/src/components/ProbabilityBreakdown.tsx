import React from 'react';
import { CheckCircle, AlertTriangle, HelpCircle } from 'lucide-react';

interface ProbabilityBreakdownProps {
    realProbability: number;
    aiGeneratedProbability: number;
    predictedSource?: string;
}

export default function ProbabilityBreakdown({
    realProbability,
    aiGeneratedProbability,
    predictedSource = 'Unknown'
}: ProbabilityBreakdownProps) {

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Probability Breakdown</h3>

            <div className="space-y-6">
                {/* Real Probability */}
                <div>
                    <div className="flex justify-between items-end mb-2">
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="font-medium text-gray-700">Real Content</span>
                        </div>
                        <span className="text-2xl font-bold text-gray-900">{realProbability}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                            className="bg-green-500 h-full rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${realProbability}%` }}
                        ></div>
                    </div>
                </div>

                {/* AI Probability */}
                <div>
                    <div className="flex justify-between items-end mb-2">
                        <div className="flex items-center space-x-2">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            <span className="font-medium text-gray-700">AI-Generated</span>
                        </div>
                        <span className="text-2xl font-bold text-gray-900">{aiGeneratedProbability}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                            className="bg-red-500 h-full rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${aiGeneratedProbability}%` }}
                        ></div>
                    </div>
                </div>

                {/* Predicted Source */}
                <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-gray-600">
                            <HelpCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Predicted Source</span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${predictedSource === 'Unknown'
                                ? 'bg-gray-100 text-gray-600'
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                            {predictedSource}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
