
import React from 'react';
import { LockIcon, ShieldCheckIcon, PencilIcon, TrashIcon } from './Icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  passwordEnabled: boolean;
  onManagePassword: () => void;
  onLock: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  isEditMode, 
  onToggleEditMode, 
  passwordEnabled,
  onManagePassword,
  onLock
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl" 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-900/20">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 12H15" />
            </svg>
            Launcher Settings
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Edit Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-white font-medium">Customization Mode</p>
              <p className="text-sm text-gray-400">Edit, move, and delete apps</p>
            </div>
            <button 
              onClick={onToggleEditMode}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isEditMode ? 'bg-blue-600' : 'bg-gray-700'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isEditMode ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="h-px bg-gray-700" />

          {/* Password Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-white font-medium">Passcode Protection</p>
                <p className="text-sm text-gray-400">Require a PIN to open launcher</p>
              </div>
              <div className={`p-2 rounded-lg ${passwordEnabled ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                {passwordEnabled ? <ShieldCheckIcon className="w-5 h-5" /> : <LockIcon className="w-5 h-5 opacity-40" />}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={onManagePassword}
                    className="flex items-center justify-center gap-2 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors font-medium text-sm"
                >
                    {passwordEnabled ? 'Change PIN' : 'Set PIN'}
                </button>
                {passwordEnabled && (
                    <button 
                        onClick={onLock}
                        className="flex items-center justify-center gap-2 py-3 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-xl transition-all font-medium text-sm border border-blue-500/30"
                    >
                        Lock Now
                    </button>
                )}
            </div>
          </div>

          <div className="h-px bg-gray-700" />

          <div className="text-xs text-gray-500 text-center">
            Plus+Launcher v1.2.1 • Data stored locally
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
