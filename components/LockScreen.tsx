
import React, { useState, useEffect, useRef } from 'react';
import Clock from './Clock';
// Add MailIcon to the imports
import { LockIcon, ShieldCheckIcon, FingerprintIcon, FaceIdIcon, MailIcon } from './Icons';
import { GoogleGenAI } from "@google/genai";

interface LockScreenProps {
  onUnlock: (password: string, data?: any) => boolean;
  isSetup?: boolean;
  isFingerprintSetup?: boolean;
  isFaceIdSetup?: boolean;
  isRecoveryUpdate?: boolean;
  onCancel?: () => void;
  fingerprintEnabled?: boolean;
  faceIdEnabled?: boolean;
  faceIdReference?: string;
  recoveryQuestion?: string;
  recoveryAnswerHash?: string;
}

const LockScreen: React.FC<LockScreenProps> = ({ 
    onUnlock, isSetup, isFingerprintSetup, isFaceIdSetup, isRecoveryUpdate, onCancel, fingerprintEnabled, faceIdEnabled, faceIdReference, recoveryQuestion, recoveryAnswerHash
}) => {
  const [view, setView] = useState<'unlock' | 'recovery' | 'setup-recovery' | 'reset'>(
    isRecoveryUpdate ? 'setup-recovery' : 'unlock'
  );
  const [input, setInput] = useState('');
  const [recoveryInput, setRecoveryInput] = useState('');
  const [setupQuestion, setSetupQuestion] = useState(isRecoveryUpdate && recoveryQuestion ? recoveryQuestion : '');
  const [setupAnswer, setSetupAnswer] = useState('');
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [analysisText, setAnalysisText] = useState('SECURE');
  const [ready, setReady] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Face ID Camera Stream
  useEffect(() => {
    if ((isFaceIdSetup || faceIdEnabled) && view === 'unlock') {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            })
            .catch(err => {
                console.error("Camera denied", err);
                setAnalysisText("CAM ERROR");
            });
            
        return () => {
            if (videoRef.current?.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
            }
        };
    }
  }, [isFaceIdSetup, faceIdEnabled, view]);

  const verifyFaceWithAI = async (currentBase64: string) => {
    setIsVerifying(true);
    setAnalysisText("AI VERIFYING...");
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        let prompt = "";
        let parts: any[] = [];

        if (isFaceIdSetup) {
          prompt = "Analyze this camera frame for enrollment. Return exactly 'VALID' if you see a clear, well-lit human face looking directly at the camera. Return 'INVALID' if the image is blurry, dark, blocked, or contains no clear face. Answer in one word only.";
          parts = [
            { text: prompt },
            { inlineData: { mimeType: 'image/jpeg', data: currentBase64 } }
          ];
        } else if (faceIdReference) {
          prompt = "Security Check: Compare these two photos. Photo 1 is the authorized owner. Photo 2 is the person currently trying to unlock the device. Return exactly 'VALID' ONLY if Photo 2 clearly shows the same individual as Photo 1. If it is a different person, a photo of a photo, a mask, or if Photo 2 is too blurry/dark to confirm, return 'INVALID'. Be extremely strict. Answer in one word only.";
          parts = [
            { text: prompt },
            { inlineData: { mimeType: 'image/jpeg', data: faceIdReference } }, // Photo 1
            { inlineData: { mimeType: 'image/jpeg', data: currentBase64 } }    // Photo 2
          ];
        } else {
          throw new Error("No reference face found.");
        }

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ parts }]
        });

        const result = response.text?.trim().toUpperCase();
        if (result === 'VALID') {
            setSuccess(true);
            onUnlock('faceid', currentBase64);
        } else {
            throw new Error("Face verification failed");
        }
    } catch (err) {
        setError(true);
        setAnalysisText("IDENTITY MISMATCH");
        setIsVerifying(false);
        setIsScanning(false);
        setScanProgress(0);
    }
  };

  const captureAndVerify = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
    const base64 = dataUrl.split(',')[1];
    
    verifyFaceWithAI(base64);
  };

  const startFaceScan = () => {
    if (isScanning || isVerifying || success) return;
    setIsScanning(true);
    setScanProgress(0);
    setError(false);
    setAnalysisText("SCANNING...");

    let progress = 0;
    const interval = setInterval(() => {
        progress += 3;
        setScanProgress(Math.min(progress, 100));
        if (progress >= 100) {
            clearInterval(interval);
            captureAndVerify();
        }
    }, 30);
  };

  const handleKeypad = (num: string) => {
    if (input.length < 8) {
      setInput(prev => prev + num);
      setError(false);
    }
  };

  const handleBackspace = () => {
    setInput(prev => prev.slice(0, -1));
    setError(false);
  };

  const handleUnlock = () => {
    if (isSetup) {
      // If setting up, move to security question setup
      setView('setup-recovery');
      return;
    }
    const isValid = onUnlock(input);
    if (isValid) setSuccess(true);
    else {
      setError(true);
      setTimeout(() => setInput(''), 300);
    }
  };

  const handleRecoverySubmit = () => {
    const hashed = btoa(recoveryInput.toLowerCase().trim());
    if (hashed === recoveryAnswerHash) {
      setSuccess(true);
      onUnlock('recovery_success');
    } else {
      setError(true);
      setTimeout(() => setError(false), 500);
    }
  };

  const handleSetupRecoverySubmit = () => {
    if (!setupQuestion.trim() || !setupAnswer.trim()) {
      setError(true);
      setTimeout(() => setError(false), 500);
      return;
    }
    // For update mode, we just pass the recovery data back
    onUnlock(isRecoveryUpdate ? 'update_recovery' : input, { question: setupQuestion, answer: setupAnswer });
  };

  const stopFingerprintScan = (e?: React.PointerEvent) => {
    if (e) try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch(err) {}
    if (scanTimerRef.current) clearInterval(scanTimerRef.current);
    if (!success) {
      setIsScanning(false);
      setScanProgress(0);
      setAnalysisText('HOLD');
    }
  };

  const startFingerprintScan = (e: React.PointerEvent) => {
    if (!ready || isScanning || success) return;
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch(err) {}
    setIsScanning(true);
    setScanProgress(0);
    setError(false);
    
    const analysisSteps = ["Sampling...", "Mapping", "Verifying"];
    const duration = isFingerprintSetup ? 1200 : 800;
    const steps = duration / 16;
    let currentStep = 0;

    scanTimerRef.current = window.setInterval(() => {
        currentStep++;
        const progress = Math.min((currentStep / steps) * 100, 100);
        setScanProgress(progress);
        
        const textIdx = Math.floor((progress / 100) * analysisSteps.length);
        setAnalysisText(analysisSteps[textIdx] || "Verifying");

        if (currentStep >= steps) {
            clearInterval(scanTimerRef.current!);
            if (onUnlock('biometric')) setSuccess(true);
            else { setError(true); setIsScanning(false); setScanProgress(0); }
        }
    }, 16);
  };

  return (
    <div className="fixed inset-0 z-[110] bg-gray-950/98 backdrop-blur-3xl flex flex-col items-center justify-start py-4 px-2 select-none touch-none overflow-hidden">
      <div className={`absolute inset-0 transition-opacity duration-700 ${isScanning || isVerifying ? 'opacity-30' : 'opacity-0'} ${error ? 'bg-red-600/20' : 'bg-blue-600/20'} blur-[80px] pointer-events-none`} />

      <canvas ref={canvasRef} className="hidden" />

      <div className={`transition-all duration-700 origin-top mb-1 ${isFingerprintSetup || isFaceIdSetup || view !== 'unlock' ? 'scale-[0.3] opacity-0 h-0' : 'scale-[0.4] sm:scale-60'}`}>
        <Clock />
      </div>

      <div className={`w-full max-w-[320px] flex flex-col items-center space-y-4 transition-all duration-500 ${error ? 'animate-wiggle' : ''} ${success ? 'scale-125 opacity-0 pointer-events-none' : 'opacity-100'}`}>
        
        {/* Guard Header */}
        <div className="flex flex-col items-center gap-2">
          <div className={`p-3 rounded-2xl transition-all duration-300 ${success ? 'bg-green-600 shadow-[0_0_20px_rgba(34,197,94,0.5)]' : error ? 'bg-red-600' : isVerifying ? 'bg-amber-600 animate-pulse' : isScanning ? 'bg-blue-600' : 'bg-white/5'} text-white`}>
            {view === 'recovery' ? <MailIcon className="w-8 h-8" /> : isSetup || isRecoveryUpdate ? <ShieldCheckIcon className="w-8 h-8" /> : (isFaceIdSetup || faceIdEnabled) ? <FaceIdIcon className="w-8 h-8" /> : <FingerprintIcon className="w-8 h-8" />}
          </div>
          <div className="text-center">
            <h2 className="text-sm font-black text-white tracking-[0.1em] uppercase">Plus Guard</h2>
            <p className={`h-4 text-xs font-bold tracking-widest uppercase transition-colors ${success ? 'text-green-400' : error ? 'text-red-400' : isVerifying ? 'text-amber-400' : isScanning ? 'text-blue-400' : 'text-gray-500'}`}>
               {view === 'recovery' ? 'Recovery' : view === 'setup-recovery' ? (isRecoveryUpdate ? 'Update Recovery' : 'Recovery Setup') : success ? 'Authorized' : analysisText}
            </p>
          </div>
        </div>

        {view === 'unlock' && (
          <>
            {/* Face ID Viewbox */}
            {(isFaceIdSetup || faceIdEnabled) && (
                <div className={`relative w-28 h-28 rounded-full border-2 transition-colors duration-500 overflow-hidden bg-black mb-1 ${success ? 'border-green-500' : error ? 'border-red-500' : isVerifying ? 'border-amber-500' : 'border-white/10'}`}>
                    <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className={`w-full h-full object-cover transition-all duration-500 ${success ? 'grayscale-0 brightness-100' : 'grayscale brightness-125'}`} 
                        onPlaying={() => {
                            if (faceIdEnabled && !isFaceIdSetup && !isScanning && !isVerifying && !success && !error) {
                                startFaceScan();
                            }
                        }}
                    />
                    
                    {(isScanning || isVerifying) && (
                        <div className="absolute inset-0 z-10 pointer-events-none">
                            <div className={`w-full h-0.5 shadow-lg absolute top-0 left-0 animate-[face_1.5s_infinite_ease-in-out] ${isVerifying ? 'bg-amber-400 shadow-[0_0_15px_amber]' : 'bg-blue-400 shadow-[0_0_15px_blue]'}`} />
                            <div className={`absolute inset-4 border-2 rounded-full animate-pulse ${isVerifying ? 'border-amber-400/30' : 'border-blue-400/30'}`} />
                        </div>
                    )}
                    
                    {isFaceIdSetup && !isScanning && !isVerifying && (
                        <button onClick={startFaceScan} className="absolute inset-0 bg-blue-600/80 text-white text-[10px] font-bold uppercase flex flex-col items-center justify-center gap-1">
                            <FaceIdIcon className="w-6 h-6" />
                            Enroll Face
                        </button>
                    )}
                    
                    {faceIdEnabled && error && !isScanning && !isVerifying && (
                        <button onClick={startFaceScan} className="absolute inset-0 bg-red-600/80 text-white text-[9px] font-bold uppercase flex items-center justify-center">Try Again</button>
                    )}
                </div>
            )}

            {/* PIN Pad */}
            {!isFingerprintSetup && !isFaceIdSetup && !isScanning && !isVerifying && (
                <div className="flex flex-col items-center gap-4 w-full mt-4">
                    <div className="flex justify-center gap-3 h-4">
                        {Array.from({ length: Math.max(input.length, 4) }).map((_, i) => (
                            <div key={i} className={`w-3 h-3 rounded-full border transition-all ${i < input.length ? 'bg-blue-500 border-blue-500 scale-110 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'border-white/10 bg-transparent'}`} />
                        ))}
                    </div>
                    <div className="grid grid-cols-3 gap-3 w-full max-w-[240px]">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <button key={num} onClick={() => handleKeypad(num.toString())} className="aspect-square rounded-2xl bg-white/5 text-white text-2xl font-bold border border-white/5 active:bg-blue-600/30 transition-colors">{num}</button>
                        ))}
                        <button onClick={handleBackspace} className="aspect-square flex items-center justify-center rounded-2xl bg-white/5 border border-white/5 text-white/40 active:text-white transition-colors"><svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2.5} d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.37-6.37a2.25 2.25 0 010-3.18l6.37-6.37A2.25 2.25 0 0110.47 2.25h10.28c1.242 0 2.25 1.008 2.25 2.25v15a2.25 2.25 0 01-2.25 2.25H10.47a2.25 2.25 0 01-1.47-.58z" /></svg></button>
                        <button onClick={() => handleKeypad('0')} className="aspect-square rounded-2xl bg-white/5 text-white text-2xl font-bold border border-white/5 active:bg-blue-600/30 transition-colors">0</button>
                        <button onClick={handleUnlock} disabled={input.length < 4} className="aspect-square flex items-center justify-center rounded-2xl bg-blue-600 text-white active:scale-95 disabled:opacity-5 transition-all shadow-lg shadow-blue-500/20"><svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg></button>
                    </div>
                    
                    {!isSetup && (
                      <div className="flex w-full justify-center items-center px-1 mt-6">
                        <button 
                          onClick={() => setView(recoveryQuestion ? 'recovery' : 'reset')}
                          className="text-xs text-blue-500 hover:text-blue-400 font-bold uppercase tracking-widest px-4 py-2"
                        >
                          Forgot Password?
                        </button>
                      </div>
                    )}
                </div>
            )}

            {/* Fingerprint Button */}
            {(isFingerprintSetup || fingerprintEnabled) && !isFaceIdSetup && !faceIdEnabled && (
                <div className="relative flex flex-col items-center scale-90">
                    <svg className="absolute inset-[-10px] w-[calc(100%+20px)] h-[calc(100%+20px)] -rotate-90 pointer-events-none">
                        <circle cx="50%" cy="50%" r="24" className={`fill-none transition-all duration-150 ${success ? 'stroke-green-500' : isScanning ? 'stroke-blue-400' : 'stroke-white/5'}`} strokeWidth="4" strokeDasharray="150.8" strokeDashoffset={150.8 - (150.8 * scanProgress) / 100} strokeLinecap="round" />
                    </svg>
                    <button
                        onPointerDown={startFingerprintScan}
                        onPointerUp={stopFingerprintScan}
                        onPointerLeave={stopFingerprintScan}
                        className={`p-4 rounded-full border-2 transition-all relative z-10 ${success ? 'bg-green-600 text-white' : isScanning ? 'bg-blue-600 text-white scale-110 shadow-lg' : 'bg-white/5 text-white/20'}`}
                    >
                        <FingerprintIcon className="w-8 h-8" />
                        {isScanning && <div className="absolute inset-0 animate-[laser_0.6s_infinite_linear] h-1 bg-blue-100/50 shadow-xl" />}
                    </button>
                </div>
            )}
          </>
        )}

        {view === 'recovery' && (
          <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4">
             <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Security Question</p>
                <p className="text-sm text-white font-medium">{recoveryQuestion}</p>
             </div>
             <input 
               type="text" 
               value={recoveryInput}
               onChange={(e) => setRecoveryInput(e.target.value)}
               placeholder="Answer..."
               className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
               autoFocus
             />
             <div className="flex gap-2">
                <button 
                  onClick={() => setView('unlock')}
                  className="flex-1 py-2 bg-white/5 text-gray-400 rounded-xl text-[10px] font-bold uppercase"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleRecoverySubmit}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase shadow-lg shadow-blue-900/20"
                >
                  Verify
                </button>
             </div>
          </div>
        )}

        {view === 'setup-recovery' && (
          <div className="w-full space-y-3 animate-in fade-in slide-in-from-bottom-4">
             <div className="text-center mb-2">
                <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">
                  {isRecoveryUpdate ? 'Modify Recovery Layer' : 'Add Recovery Layer'}
                </p>
             </div>
             <input 
               type="text" 
               value={setupQuestion}
               onChange={(e) => setSetupQuestion(e.target.value)}
               placeholder="Security Question (e.g. First pet?)"
               className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
             />
             <input 
               type="text" 
               value={setupAnswer}
               onChange={(e) => setSetupAnswer(e.target.value)}
               placeholder="New Answer"
               className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
             />
             <div className="flex gap-2">
                {isRecoveryUpdate && onCancel && (
                    <button 
                        onClick={onCancel}
                        className="flex-1 py-2 bg-white/5 text-gray-400 rounded-xl text-[10px] font-bold uppercase"
                    >
                        Cancel
                    </button>
                )}
                <button 
                    onClick={handleSetupRecoverySubmit}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase shadow-lg shadow-blue-900/20"
                >
                    {isRecoveryUpdate ? 'Save Update' : 'Finish Setup'}
                </button>
             </div>
          </div>
        )}

        {view === 'reset' && (
          <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4">
             <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-3 text-center">
                <p className="text-[10px] text-red-400 uppercase font-black tracking-widest mb-2">Reset Launcher</p>
                <p className="text-xs text-red-200/70 font-medium leading-relaxed">
                  Resetting the launcher will remove your password, fingerprint, and Face ID settings. Your apps will be kept safe.
                </p>
             </div>
             <div className="flex gap-2">
                <button 
                  onClick={() => setView('unlock')}
                  className="flex-1 py-2 bg-white/5 text-gray-400 rounded-xl text-[10px] font-bold uppercase"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => onUnlock('reset_all_settings')}
                  className="flex-1 py-2 bg-red-600 text-white rounded-xl text-[10px] font-bold uppercase shadow-lg shadow-red-900/20"
                >
                  Reset Now
                </button>
             </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes laser { 0% { transform: translateY(-10px); } 100% { transform: translateY(60px); } }
        @keyframes face { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(112px); } }
        .animate-in { animation: animate-in 0.3s ease-out; }
        @keyframes animate-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default LockScreen;
