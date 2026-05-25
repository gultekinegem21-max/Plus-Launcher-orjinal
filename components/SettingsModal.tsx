import React from "react";
import {
  LockIcon,
  ShieldCheckIcon,
  FingerprintIcon,
  FaceIdIcon,
  MailIcon,
} from "./Icons";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  passwordEnabled: boolean;
  onManagePassword: () => void;
  onLock: () => void;
  fingerprintEnabled?: boolean;
  onToggleFingerprint?: () => void;
  faceIdEnabled?: boolean;
  onToggleFaceId?: () => void;
  onManageRecovery?: () => void;
  onAddApp?: () => void;
  currentUser?: string | null;
  onLogout?: () => void;
  onLogin?: (username: string, remember: boolean) => void;
  appIcon?: string;
  onChangeAppIcon?: (url: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isEditMode,
  onToggleEditMode,
  passwordEnabled,
  onManagePassword,
  onLock,
  fingerprintEnabled,
  onToggleFingerprint,
  faceIdEnabled,
  onToggleFaceId,
  onManageRecovery,
  onAddApp,
  currentUser,
  onLogout,
  onLogin,
  appIcon,
  onChangeAppIcon,
}) => {
  const [adminPin, setAdminPin] = React.useState("");
  const [isAdminUnlocked, setIsAdminUnlocked] = React.useState(false);
  const [feedback, setFeedback] = React.useState("");
  const [feedbackSent, setFeedbackSent] = React.useState(false);
  const [isViewingFeedback, setIsViewingFeedback] = React.useState(false);
  const [feedbacks, setFeedbacks] = React.useState<{ id: number; text: string; user: string | null; date: string }[]>(() => {
    try {
      const stored = localStorage.getItem("plus-launcher-feedback");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [iconUploadSuccess, setIconUploadSuccess] = React.useState(false);

  const handleSendFeedback = () => {
    if (!feedback.trim()) return;
    const newFb = { id: Date.now(), text: feedback.trim(), user: currentUser || "Anonymous", date: new Date().toLocaleDateString() };
    const updated = [...feedbacks, newFb];
    setFeedbacks(updated);
    localStorage.setItem("plus-launcher-feedback", JSON.stringify(updated));
    setFeedback("");
    setFeedbackSent(true);
    setTimeout(() => setFeedbackSent(false), 3000);
  };

  // Reset admin state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setIsAdminUnlocked(false);
      setAdminPin("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900/40 backdrop-blur-3xl border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.4)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            Settings
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
          <div className="space-y-3">
            <p className="text-white text-xs font-medium">Account Settings</p>
            {currentUser ? (
              <div className="flex items-center justify-between bg-black/20 p-3 rounded-xl border border-gray-700/50">
                <div className="space-y-0.5">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    Active Account
                  </p>
                  <p className="text-sm font-medium text-white truncate max-w-[150px]">
                    {currentUser}
                  </p>
                </div>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-3 py-1.5 rounded border border-red-500/20 text-[10px] font-bold uppercase transition-colors"
                  >
                    Sign Out
                  </button>
                )}
              </div>
            ) : (
              <form
                className="flex flex-col gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const user = fd.get("username") as string;
                  const remember = fd.get("rememberMe") === "on";
                  if (user.trim() && onLogin) {
                    onLogin(user.trim(), remember);
                  }
                }}
              >
                <div className="flex items-center gap-2">
                    <input
                      name="username"
                      placeholder="Account Name..."
                      className="bg-black/50 text-white px-3 py-2 rounded-lg text-xs flex-1 border border-gray-700 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase h-[34px]"
                    >
                      Sign In
                    </button>
                </div>
                <div className="flex items-center gap-2 px-1">
                    <input type="checkbox" id="settingsRememberMe" name="rememberMe" className="w-3.5 h-3.5 rounded border-white/10 bg-black/50 accent-blue-500" defaultChecked />
                    <label htmlFor="settingsRememberMe" className="text-gray-400 text-[10px] cursor-pointer select-none">Remember account</label>
                </div>
              </form>
            )}
          </div>
          <div className="h-px bg-gray-700" />

          <div className="flex items-center justify-between">
            <p className="text-white text-xs font-medium">Customization Mode</p>
            <button
              onClick={onToggleEditMode}
              className={`h-5 w-10 rounded-full transition-colors relative ${isEditMode ? "bg-blue-600" : "bg-gray-700"}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-4 w-4 bg-white rounded-full transition-transform ${isEditMode ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>

          <div className="h-px bg-gray-700" />

          <div className="space-y-3">
            <p className="text-white text-xs font-medium">App Feedback</p>
            <div className="flex gap-2">
              <input
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="What can we improve?..."
                className="bg-black/50 text-white px-3 py-2 rounded-lg text-xs flex-1 border border-gray-700 focus:outline-none focus:border-blue-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendFeedback();
                }}
              />
              <button
                onClick={handleSendFeedback}
                disabled={!feedback.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase disabled:opacity-50 transition-colors"
                title="Goes straight to Admin Panel"
              >
                {feedbackSent ? "Sent!" : "Send"}
              </button>
            </div>
            {feedbackSent && (
              <p className="text-[10px] text-green-400 font-medium px-1 animate-in fade-in transition-all">Feedback sent to admin panel! Thank you.</p>
            )}
          </div>

          <div className="h-px bg-gray-700" />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-white text-xs font-medium">PIN Protection</p>
              {passwordEnabled ? (
                <ShieldCheckIcon className="w-4 h-4 text-green-400" />
              ) : (
                <LockIcon className="w-4 h-4 text-red-500 opacity-40" />
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onManagePassword}
                className="py-2 bg-gray-700 text-white rounded-lg text-[10px] font-bold uppercase"
              >
                {passwordEnabled ? "Change PIN" : "Set PIN"}
              </button>
              {passwordEnabled && (
                <button
                  onClick={onLock}
                  className="py-2 bg-blue-600 text-white rounded-lg text-[10px] font-bold uppercase"
                >
                  Lock Now
                </button>
              )}
            </div>

            {passwordEnabled && onManageRecovery && (
              <div className="pt-1">
                <button
                  onClick={onManageRecovery}
                  className="w-full py-2 border border-gray-700 hover:bg-gray-700/50 text-gray-300 hover:text-white rounded-lg text-[10px] font-bold uppercase flex items-center justify-center gap-2 transition-all"
                >
                  <MailIcon className="w-3 h-3" />
                  Update Recovery Info
                </button>
              </div>
            )}

            {passwordEnabled && onToggleFingerprint && (
              <div className="flex items-center justify-between pt-1">
                <p className="text-white text-[10px] font-medium flex items-center gap-1">
                  <FingerprintIcon className="w-3 h-3" /> Fingerprint
                </p>
                <button
                  onClick={onToggleFingerprint}
                  className={`h-4 w-8 rounded-full transition-colors relative ${fingerprintEnabled ? "bg-blue-600" : "bg-gray-700"}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-3 w-3 bg-white rounded-full transition-transform ${fingerprintEnabled ? "translate-x-4" : "translate-x-0"}`}
                  />
                </button>
              </div>
            )}

            {passwordEnabled && onToggleFaceId && (
              <div className="flex items-center justify-between">
                <p className="text-white text-[10px] font-medium flex items-center gap-1">
                  <FaceIdIcon className="w-3 h-3" /> Face ID
                </p>
                <button
                  onClick={onToggleFaceId}
                  className={`h-4 w-8 rounded-full transition-colors relative ${faceIdEnabled ? "bg-blue-600" : "bg-gray-700"}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-3 w-3 bg-white rounded-full transition-transform ${faceIdEnabled ? "translate-x-4" : "translate-x-0"}`}
                  />
                </button>
              </div>
            )}

            <div className="h-px bg-gray-700 mt-4 mb-2" />

            <div className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-3 space-y-3">
              <p className="text-amber-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                <ShieldCheckIcon className="w-3 h-3" /> Administrator
              </p>
              {!isAdminUnlocked ? (
                <div className="flex gap-2">
                  <input
                    type="password"
                    maxLength={4}
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (adminPin === "3443") {
                          setIsAdminUnlocked(true);
                        } else {
                          setAdminPin("");
                        }
                      }
                    }}
                    placeholder="Enter Admin PIN"
                    className="bg-black/50 text-white px-3 py-2 rounded-lg text-xs w-full border border-amber-500/30 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={() => {
                      if (adminPin === "3443") {
                        setIsAdminUnlocked(true);
                      } else {
                        setAdminPin("");
                      }
                    }}
                    className="bg-amber-600 hover:bg-amber-500 transition-colors text-white px-4 rounded-lg text-[10px] font-bold uppercase disabled:opacity-50"
                    disabled={adminPin.length < 4}
                  >
                    Unlock
                  </button>
                </div>
              ) : (
                <div className="space-y-3 animate-in fade-in zoom-in-95">
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === 'string' && onChangeAppIcon) {
                              onChangeAppIcon(reader.result);
                              setIconUploadSuccess(true);
                              setTimeout(() => setIconUploadSuccess(false), 3000);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        fileInputRef.current?.click();
                      }}
                      className={`col-span-2 py-2 border text-white shadow-lg rounded-lg text-[10px] font-bold uppercase transition-colors ${iconUploadSuccess ? 'bg-green-600 border-green-500/50 hover:bg-green-500 shadow-green-900/20' : 'bg-amber-600 border-amber-500/50 hover:bg-amber-500 shadow-amber-900/20'}`}
                    >
                      {iconUploadSuccess ? 'Upload Successful!' : 'Change Launcher Logo'}
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        if (onAddApp) onAddApp();
                      }}
                      className="py-2 bg-amber-600/20 hover:bg-amber-600/40 text-amber-500 rounded-lg text-[10px] font-bold uppercase transition-colors"
                    >
                      Add App / Icon
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        onToggleEditMode();
                      }}
                      className={`py-2 rounded-lg text-[10px] font-bold uppercase transition-colors ${isEditMode ? "bg-red-600 text-white" : "bg-red-600/20 hover:bg-red-600/40 text-red-500"}`}
                    >
                      {isEditMode ? "Done Deleting" : "Delete Apps"}
                    </button>
                    <button
                      onClick={() => setIsViewingFeedback(!isViewingFeedback)}
                      className="col-span-2 py-2 bg-amber-600 border border-amber-500/50 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/20 rounded-lg text-[10px] font-bold uppercase transition-colors"
                    >
                      {isViewingFeedback ? "Hide User Feedback" : "View User Feedback"} 
                    </button>
                  </div>
                  
                  {isViewingFeedback && (
                    <div className="mt-4 p-3 bg-black/40 border border-gray-700 rounded-xl space-y-3 max-h-48 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                      <div className="flex items-center justify-between">
                        <p className="text-gray-300 text-[10px] font-bold uppercase tracking-widest">Inbox ({feedbacks.length})</p>
                        {feedbacks.length > 0 && (
                            <button
                                onClick={() => {
                                    if(confirm("Clear all feedback?")) {
                                        setFeedbacks([]);
                                        localStorage.removeItem("plus-launcher-feedback");
                                    }
                                }}
                                className="text-[10px] text-red-400 hover:text-red-300 transition-colors uppercase font-bold"
                            >
                                Clear All
                            </button>
                        )}
                      </div>
                      
                      {feedbacks.length === 0 ? (
                        <p className="text-xs text-gray-500 text-center py-4">No feedback received yet.</p>
                      ) : (
                        feedbacks.slice().reverse().map(fb => (
                          <div key={fb.id} className="bg-gray-800/50 border border-gray-700/50 p-2 rounded-lg space-y-1">
                            <div className="flex justify-between items-start">
                                <p className="text-[10px] text-blue-400 font-medium">{fb.user}</p>
                                <p className="text-[9px] text-gray-500">{fb.date}</p>
                            </div>
                            <p className="text-xs text-white">{fb.text}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="border border-blue-500/30 bg-blue-500/5 rounded-xl p-3 space-y-2 mt-4">
            <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
              App Information
            </p>
            <div className="space-y-1 text-xs text-gray-400">
              <p>Platform: Web / Plus+Launcher</p>
              <p>Storage: Local Storage</p>
              <p>URL: plus-launcher.vercel.app</p>
              <p>Version: 1.5.0</p>
            </div>
          </div>

          <div className="text-[8px] text-gray-500 text-center uppercase tracking-widest pt-2 flex flex-col gap-1 mt-4">
            <span>Plus+Launcher v1.5.0</span>
            <span className="text-blue-500 font-bold">powered by gultekinegem21max</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
