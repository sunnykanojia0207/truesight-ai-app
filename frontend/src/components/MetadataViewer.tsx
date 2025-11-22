import React, { useState } from 'react';
import { FileText, Copy, Check, AlertTriangle, Info } from 'lucide-react';

interface MetadataViewerProps {
    metadata: {
        exif?: Record<string, any>;
        compressionScore: number;
        ganFingerprint: {
            detected: boolean;
            confidence: number;
        };
    };
}

export default function MetadataViewer({ metadata }: MetadataViewerProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const text = JSON.stringify(metadata, null, 2);
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const exifKeys = metadata.exif ? Object.keys(metadata.exif) : [];
    const hasExif = exifKeys.length > 0;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Metadata Analysis</h3>
                <button
                    onClick={handleCopy}
                    className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                    {copied ? (
                        <>
                            <Check className="w-4 h-4 mr-1.5" />
                            Copied
                        </>
                    ) : (
                        <>
                            <Copy className="w-4 h-4 mr-1.5" />
                            Copy Data
                        </>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Analysis Scores */}
                <div className="space-y-6">
                    {/* Compression Analysis */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <FileText className="w-4 h-4 text-blue-500" />
                                <span className="font-medium text-gray-900">Compression Analysis</span>
                            </div>
                            <span className={`text-sm font-bold ${metadata.compressionScore > 70 ? 'text-green-600' :
                                    metadata.compressionScore > 40 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                {metadata.compressionScore}/100
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div
                                className={`h-2 rounded-full ${metadata.compressionScore > 70 ? 'bg-green-500' :
                                        metadata.compressionScore > 40 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                style={{ width: `${metadata.compressionScore}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-500">
                            Higher score indicates natural compression patterns typical of original camera files.
                        </p>
                    </div>

                    {/* GAN Fingerprint */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <Info className="w-4 h-4 text-purple-500" />
                                <span className="font-medium text-gray-900">GAN Fingerprint</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${metadata.ganFingerprint.detected
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-green-100 text-green-700'
                                }`}>
                                {metadata.ganFingerprint.detected ? 'Detected' : 'Not Detected'}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500">
                            {metadata.ganFingerprint.detected
                                ? `Found traces of GAN generation with ${(metadata.ganFingerprint.confidence * 100).toFixed(1)}% confidence.`
                                : 'No specific GAN generation artifacts were detected in the frequency domain.'}
                        </p>
                    </div>
                </div>

                {/* Right Column: EXIF Data */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                        <span className="font-medium text-sm text-gray-700">EXIF Metadata</span>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto p-0">
                        {hasExif ? (
                            <table className="min-w-full divide-y divide-gray-200">
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {exifKeys.map((key) => (
                                        <tr key={key}>
                                            <td className="px-4 py-2 whitespace-nowrap text-xs font-medium text-gray-500 bg-gray-50 w-1/3">
                                                {key}
                                            </td>
                                            <td className="px-4 py-2 text-xs text-gray-900 break-all">
                                                {String(metadata.exif![key])}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-32 text-gray-500 p-4 text-center">
                                <AlertTriangle className="w-8 h-8 mb-2 text-yellow-500" />
                                <p className="text-sm font-medium">No EXIF data found</p>
                                <p className="text-xs mt-1">
                                    Metadata may have been stripped by social media platforms or editing software.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
