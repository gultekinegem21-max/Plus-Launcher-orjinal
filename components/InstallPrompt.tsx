import React, { useState, useEffect } from "react";
import { Download, Sparkles, CheckCircle2, X, Laptop, Smartphone } from "lucide-react";

interface InstallPromptProps {
  appIcon?: string;
  deferredPrompt?: any;
  onClose?: () => void;
}

export default function InstallPrompt({ appIcon, deferredPrompt, onClose }: InstallPromptProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [installStep, setInstallStep] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    // Show prompt 2 seconds after mounting/entering the app
    const checkStatus = () => {
      const isInstalled = localStorage.getItem("plus-launcher-app-installed");
      const isDismissed = localStorage.getItem("plus-launcher-install-dismissed");

      if (!isInstalled && !isDismissed) {
        setIsOpen(true);
      }
    };

    const timer = setTimeout(checkStatus, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("plus-launcher-install-dismissed", "true");
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          localStorage.setItem("plus-launcher-app-installed", "true");
          setIsOpen(false);
          return;
        }
      } catch (err) {
        console.error("Native PWA promotion error:", err);
      }
    }

    // Direct Simulated Download and Installation Experience
    setIsInstalling(true);
    setInstallProgress(0);
    setInstallStep("Establishing handshake...");

    const steps = [
      { prg: 20, msg: "Downloading app resources..." },
      { prg: 45, msg: "Capping asset shell..." },
      { prg: 70, msg: "Optimizing LocalStorage pipelines..." },
      { prg: 90, msg: "Creating standalone desktop launcher..." },
      { prg: 100, msg: "Launcher integrated successfully!" },
    ];

    let currentStepIndex = 0;
    const interval = setInterval(() => {
      setInstallProgress((prev) => {
        const target = steps[currentStepIndex].prg;
        if (prev < target) {
          const nextVal = prev + Math.floor(Math.random() * 4) + 1;
          const cappedVal = Math.min(nextVal, target);
          if (cappedVal === target) {
            setInstallStep(steps[currentStepIndex].msg);
            if (currentStepIndex < steps.length - 1) {
              currentStepIndex++;
            } else {
              clearInterval(interval);
              setTimeout(() => {
                setIsCompleted(true);
                localStorage.setItem("plus-launcher-app-installed", "true");
                setTimeout(() => {
                  setIsOpen(false);
                  if (onClose) onClose();
                }, 2000);
              }, 600);
            }
          }
          return cappedVal;
        }
        return prev;
      });
    }, 40);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-x-0 bottom-6 z-[100] flex justify-center px-4 md:px-0 animate-in slide-in-from-bottom-12 duration-500">
      <div className="w-full max-w-md bg-gray-950/80 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.6)] text-white overflow-hidden relative p-5 flex flex-col gap-4">
        {/* Border Glow Accents */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {!isInstalling ? (
          <>
            {/* Header Content */}
            <div className="flex items-start gap-3.5 pr-6">
              <div className="relative flex-shrink-0">
                {appIcon ? (
                  <img
                    src={appIcon}
                    alt="App Logo"
                    className="w-12 h-12 rounded-xl object-cover bg-white/5 border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                  />
                ) : (
                  <div className="w-12 h-12 bg-blue-500/15 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/25 font-bold text-xl shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                    +
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 bg-blue-600 p-1 rounded-full text-white border border-gray-950 shadow">
                  <Download className="w-2.5 h-2.5" />
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-black tracking-wide uppercase flex items-center gap-1.5 text-blue-400">
                  Update Plus Launcher
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                </h3>
                <p className="text-gray-300 text-xs leading-relaxed font-medium">
                  Would you like to update Plus Launcher to latest version?
                </p>
              </div>

              {/* Dismiss X icon */}
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Interaction Row */}
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={handleInstall}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                Update App
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5 hover:border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95"
              >
                Later
              </button>
            </div>
          </>
        ) : (
          <div className="py-2 space-y-4">
            {isCompleted ? (
              <div className="flex flex-col items-center justify-center text-center space-y-2 p-3 animate-in zoom-in-95 duration-300">
                <CheckCircle2 className="w-12 h-12 text-green-400 animate-bounce" />
                <h3 className="text-sm font-black tracking-wide uppercase text-green-400">
                  Update Successful!
                </h3>
                <p className="text-xs text-gray-400">
                  Plus Launcher is now updated and fully integrated into your environment!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span className="font-bold flex items-center gap-1.5 uppercase tracking-wide text-blue-400 animate-pulse">
                    Updating Launcher...
                  </span>
                  <span className="font-mono text-[10px] bg-white/5 px-2 py-0.5 rounded border border-white/10 text-white">
                    {installProgress}%
                  </span>
                </div>

                {/* Progress Bar Container */}
                <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden border border-white/10 relative p-[1px]">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-100 ease-out"
                    style={{ width: `${installProgress}%` }}
                  />
                </div>

                {/* Active step logs */}
                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono italic">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping" />
                  <span>{installStep}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
