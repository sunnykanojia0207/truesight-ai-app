import mongoose, { Schema, Document } from 'mongoose';

// Interface for deepfake detection result
interface DeepfakeFace {
  boundingBox: [number, number, number, number];
  confidence: number;
}

interface DeepfakeDetection {
  facesDetected: number;
  deepfakeFaces: DeepfakeFace[];
}

// Interface for metadata
interface Metadata {
  exif?: Record<string, any>;
  compressionScore: number;
  ganFingerprint: {
    detected: boolean;
    confidence: number;
  };
}

// Interface for video timeline
interface VideoTimelineFrame {
  frameNumber: number;
  timestamp: number;
  truthScore: number;
}

// Interface for analysis result
interface AnalysisResult {
  truthScore: number;
  aiGeneratedProbability: number;
  realProbability: number;
  deepfakeDetection: DeepfakeDetection;
  manipulationHeatmap?: string;
  metadata: Metadata;
  predictedSource: string;
  processingTime: number;
  videoTimeline?: VideoTimelineFrame[];
}

// Main Analysis document interface
export interface IAnalysis extends Document {
  userId?: string;
  contentType: 'image' | 'video';
  sourceType: 'upload' | 'url' | 'screenshot';
  sourceUrl?: string;
  filePath: string;
  thumbnail: string;
  status: 'processing' | 'completed' | 'failed';
  result?: AnalysisResult;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
  expiresAt: Date;
}

// Deepfake face schema
const DeepfakeFaceSchema = new Schema({
  boundingBox: {
    type: [Number],
    required: true,
    validate: {
      validator: (v: number[]) => v.length === 4,
      message: 'Bounding box must have exactly 4 coordinates',
    },
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
  },
}, { _id: false });

// Deepfake detection schema
const DeepfakeDetectionSchema = new Schema({
  facesDetected: {
    type: Number,
    required: true,
    min: 0,
  },
  deepfakeFaces: [DeepfakeFaceSchema],
}, { _id: false });

// Metadata schema
const MetadataSchema = new Schema({
  exif: {
    type: Schema.Types.Mixed,
  },
  compressionScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  ganFingerprint: {
    detected: {
      type: Boolean,
      required: true,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
  },
}, { _id: false });

// Video timeline frame schema
const VideoTimelineFrameSchema = new Schema({
  frameNumber: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Number,
    required: true,
  },
  truthScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
}, { _id: false });

// Analysis result schema
const AnalysisResultSchema = new Schema({
  truthScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  aiGeneratedProbability: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  realProbability: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  deepfakeDetection: {
    type: DeepfakeDetectionSchema,
    required: true,
  },
  manipulationHeatmap: {
    type: String,
  },
  metadata: {
    type: MetadataSchema,
    required: true,
  },
  predictedSource: {
    type: String,
    required: true,
    enum: ['Midjourney', 'DALL-E', 'Stable Diffusion', 'Sora', 'Runway', 'Unknown'],
  },
  processingTime: {
    type: Number,
    required: true,
  },
  videoTimeline: [VideoTimelineFrameSchema],
}, { _id: false });

// Main Analysis schema
const AnalysisSchema = new Schema<IAnalysis>({
  userId: {
    type: String,
    index: true,
  },
  contentType: {
    type: String,
    required: true,
    enum: ['image', 'video'],
  },
  sourceType: {
    type: String,
    required: true,
    enum: ['upload', 'url', 'screenshot'],
  },
  sourceUrl: {
    type: String,
  },
  filePath: {
    type: String,
    required: true,
  },
  thumbnail: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing',
    index: true,
  },
  result: {
    type: AnalysisResultSchema,
  },
  error: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  completedAt: {
    type: Date,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true,
  },
}, {
  timestamps: false,
});

// Create TTL index for automatic deletion after 30 days
AnalysisSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for user queries
AnalysisSchema.index({ userId: 1, createdAt: -1 });

// Export the model
export const Analysis = mongoose.model<IAnalysis>('Analysis', AnalysisSchema);
