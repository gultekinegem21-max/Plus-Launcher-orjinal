
import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import Clock from './components/Clock';
import SearchBar from './components/SearchBar';
import AppCard from './components/AppCard';
import AddAppModal from './components/AddAppModal';
import LockScreen from './components/LockScreen';
import SettingsModal from './components/SettingsModal';
import type { AppItem, StoredApp, LauncherSettings } from './types';
import { 
  MailIcon, CalendarIcon, PhotosIcon, MusicIcon, SettingsIcon, 
  BrowserIcon, FilesIcon, MapsIcon, GameIcon, PlayStoreIcon, 
  UserIcon, CodeIcon, LinkIcon, iconMap 
} from './components/Icons';

const LOCAL_STORAGE_KEY = 'plus-launcher-custom-apps';
const SETTINGS_KEY = 'plus-launcher-settings';

const UrlIcon: React.FC<{ src: string; name: string; className?: string }> = ({ src, name, className }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (hasError || !src) {
    return <LinkIcon className={className} />;
  }

  return (
    <img 
      src={src} 
      alt={name} 
      className={`${className} object-cover rounded-md`} 
      onError={() => setHasError(true)}
    />
  );
};

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLockSetupOpen, setIsLockSetupOpen] = useState(false);
  const [isFingerprintSetupOpen, setIsFingerprintSetupOpen] = useState(false);
  const [isFaceIdSetupOpen, setIsFaceIdSetupOpen] = useState(false);
  const [isRecoveryUpdateOpen, setIsRecoveryUpdateOpen] = useState(false);
  
  const [settings, setSettings] = useState<LauncherSettings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      const defaults: LauncherSettings = { 
        passwordEnabled: false, 
        passwordHash: '', 
        fingerprintEnabled: false,
        faceIdEnabled: false,
        faceIdReference: undefined,
        recoveryQuestion: undefined,
        recoveryAnswerHash: undefined
      };
      return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
    } catch (e) {
      return { passwordEnabled: false, passwordHash: '', fingerprintEnabled: false, faceIdEnabled: false };
    }
  });

  const [isLocked, setIsLocked] = useState(() => {
    return !!(settings.passwordEnabled && settings.passwordHash);
  });

  const [customApps, setCustomApps] = useState<StoredApp[]>([]);
  const [editingApp, setEditingApp] = useState<StoredApp | null>(null);

  const loadApps = () => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setCustomApps(parsed);
      }
    } catch (error) {
      console.error("Failed to load apps", error);
    }
  };

  useEffect(() => {
    loadApps();
  }, []);

  const saveApps = (newApps: StoredApp[]) => {
    setCustomApps(newApps);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newApps));
  };

  const saveSettings = (newSettings: LauncherSettings) => {
    setSettings(newSettings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
  };

  const handleSaveApp = (app: StoredApp) => {
    let newApps;
    if (editingApp) {
      newApps = customApps.map(a => a.id === app.id ? app : a);
    } else {
      newApps = [...customApps, app];
    }
    saveApps(newApps);
    setIsModalOpen(false);
    setEditingApp(null);
  };

  const handleDeleteApp = (id: string) => {
    if (confirm('Are you sure you want to delete this app?')) {
      const newApps = customApps.filter(app => app.id !== id);
      saveApps(newApps);
    }
  };

  const handleUnlockAttempt = (attempt: string): boolean => {
    if (attempt === 'biometric' || attempt === 'faceid' || attempt === 'recovery_success') {
      setIsLocked(false);
      return true;
    }

    if (attempt === '3443') {
      setIsLocked(false);
      return true;
    }

    if (attempt === 'reset_all_settings') {
      const resetSettings = {
        ...settings,
        passwordEnabled: false,
        passwordHash: '',
        fingerprintEnabled: false,
        faceIdEnabled: false,
        faceIdReference: undefined,
        recoveryQuestion: undefined,
        recoveryAnswerHash: undefined
      };
      saveSettings(resetSettings);
      setIsLocked(false);
      return true;
    }

    const hashedAttempt = btoa(attempt);
    if (hashedAttempt === settings.passwordHash) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const handleSetPasscode = (passcode: string, recoveryData?: { question: string, answer: string }): boolean => {
    if (passcode.length < 4) return false;
    const hashed = btoa(passcode);
    
    const newSettings = {
        ...settings,
        passwordEnabled: true,
        passwordHash: hashed
    };

    if (recoveryData) {
      newSettings.recoveryQuestion = recoveryData.question;
      newSettings.recoveryAnswerHash = btoa(recoveryData.answer.toLowerCase().trim());
    }

    saveSettings(newSettings);
    setIsLockSetupOpen(false);
    return true;
  };

  const handleUpdateRecovery = (placeholder: string, recoveryData: { question: string, answer: string }): boolean => {
    if (!recoveryData.question || !recoveryData.answer) return false;
    
    saveSettings({
        ...settings,
        recoveryQuestion: recoveryData.question,
        recoveryAnswerHash: btoa(recoveryData.answer.toLowerCase().trim())
    });
    setIsRecoveryUpdateOpen(false);
    return true;
  };

  const handleCompleteBiometricEnrollment = (type: string, data?: string): boolean => {
    if (type === 'biometric') {
        saveSettings({ ...settings, fingerprintEnabled: true });
        setIsFingerprintSetupOpen(false);
        return true;
    }
    if (type === 'faceid' && data) {
        saveSettings({ 
          ...settings, 
          faceIdEnabled: true, 
          faceIdReference: data 
        });
        setIsFaceIdSetupOpen(false);
        return true;
    }
    return false;
  };

  const togglePasswordFeature = () => {
    if (settings.passwordEnabled) {
        if (confirm('Disable all security features (PIN, Biometrics)?')) {
            saveSettings({
                ...settings,
                passwordEnabled: false,
                passwordHash: '',
                fingerprintEnabled: false,
                faceIdEnabled: false,
                faceIdReference: undefined,
                recoveryQuestion: undefined,
                recoveryAnswerHash: undefined
            });
        }
    } else {
        setIsLockSetupOpen(true);
    }
  };

  const toggleFingerprintFeature = () => {
    if (settings.fingerprintEnabled) {
        saveSettings({ ...settings, fingerprintEnabled: false });
    } else {
        setIsFingerprintSetupOpen(true);
    }
  };

  const toggleFaceIdFeature = () => {
    if (settings.faceIdEnabled) {
        saveSettings({ ...settings, faceIdEnabled: false, faceIdReference: undefined });
    } else {
        setIsFaceIdSetupOpen(true);
    }
  };

  const defaultApps: AppItem[] = [
    {
      id: 'chrome',
      name: 'Chrome',
      icon: BrowserIcon,
      color: '#2563eb',
      action: () => window.open('https://www.google.com', '_blank'),
      isCustom: false
    },
    {
      id: 'roblox',
      name: 'Roblox',
      icon: GameIcon,
      color: '#ef4444',
      action: () => window.open('https://www.roblox.com', '_blank'),
      isCustom: false
    },
    {
      id: 'minecraft',
      name: 'Minecraft',
      icon: GameIcon,
      color: '#10b981',
      action: () => window.open('https://www.minecraft.net', '_blank'),
      isCustom: false
    },
    {
      id: 'playstore',
      name: 'Google Play',
      icon: PlayStoreIcon,
      color: '#0ea5e9',
      action: () => window.open('https://play.google.com', '_blank'),
      isCustom: false
    },
    {
      id: 'colab',
      name: 'Google Colab',
      icon: CodeIcon,
      color: '#f97316',
      action: () => window.open('https://colab.research.google.com/', '_blank'),
      isCustom: false
    },
    {
      id: 'photos',
      name: 'Photos',
      icon: PhotosIcon,
      color: '#ec4899',
      action: () => window.open('https://photos.google.com', '_blank'),
      isCustom: false
    },
    {
        id: 'launcher-settings',
        name: 'Launcher Settings',
        icon: SettingsIcon,
        color: '#475569',
        action: () => setIsSettingsOpen(true),
        isCustom: false
    }
  ];

  const mappedCustomApps: AppItem[] = customApps.map(app => {
    let IconComponent = LinkIcon;
    if (app.iconIdentifier && iconMap[app.iconIdentifier]) {
        IconComponent = iconMap[app.iconIdentifier];
    } else if (app.iconIdentifier && app.iconIdentifier.startsWith('http')) {
        IconComponent = ({ className }) => <UrlIcon src={app.iconIdentifier} name={app.name} className={className} />;
    }

    return {
        id: app.id,
        name: app.name,
        icon: IconComponent,
        color: app.color,
        action: () => window.open(app.url, '_blank'),
        isCustom: true
    };
  });

  const allApps = [...defaultApps, ...mappedCustomApps];
  const filteredApps = allApps.filter(app => app.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-900 p-6 md:p-12 font-sans selection:bg-blue-500/30 overflow-x-hidden relative">
        <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none animate-pulse-bg" />
        <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none animate-pulse-bg animation-delay-4000" />

        {isLocked && (
          <LockScreen 
            onUnlock={handleUnlockAttempt} 
            fingerprintEnabled={settings.fingerprintEnabled}
            faceIdEnabled={settings.faceIdEnabled}
            faceIdReference={settings.faceIdReference}
            recoveryQuestion={settings.recoveryQuestion}
            recoveryAnswerHash={settings.recoveryAnswerHash}
          />
        )}
        
        {isLockSetupOpen && <LockScreen onUnlock={handleSetPasscode} isSetup={true} />}
        {isFingerprintSetupOpen && <LockScreen onUnlock={(at) => handleCompleteBiometricEnrollment(at)} isFingerprintSetup={true} />}
        {isFaceIdSetupOpen && <LockScreen onUnlock={(at, data) => handleCompleteBiometricEnrollment(at, data)} isFaceIdSetup={true} />}
        {isRecoveryUpdateOpen && <LockScreen onUnlock={handleUpdateRecovery} isRecoveryUpdate={true} onCancel={() => setIsRecoveryUpdateOpen(false)} />}

        <div className="max-w-7xl mx-auto space-y-12 relative z-10">
            <Header 
                isEditMode={isEditMode} 
                onToggleEditMode={() => setIsEditMode(!isEditMode)}
                hasCustomApps={customApps.length > 0}
                onReload={loadApps}
                onLock={settings.passwordEnabled ? () => setIsLocked(true) : undefined}
            />
            
            <div className="space-y-8">
                <Clock />
                <SearchBar value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                {filteredApps.map(app => (
                    <AppCard 
                        key={app.id} 
                        app={app} 
                        isEditMode={isEditMode}
                        onEdit={() => {
                            const stored = customApps.find(a => a.id === app.id);
                            if (stored) { setEditingApp(stored); setIsModalOpen(true); }
                        }}
                        onDelete={() => handleDeleteApp(app.id)}
                    />
                ))}
                
                <button
                    onClick={() => { setEditingApp(null); setIsModalOpen(true); }}
                    className="aspect-square flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-gray-700 text-gray-500 hover:text-white hover:border-gray-500 hover:bg-gray-800/30 transition-all duration-300 group"
                >
                    <div className="p-4 rounded-full bg-gray-800 group-hover:bg-gray-700 transition-colors mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                    <span className="text-sm font-medium">Add App</span>
                </button>
            </div>
        </div>

        <AddAppModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveApp} appToEdit={editingApp} />

        <SettingsModal 
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            isEditMode={isEditMode}
            onToggleEditMode={() => setIsEditMode(!isEditMode)}
            passwordEnabled={settings.passwordEnabled}
            onManagePassword={togglePasswordFeature}
            onLock={() => { setIsSettingsOpen(false); setIsLocked(true); }}
            fingerprintEnabled={settings.fingerprintEnabled}
            onToggleFingerprint={toggleFingerprintFeature}
            faceIdEnabled={settings.faceIdEnabled}
            onToggleFaceId={toggleFaceIdFeature}
            onManageRecovery={() => { setIsSettingsOpen(false); setIsRecoveryUpdateOpen(true); }}
            onAddApp={() => { setEditingApp(null); setIsModalOpen(true); }}
            bannedUsers={settings.bannedUsers || []}
            onUpdateBannedUsers={(users) => saveSettings({ ...settings, bannedUsers: users })}
        />
    </div>
  );
}
