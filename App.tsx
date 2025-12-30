
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
  
  // Initialize lock state immediately from localStorage to prevent flash
  const [isLocked, setIsLocked] = useState(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return !!(parsed.passwordEnabled && parsed.passwordHash);
      }
    } catch (e) {}
    return false;
  });

  const [customApps, setCustomApps] = useState<StoredApp[]>([]);
  const [editingApp, setEditingApp] = useState<StoredApp | null>(null);
  const [settings, setSettings] = useState<LauncherSettings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      return stored ? JSON.parse(stored) : { passwordEnabled: false, passwordHash: '' };
    } catch (e) {
      return { passwordEnabled: false, passwordHash: '' };
    }
  });

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
    const hashedAttempt = btoa(attempt);
    if (hashedAttempt === settings.passwordHash) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const handleSetPasscode = (passcode: string): boolean => {
    if (passcode.length < 4) return false;
    const hashed = btoa(passcode);
    saveSettings({
        passwordEnabled: true,
        passwordHash: hashed
    });
    setIsLockSetupOpen(false);
    return true;
  };

  const togglePasswordFeature = () => {
    if (settings.passwordEnabled) {
        if (confirm('Disable passcode protection?')) {
            saveSettings({
                passwordEnabled: false,
                passwordHash: ''
            });
        }
    } else {
        setIsLockSetupOpen(true);
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

  const filteredApps = allApps.filter(app => 
    app.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-900 p-6 md:p-12 font-sans selection:bg-blue-500/30 overflow-x-hidden">
        {/* Lock Screen Overlay - Absolute Priority */}
        {isLocked && <LockScreen onUnlock={handleUnlockAttempt} />}
        
        {/* Passcode Setup Overlay */}
        {isLockSetupOpen && <LockScreen onUnlock={handleSetPasscode} isSetup={true} />}

        <div className="max-w-7xl mx-auto space-y-12">
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
                            if (stored) {
                                setEditingApp(stored);
                                setIsModalOpen(true);
                            }
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

        <AddAppModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveApp}
            appToEdit={editingApp}
        />

        <SettingsModal 
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            isEditMode={isEditMode}
            onToggleEditMode={() => setIsEditMode(!isEditMode)}
            passwordEnabled={settings.passwordEnabled}
            onManagePassword={togglePasswordFeature}
            onLock={() => { setIsSettingsOpen(false); setIsLocked(true); }}
        />
    </div>
  );
}
