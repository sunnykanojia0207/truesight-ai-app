/**
 * Home page with upload functionality
 */
import UploadComponent from '../components/UploadComponent';

export default function HomePage() {
  return (
    <div className="space-y-12 py-8">
      <div className="text-center space-y-4">
        <h2 className="text-5xl font-extrabold tracking-tight">
          <span className="text-gradient">Verify Your Content</span>
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Upload an image or video to detect AI-generated content, deepfakes, and manipulation using our advanced multi-model analysis engine.
        </p>
      </div>

      <div className="glass rounded-2xl p-8 md:p-12 shadow-2xl border border-white/50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        <UploadComponent />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass rounded-xl p-8 hover:scale-105 transition-transform duration-300 border border-white/40">
          <div className="text-4xl mb-4 bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center text-blue-600">🤖</div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">AI Detection</h3>
          <p className="text-gray-600 leading-relaxed">
            Advanced CLIP-based classification to identify AI-generated images from models like Midjourney and DALL-E.
          </p>
        </div>

        <div className="glass rounded-xl p-8 hover:scale-105 transition-transform duration-300 border border-white/40">
          <div className="text-4xl mb-4 bg-purple-100 w-16 h-16 rounded-2xl flex items-center justify-center text-purple-600">👤</div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Deepfake Detection</h3>
          <p className="text-gray-600 leading-relaxed">
            State-of-the-art facial analysis to detect manipulated faces, identity swapping, and deepfake videos.
          </p>
        </div>

        <div className="glass rounded-xl p-8 hover:scale-105 transition-transform duration-300 border border-white/40">
          <div className="text-4xl mb-4 bg-pink-100 w-16 h-16 rounded-2xl flex items-center justify-center text-pink-600">🔍</div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">GAN Fingerprints</h3>
          <p className="text-gray-600 leading-relaxed">
            Frequency domain analysis to detect subtle artifacts and fingerprints left by GAN generation processes.
          </p>
        </div>
      </div>
    </div>
  );
}
