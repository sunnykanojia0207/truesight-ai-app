/**
 * Upload Component with drag-and-drop, URL, and screenshot support
 */
import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileImage, FileVideo, AlertCircle, Link, Clipboard } from 'lucide-react';
import { useAnalysisStore } from '../store/analysisStore';
import { analysisService } from '../services/analysisService';

import { useToast } from './ui/use-toast';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];

type UploadMode = 'file' | 'url' | 'screenshot';

export default function UploadComponent() {
  const navigate = useNavigate();
  const { setCurrentAnalysisId, setIsUploading, setUploadProgress, setError } = useAnalysisStore();
  const { toast } = useToast();

  const [mode, setMode] = useState<UploadMode>('file');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const isUploading = useAnalysisStore((state) => state.isUploading);
  const uploadProgress = useAnalysisStore((state) => state.uploadProgress);

  // File Validation
  const validateFile = (file: File): string | null => {
    const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type);
    const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      return 'Please upload an image (JPEG, PNG, WebP) or video (MP4, MOV, WebM) file';
    }

    if (isImage && file.size > MAX_IMAGE_SIZE) {
      return `Image size must be less than ${MAX_IMAGE_SIZE / 1024 / 1024}MB`;
    }

    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      return `Video size must be less than ${MAX_VIDEO_SIZE / 1024 / 1024}MB`;
    }

    return null;
  };

  // File Selection Handler
  const handleFileSelect = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      setValidationError(error);
      setSelectedFile(null);
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: error,
      });
      return;
    }

    setValidationError(null);
    setSelectedFile(file);
  }, [toast]);

  // Drag and Drop Handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (mode === 'file') setIsDragging(true);
  }, [mode]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (mode === 'file') setIsDragging(false);
  }, [mode]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (mode !== 'file') return;

    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [mode, handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // Paste Handler for Screenshot Mode
  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (mode !== 'screenshot') return;

    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const file = new File([blob], "screenshot.png", { type: "image/png" });
          handleFileSelect(file);
          setValidationError(null);
          toast({
            title: "Screenshot pasted",
            description: "Ready to analyze.",
          });
        }
      }
    }
  }, [mode, handleFileSelect, toast]);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  // Upload Logic
  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const isImage = ACCEPTED_IMAGE_TYPES.includes(selectedFile.type);
      let response;

      if (isImage) {
        response = await analysisService.uploadImage(selectedFile, (progress) => {
          setUploadProgress(progress);
        });
      } else {
        response = await analysisService.uploadVideo(selectedFile, (progress) => {
          setUploadProgress(progress);
        });
      }

      const { analysisId } = response;
      setCurrentAnalysisId(analysisId);
      toast({
        title: "Upload successful",
        description: "Analysis started.",
      });
      navigate(`/results/${analysisId}`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Upload failed. Please try again.';
      setError(errorMessage);
      setValidationError(errorMessage);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: errorMessage,
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // URL Analysis Logic
  const handleUrlAnalyze = async () => {
    if (!urlInput) {
      setValidationError('Please enter a valid URL');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Basic URL validation
      try {
        new URL(urlInput);
      } catch (_) {
        throw new Error('Invalid URL format');
      }

      const response = await analysisService.analyzeUrl(urlInput);

      const { analysisId } = response;
      setCurrentAnalysisId(analysisId);
      toast({
        title: "Analysis started",
        description: "Analyzing URL content...",
      });
      navigate(`/results/${analysisId}`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message || 'URL analysis failed';
      setError(errorMessage);
      setValidationError(errorMessage);
      toast({
        variant: "destructive",
        title: "Analysis failed",
        description: errorMessage,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Tabs */}
      <div className="flex space-x-1 bg-white/50 backdrop-blur-sm p-1 rounded-xl border border-white/20">
        <button
          onClick={() => { setMode('file'); setSelectedFile(null); setValidationError(null); }}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${mode === 'file'
              ? 'bg-white text-blue-600 shadow-md scale-[1.02]'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/30'
            }`}
        >
          <Upload className="w-4 h-4" />
          <span>Upload File</span>
        </button>
        <button
          onClick={() => { setMode('url'); setSelectedFile(null); setValidationError(null); }}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${mode === 'url'
              ? 'bg-white text-blue-600 shadow-md scale-[1.02]'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/30'
            }`}
        >
          <Link className="w-4 h-4" />
          <span>URL Link</span>
        </button>
        <button
          onClick={() => { setMode('screenshot'); setSelectedFile(null); setValidationError(null); }}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${mode === 'screenshot'
              ? 'bg-white text-blue-600 shadow-md scale-[1.02]'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/30'
            }`}
        >
          <Clipboard className="w-4 h-4" />
          <span>Paste Screenshot</span>
        </button>
      </div>

      {/* File Upload Mode */}
      {mode === 'file' && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-2xl p-10 md:p-16 text-center transition-all duration-300
            ${isDragging
              ? 'border-blue-500 bg-blue-50/50 scale-[1.01] shadow-lg'
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50/30'}
            ${isUploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
          `}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept={[...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES].join(',')}
            onChange={handleFileInputChange}
            disabled={isUploading}
          />

          <label htmlFor="file-upload" className="cursor-pointer w-full h-full block">
            <div className="flex flex-col items-center space-y-6">
              <div className={`p-6 rounded-full transition-all duration-300 ${isDragging ? 'bg-blue-100 scale-110' : 'bg-gray-100 group-hover:bg-blue-50'}`}>
                <Upload className={`w-12 h-12 transition-colors ${isDragging ? 'text-blue-600' : 'text-gray-400'}`} />
              </div>

              <div>
                <p className="text-xl font-semibold text-gray-900">
                  {isDragging ? 'Drop your file here' : 'Drag and drop your file here'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  or click to browse
                </p>
              </div>

              <div className="flex items-center space-x-6 text-sm text-gray-500 bg-white/50 px-4 py-2 rounded-full border border-gray-200">
                <div className="flex items-center space-x-2">
                  <FileImage className="w-4 h-4" />
                  <span>Images</span>
                </div>
                <div className="w-px h-4 bg-gray-300" />
                <div className="flex items-center space-x-2">
                  <FileVideo className="w-4 h-4" />
                  <span>Videos</span>
                </div>
              </div>
            </div>
          </label>
        </div>
      )}

      {/* URL Mode */}
      {mode === 'url' && (
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20 p-8 shadow-sm">
          <div className="space-y-4">
            <label htmlFor="url-input" className="block text-sm font-medium text-gray-700">
              Paste Image or Video URL
            </label>
            <div className="flex space-x-3">
              <input
                type="url"
                id="url-input"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-4 border transition-all"
                disabled={isUploading}
              />
              <button
                onClick={handleUrlAnalyze}
                disabled={isUploading || !urlInput}
                className="px-8 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isUploading ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
            <p className="text-xs text-gray-500 pl-1">
              Supports direct image links, YouTube videos, and social media posts.
            </p>
          </div>
        </div>
      )}

      {/* Screenshot Mode */}
      {mode === 'screenshot' && (
        <div
          className={`
            relative border-2 border-dashed rounded-2xl p-16 text-center transition-all duration-300 border-gray-300
            ${isUploading ? 'opacity-50 pointer-events-none' : 'cursor-default hover:border-blue-400 hover:bg-gray-50/30'}
          `}
        >
          <div className="flex flex-col items-center space-y-6">
            <div className="p-6 bg-gray-100 rounded-full">
              <Clipboard className="w-12 h-12 text-gray-400" />
            </div>

            <div>
              <p className="text-xl font-semibold text-gray-900">
                Paste from Clipboard
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Press <kbd className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-mono shadow-sm mx-1">Ctrl+V</kbd> or <kbd className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-mono shadow-sm mx-1">Cmd+V</kbd> to paste an image
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress Overlay */}
      {isUploading && (mode === 'file' || mode === 'screenshot') && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl z-10">
          <div className="text-center space-y-4 w-64">
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300 animate-pulse"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm font-medium text-gray-700">
              Uploading... {uploadProgress}%
            </p>
          </div>
        </div>
      )}

      {/* Selected File Info (Shared for File and Screenshot modes) */}
      {selectedFile && !isUploading && (mode === 'file' || mode === 'screenshot') && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-50 rounded-xl">
                {ACCEPTED_IMAGE_TYPES.includes(selectedFile.type) ? (
                  <FileImage className="w-8 h-8 text-blue-500" />
                ) : (
                  <FileVideo className="w-8 h-8 text-purple-500" />
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setSelectedFile(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                className="px-8 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Analyze Content
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Validation Error */}
      {validationError && (
        <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl p-4 flex items-start space-x-3 animate-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Error</p>
            <p className="text-sm text-red-700 mt-1">{validationError}</p>
          </div>
        </div>
      )}
    </div>
  );
}
