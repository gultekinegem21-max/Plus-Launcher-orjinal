
import React from 'react';
import { LockIcon, ShieldCheckIcon, FingerprintIcon, FaceIdIcon, MailIcon } from './Icons';

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
  bannedUsers?: string[];
  onUpdateBannedUsers?: (users: string[]) => void;
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
  bannedUsers = [],
  onUpdateBannedUsers
}) => {
  const [adminPin, setAdminPin] = React.useState('');
  const [isAdminUnlocked, setIsAdminUnlocked] = React.useState(false);
  const [banInput, setBanInput] = React.useState('');

  // Reset admin state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setIsAdminUnlocked(false);
      setAdminPin('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/20">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-white text-xs font-medium">Customization Mode</p>
            <button onClick={onToggleEditMode} className={`h-5 w-10 rounded-full transition-colors relative ${isEditMode ? 'bg-blue-600' : 'bg-gray-700'}`}>
                <span className={`absolute top-0.5 left-0.5 h-4 w-4 bg-white rounded-full transition-transform ${isEditMode ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="h-px bg-gray-700" />

          <div className="space-y-3">
             <div className="flex items-center justify-between">
                <p className="text-white text-xs font-medium">PIN Protection</p>
                {passwordEnabled ? <ShieldCheckIcon className="w-4 h-4 text-green-400" /> : <LockIcon className="w-4 h-4 text-red-500 opacity-40" />}
             </div>
             <div className="grid grid-cols-2 gap-2">
                <button onClick={onManagePassword} className="py-2 bg-gray-700 text-white rounded-lg text-[10px] font-bold uppercase">{passwordEnabled ? 'Change PIN' : 'Set PIN'}</button>
                {passwordEnabled && <button onClick={onLock} className="py-2 bg-blue-600 text-white rounded-lg text-[10px] font-bold uppercase">Lock Now</button>}
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
                    <p className="text-white text-[10px] font-medium flex items-center gap-1"><FingerprintIcon className="w-3 h-3"/> Fingerprint</p>
                    <button onClick={onToggleFingerprint} className={`h-4 w-8 rounded-full transition-colors relative ${fingerprintEnabled ? 'bg-blue-600' : 'bg-gray-700'}`}>
                        <span className={`absolute top-0.5 left-0.5 h-3 w-3 bg-white rounded-full transition-transform ${fingerprintEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                </div>
             )}

             {passwordEnabled && onToggleFaceId && (
                <div className="flex items-center justify-between">
                    <p className="text-white text-[10px] font-medium flex items-center gap-1"><FaceIdIcon className="w-3 h-3"/> Face ID</p>
                    <button onClick={onToggleFaceId} className={`h-4 w-8 rounded-full transition-colors relative ${faceIdEnabled ? 'bg-blue-600' : 'bg-gray-700'}`}>
                        <span className={`absolute top-0.5 left-0.5 h-3 w-3 bg-white rounded-full transition-transform ${faceIdEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
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
                                if (e.key === 'Enter') {
                                    if (adminPin === '3443') {
                                        setIsAdminUnlocked(true);
                                    } else {
                                        setAdminPin('');
                                    }
                                }
                            }}
                            placeholder="Enter Admin PIN" 
                            className="bg-black/50 text-white px-3 py-2 rounded-lg text-xs w-full border border-amber-500/30 focus:outline-none focus:border-amber-500"
                        />
                        <button 
                            onClick={() => {
                                if (adminPin === '3443') {
                                    setIsAdminUnlocked(true);
                                } else {
                                    setAdminPin('');
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
                        <div className="grid grid-cols-2 gap-2">
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
                              className={`py-2 rounded-lg text-[10px] font-bold uppercase transition-colors ${isEditMode ? 'bg-red-600 text-white' : 'bg-red-600/20 hover:bg-red-600/40 text-red-500'}`}
                           >
                             {isEditMode ? 'Done Deleting' : 'Delete Apps'}
                           </button>
                        </div>
                        
                        <div className="bg-black/20 rounded-lg p-2 border border-amber-500/20">
                            <p className="text-[9px] text-amber-500/80 font-bold uppercase mb-2">Ban Manager</p>
                            <div className="flex gap-2">
                                <input 
                                    value={banInput}
                                    onChange={e => setBanInput(e.target.value)}
                                    placeholder="Account Name / ID"
                                    className="bg-black/50 text-white px-2 py-1.5 rounded-md text-[10px] flex-1 border border-amber-500/30 focus:outline-none focus:border-amber-500"
                                />
                                <button
                                    onClick={() => {
                                        if (banInput.trim() && onUpdateBannedUsers) {
                                            onUpdateBannedUsers([...bannedUsers, banInput.trim()]);
                                            setBanInput('');
                                        }
                                    }}
                                    disabled={!banInput.trim()}
                                    className="bg-amber-600 text-white px-3 py-1.5 rounded-md text-[10px] font-bold uppercase disabled:opacity-50"
                                >
                                    Ban
                                </button>
                            </div>
                            
                            {bannedUsers.length > 0 && (
                                <div className="mt-2 space-y-1 max-h-24 overflow-y-auto pr-1">
                                    {bannedUsers.map((user, i) => (
                                        <div key={i} className="flex items-center justify-between bg-black/40 px-2 py-1.5 rounded-md border border-red-500/10">
                                            <span className="text-[10px] text-white/80 select-all truncate">{user}</span>
                                            <button 
                                                onClick={() => {
                                                    if (onUpdateBannedUsers) {
                                                        onUpdateBannedUsers(bannedUsers.filter((_, index) => index !== i));
                                                    }
                                                }}
                                                className="text-[9px] text-red-400 hover:text-red-300 font-bold uppercase"
                                            >
                                                Unban
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
             </div>
          </div>

          <div className="text-[8px] text-gray-500 text-center uppercase tracking-widest pt-2">Plus+Launcher v1.5.0</div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
