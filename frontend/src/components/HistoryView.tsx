import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { analysisService } from '../services/analysisService';
import { HistoryItem } from '../services/api';
import { Calendar, FileImage, FileVideo, AlertCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function HistoryView() {
    const [page, setPage] = useState(1);
    const navigate = useNavigate();
    const limit = 12;

    const { data, isLoading, error } = useQuery({
        queryKey: ['history', page],
        queryFn: () => analysisService.getHistory(page, limit),
        placeholderData: keepPreviousData,
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-red-500">
                <AlertCircle className="w-12 h-12 mb-4" />
                <p>Failed to load history. Please try again later.</p>
            </div>
        );
    }

    if (!data?.items || data.items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <div className="bg-gray-100 p-4 rounded-full mb-4">
                    <FileImage className="w-8 h-8" />
                </div>
                <p className="text-lg font-medium">No analysis history found</p>
                <p className="text-sm">Upload content to see it here</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {data.items.map((item) => (
                    <HistoryCard key={item.id} item={item} onClick={() => navigate(`/results/${item.id}`)} />
                ))}
            </div>

            {/* Pagination */}
            {data.pages > 1 && (
                <div className="flex justify-center items-center space-x-4 mt-8">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-gray-600">
                        Page {page} of {data.pages}
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                        disabled={page === data.pages}
                        className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
    );
}

function HistoryCard({ item, onClick }: { item: HistoryItem; onClick: () => void }) {
    const date = new Date(item.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    return (
        <div
            onClick={onClick}
            className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all cursor-pointer"
        >
            <div className="aspect-video bg-gray-100 relative overflow-hidden">
                {item.thumbnailUrl ? (
                    <img
                        src={item.thumbnailUrl}
                        alt="Analysis thumbnail"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        {item.contentType === 'video' ? (
                            <FileVideo className="w-12 h-12" />
                        ) : (
                            <FileImage className="w-12 h-12" />
                        )}
                    </div>
                )}

                <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 text-xs font-bold rounded-md shadow-sm ${item.truthScore !== undefined
                        ? item.truthScore > 80 ? 'bg-green-100 text-green-700'
                            : item.truthScore > 50 ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                        }`}>
                        {item.truthScore !== undefined ? `${Math.round(item.truthScore)}%` : 'Processing'}
                    </span>
                </div>
            </div>

            <div className="p-4">
                <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                    <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {date}
                    </div>
                    <span className="capitalize">{item.contentType}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${item.status === 'completed' ? 'bg-green-50 text-green-600' :
                        item.status === 'failed' ? 'bg-red-50 text-red-600' :
                            'bg-blue-50 text-blue-600'
                        }`}>
                        {item.status}
                    </span>
                </div>
            </div>
        </div>
    );
}
