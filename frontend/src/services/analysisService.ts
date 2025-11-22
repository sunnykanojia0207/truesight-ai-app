import apiClient, { AnalysisResponse, HistoryResponse } from './api';
import { API_ENDPOINTS } from '../config/api';

export const analysisService = {
    /**
     * Upload an image for analysis
     */
    uploadImage: async (
        file: File,
        onProgress?: (progress: number) => void
    ): Promise<AnalysisResponse> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post<AnalysisResponse>(
            API_ENDPOINTS.uploadImage,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total && onProgress) {
                        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        onProgress(progress);
                    }
                },
            }
        );

        return response.data;
    },

    /**
     * Upload a video for analysis
     */
    uploadVideo: async (
        file: File,
        onProgress?: (progress: number) => void
    ): Promise<AnalysisResponse> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post<AnalysisResponse>(
            API_ENDPOINTS.uploadVideo,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total && onProgress) {
                        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        onProgress(progress);
                    }
                },
            }
        );

        return response.data;
    },

    /**
     * Analyze content from a URL
     */
    analyzeUrl: async (url: string): Promise<AnalysisResponse> => {
        const response = await apiClient.post<AnalysisResponse>(
            API_ENDPOINTS.analyzeUrl,
            {
                url,
                type: 'auto'
            }
        );

        return response.data;
    },

    /**
     * Get analysis results
     */
    getAnalysisResult: async (analysisId: string) => {
        const response = await apiClient.get(API_ENDPOINTS.getAnalysis(analysisId));
        return response.data;
    },

    /**
     * Get analysis history
     */
    getHistory: async (page = 1, limit = 12): Promise<HistoryResponse> => {
        const response = await apiClient.get(API_ENDPOINTS.getHistory, {
            params: { page, limit }
        });

        // Map backend response to frontend format
        const backendData = response.data;
        return {
            items: backendData.analyses.map((item: any) => ({
                id: item.id,
                thumbnailUrl: item.thumbnail,
                contentType: item.contentType,
                status: item.status,
                truthScore: item.truthScore,
                createdAt: item.createdAt,
            })),
            total: backendData.total,
            page: backendData.page,
            limit: limit,
            pages: backendData.totalPages,
        };
    }
};
