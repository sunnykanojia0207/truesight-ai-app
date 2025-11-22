import { Skeleton } from './ui/skeleton';

export default function ResultsDashboardSkeleton() {
    return (
        <div className="space-y-8">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-6 w-48" />
            </div>

            {/* Main Score Section Skeleton */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex-1 space-y-4 w-full">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-full max-w-md" />
                        <div className="flex items-center space-x-4">
                            <Skeleton className="h-16 w-32" />
                            <Skeleton className="h-16 w-32" />
                        </div>
                    </div>
                    <Skeleton className="h-60 w-60 rounded-full" />
                </div>
            </div>

            {/* Grid Layout Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-32 w-full" />
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-32 w-full" />
                </div>
            </div>

            {/* Large Content Skeleton */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-96 w-full" />
            </div>
        </div>
    );
}
