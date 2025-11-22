/**
 * Zustand store for analysis state management
 */
import { create } from 'zustand';
import { AnalysisResult } from '../services/api';

interface AnalysisStore {
  currentAnalysisId: string | null;
  currentResult: AnalysisResult | null;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  
  setCurrentAnalysisId: (id: string | null) => void;
  setCurrentResult: (result: AnalysisResult | null) => void;
  setIsUploading: (uploading: boolean) => void;
  setUploadProgress: (progress: number) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useAnalysisStore = create<AnalysisStore>((set) => ({
  currentAnalysisId: null,
  currentResult: null,
  isUploading: false,
  uploadProgress: 0,
  error: null,
  
  setCurrentAnalysisId: (id) => set({ currentAnalysisId: id }),
  setCurrentResult: (result) => set({ currentResult: result }),
  setIsUploading: (uploading) => set({ isUploading: uploading }),
  setUploadProgress: (progress) => set({ uploadProgress: progress }),
  setError: (error) => set({ error }),
  reset: () => set({
    currentAnalysisId: null,
    currentResult: null,
    isUploading: false,
    uploadProgress: 0,
    error: null,
  }),
}));
