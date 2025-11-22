import { useEffect, useState } from 'react';
import { Scan, ShieldCheck, Search, FileSearch, BrainCircuit } from 'lucide-react';

const steps = [
    { icon: FileSearch, text: "Extracting metadata...", color: "text-blue-500" },
    { icon: Scan, text: "Scanning for manipulation...", color: "text-indigo-500" },
    { icon: BrainCircuit, text: "Running AI detection models...", color: "text-purple-500" },
    { icon: Search, text: "Analyzing frequency patterns...", color: "text-pink-500" },
    { icon: ShieldCheck, text: "Finalizing truth score...", color: "text-green-500" }
];

export default function AnalysisLoader() {
    const [currentStep, setCurrentStep] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const stepDuration = 1500; // 1.5s per step
        const totalDuration = stepDuration * steps.length;

        // Progress bar animation
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 95) return 95; // Hold at 95% until done
                return prev + (100 / (totalDuration / 100));
            });
        }, 100);

        // Step transition
        const stepInterval = setInterval(() => {
            setCurrentStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
        }, stepDuration);

        return () => {
            clearInterval(progressInterval);
            clearInterval(stepInterval);
        };
    }, []);

    const CurrentIcon = steps[currentStep].icon;

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full max-w-2xl mx-auto p-6">
            {/* Main Card */}
            <div className="glass rounded-2xl p-10 w-full text-center relative overflow-hidden">

                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse-ring" />

                {/* Central Icon with Scanner Effect */}
                <div className="relative w-24 h-24 mx-auto mb-8">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/20 to-purple-500/20 rounded-xl animate-pulse" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <CurrentIcon className={`w-12 h-12 ${steps[currentStep].color} transition-all duration-500`} />
                    </div>

                    {/* Scanning Line */}
                    <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-scan rounded-full" />
                </div>

                {/* Status Text */}
                <h2 className="text-2xl font-bold text-gray-800 mb-2 transition-all duration-300">
                    {steps[currentStep].text}
                </h2>
                <p className="text-gray-500 mb-8 text-sm">
                    Please wait while TrueSight analyzes your content...
                </p>

                {/* Progress Bar */}
                <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden max-w-md mx-auto">
                    <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="mt-2 text-xs text-gray-400 font-medium">
                    {Math.round(progress)}%
                </div>

                {/* Steps Indicators */}
                <div className="flex justify-center gap-2 mt-8">
                    {steps.map((_, idx) => (
                        <div
                            key={idx}
                            className={`w-2 h-2 rounded-full transition-colors duration-300 ${idx === currentStep ? 'bg-blue-500 scale-125' :
                                    idx < currentStep ? 'bg-blue-300' : 'bg-gray-200'
                                }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
