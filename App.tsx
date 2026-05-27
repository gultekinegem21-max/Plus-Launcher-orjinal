import React, { useState, useMemo, useEffect } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import Header from "./components/Header";
import Clock from "./components/Clock";
import SearchBar from "./components/SearchBar";
import AppCard from "./components/AppCard";
import AddAppModal from "./components/AddAppModal";
import LockScreen from "./components/LockScreen";
import SettingsModal from "./components/SettingsModal";
import InstallPrompt from "./components/InstallPrompt";
import type { AppItem, StoredApp, LauncherSettings } from "./types";
import {
  MailIcon,
  CalendarIcon,
  PhotosIcon,
  MusicIcon,
  SettingsIcon,
  BrowserIcon,
  FilesIcon,
  MapsIcon,
  GameIcon,
  PlayStoreIcon,
  UserIcon,
  CodeIcon,
  LinkIcon,
  iconMap,
  AppleAppStoreIcon,
  MicrosoftStoreIcon,
} from "./components/Icons";

const LOCAL_STORAGE_KEY = "plus-launcher-custom-apps";
const SETTINGS_KEY = "plus-launcher-settings";

const UrlIcon: React.FC<{ src: string; name: string; className?: string }> = ({
  src,
  name,
  className,
}) => {
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
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLockSetupOpen, setIsLockSetupOpen] = useState(false);
  const [isFingerprintSetupOpen, setIsFingerprintSetupOpen] = useState(false);
  const [isFaceIdSetupOpen, setIsFaceIdSetupOpen] = useState(false);
  const [isRecoveryUpdateOpen, setIsRecoveryUpdateOpen] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(() =>
    localStorage.getItem("plus-launcher-user") || sessionStorage.getItem("plus-launcher-user"),
  );
  const [settings, setSettings] = useState<LauncherSettings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      const defaults: LauncherSettings = {
        passwordEnabled: false,
        passwordHash: "",
        fingerprintEnabled: false,
        faceIdEnabled: false,
        faceIdReference: undefined,
        recoveryQuestion: undefined,
        recoveryAnswerHash: undefined,
        appName: "Plus+Launcher",
      };
      return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
    } catch (e) {
      return {
        passwordEnabled: false,
        passwordHash: "",
        fingerprintEnabled: false,
        faceIdEnabled: false,
        appName: "Plus+Launcher",
      };
    }
  });

  useEffect(() => {
    document.title = settings.appName || "Plus+Launcher";
  }, [settings.appName]);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall as any);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall as any);
  }, []);

  useEffect(() => {
    if (settings.appIcon || settings.appName) {
      if (settings.appIcon) {
        let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = settings.appIcon;

        let appleLink: HTMLLinkElement | null = document.querySelector("link[rel='apple-touch-icon']");
        if (!appleLink) {
          appleLink = document.createElement('link');
          appleLink.rel = 'apple-touch-icon';
          document.getElementsByTagName('head')[0].appendChild(appleLink);
        }
        appleLink.href = settings.appIcon;
      }

      const manifest = {
        name: settings.appName || "Plus+Launcher",
        short_name: settings.appName || "Plus+Launcher",
        start_url: window.location.origin + "/",
        display: "standalone",
        background_color: "#111827",
        theme_color: "#1e3a8a",
        icons: [
          {
            src: settings.appIcon ? new URL(settings.appIcon, window.location.href).href : 'https://ui-avatars.com/api/?name=Plus+Launcher&size=512&background=1e3a8a&color=fff',
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: settings.appIcon ? new URL(settings.appIcon, window.location.href).href : 'https://ui-avatars.com/api/?name=Plus+Launcher&size=192&background=1e3a8a&color=fff',
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      };
      
      const manifestString = JSON.stringify(manifest);
      const manifestDataUrl = `data:application/manifest+json;charset=utf-8,${encodeURIComponent(manifestString)}`;
      
      let manifestLink: HTMLLinkElement | null = document.querySelector("link[rel='manifest']");
      if (!manifestLink) {
        manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        document.getElementsByTagName('head')[0].appendChild(manifestLink);
      }
      
      // Cleanup previous blob URL if any
      if (manifestLink.href && manifestLink.href.startsWith("blob:")) {
        URL.revokeObjectURL(manifestLink.href);
      }
      manifestLink.href = manifestDataUrl;
    }
  }, [settings.appIcon, settings.appName]);

  const [isLocked, setIsLocked] = useState(() => {
    const user = localStorage.getItem("plus-launcher-user") || sessionStorage.getItem("plus-launcher-user");
    if (user === "Admin Plus+") return false;
    return !!(settings.passwordEnabled && settings.passwordHash);
  });

  useEffect(() => {
    if (currentUser === "Admin Plus+") {
      setIsLocked(false);
    }
  }, [currentUser]);

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
    if (newSettings.appIcon !== settings.appIcon) {
      setDoc(doc(db, "globals", "settings"), { appIcon: newSettings.appIcon }, { merge: true }).catch(console.error);
    }
    setSettings(newSettings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
  };

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "globals", "settings"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.appIcon) {
          setSettings((prev) => {
            if (prev.appIcon === data.appIcon) return prev;
            const newSettings = { ...prev, appIcon: data.appIcon };
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
            return newSettings;
          });
        }
      }
    });
    return unsub;
  }, []);

  const handleSaveApp = (app: StoredApp) => {
    let newApps;
    if (editingApp) {
      newApps = customApps.map((a) => (a.id === app.id ? app : a));
    } else {
      newApps = [...customApps, app];
    }
    saveApps(newApps);
    setIsModalOpen(false);
    setEditingApp(null);
  };

  const handleDeleteApp = (id: string) => {
    if (id === "launcher-settings") return;
    if (confirm("Are you sure you want to delete this app?")) {
      const isDefault = defaultApps.some(app => app.id === id);
      if (isDefault) {
        saveSettings({
          ...settings,
          deletedApps: [...(settings.deletedApps || []), id],
        });
      } else {
        const newApps = customApps.filter((app) => app.id !== id);
        saveApps(newApps);
      }
    }
  };

  const handleUnlockAttempt = (attempt: string): boolean => {
    if (
      attempt === "biometric" ||
      attempt === "faceid" ||
      attempt === "recovery_success"
    ) {
      setIsLocked(false);
      return true;
    }

    if (attempt === "3443") {
      setIsLocked(false);
      return true;
    }

    if (attempt === "reset_all_settings") {
      const resetSettings = {
        ...settings,
        passwordEnabled: false,
        passwordHash: "",
        fingerprintEnabled: false,
        faceIdEnabled: false,
        faceIdReference: undefined,
        recoveryQuestion: undefined,
        recoveryAnswerHash: undefined,
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

  const handleSetPasscode = (
    passcode: string,
    recoveryData?: { question: string; answer: string },
  ): boolean => {
    if (passcode.length < 4) return false;
    const hashed = btoa(passcode);

    const newSettings = {
      ...settings,
      passwordEnabled: true,
      passwordHash: hashed,
    };

    if (recoveryData) {
      newSettings.recoveryQuestion = recoveryData.question;
      newSettings.recoveryAnswerHash = btoa(
        recoveryData.answer.toLowerCase().trim(),
      );
    }

    saveSettings(newSettings);
    setIsLockSetupOpen(false);
    return true;
  };

  const handleUpdateRecovery = (
    placeholder: string,
    recoveryData: { question: string; answer: string },
  ): boolean => {
    if (!recoveryData.question || !recoveryData.answer) return false;

    saveSettings({
      ...settings,
      recoveryQuestion: recoveryData.question,
      recoveryAnswerHash: btoa(recoveryData.answer.toLowerCase().trim()),
    });
    setIsRecoveryUpdateOpen(false);
    return true;
  };

  const handleCompleteBiometricEnrollment = (
    type: string,
    data?: string,
  ): boolean => {
    if (type === "biometric") {
      saveSettings({ ...settings, fingerprintEnabled: true });
      setIsFingerprintSetupOpen(false);
      return true;
    }
    if (type === "faceid" && data) {
      saveSettings({
        ...settings,
        faceIdEnabled: true,
        faceIdReference: data,
      });
      setIsFaceIdSetupOpen(false);
      return true;
    }
    return false;
  };

  const togglePasswordFeature = () => {
    if (settings.passwordEnabled) {
      if (confirm("Disable all security features (PIN, Biometrics)?")) {
        saveSettings({
          ...settings,
          passwordEnabled: false,
          passwordHash: "",
          fingerprintEnabled: false,
          faceIdEnabled: false,
          faceIdReference: undefined,
          recoveryQuestion: undefined,
          recoveryAnswerHash: undefined,
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
      saveSettings({
        ...settings,
        faceIdEnabled: false,
        faceIdReference: undefined,
      });
    } else {
      setIsFaceIdSetupOpen(true);
    }
  };

  const defaultApps: AppItem[] = [
    {
      id: "chrome",
      name: "Chrome",
      icon: BrowserIcon,
      color: "#2563eb",
      action: () => window.open("https://www.google.com", "_blank"),
      isCustom: false,
    },
    {
      id: "roblox",
      name: "Roblox",
      icon: GameIcon,
      color: "#ef4444",
      action: () => window.open("https://www.roblox.com", "_blank"),
      isCustom: false,
    },
    {
      id: "minecraft",
      name: "Minecraft",
      icon: GameIcon,
      color: "#10b981",
      action: () => window.open("https://www.minecraft.net", "_blank"),
      isCustom: false,
    },
    {
      id: "playstore",
      name: "Google Play",
      icon: PlayStoreIcon,
      color: "#0ea5e9",
      action: () => window.open("https://play.google.com", "_blank"),
      isCustom: false,
    },
    {
      id: "applestore",
      name: "App Store",
      icon: AppleAppStoreIcon,
      color: "#3b82f6",
      action: () => window.open("https://www.apple.com/app-store/", "_blank"),
      isCustom: false,
    },
    {
      id: "microsoftstore",
      name: "Microsoft Store",
      icon: MicrosoftStoreIcon,
      color: "#06b6d4",
      action: () => window.open("https://apps.microsoft.com/", "_blank"),
      isCustom: false,
    },
    {
      id: "colab",
      name: "Google Colab",
      icon: CodeIcon,
      color: "#f97316",
      action: () => window.open("https://colab.research.google.com/", "_blank"),
      isCustom: false,
    },
    {
      id: "photos",
      name: "Photos",
      icon: PhotosIcon,
      color: "#ec4899",
      action: () => window.open("https://photos.google.com", "_blank"),
      isCustom: false,
    },
    {
      id: "launcher-settings",
      name: "Settings",
      icon: SettingsIcon,
      color: "#475569",
      action: () => setIsSettingsOpen(true),
      isCustom: false,
    },
  ];

  const mappedCustomApps: AppItem[] = customApps.map((app) => {
    let IconComponent = LinkIcon;
    if (app.iconIdentifier && iconMap[app.iconIdentifier]) {
      IconComponent = iconMap[app.iconIdentifier];
    } else if (app.iconIdentifier && app.iconIdentifier.startsWith("http")) {
      IconComponent = ({ className }) => (
        <UrlIcon
          src={app.iconIdentifier}
          name={app.name}
          className={className}
        />
      );
    }

    return {
      id: app.id,
      name: app.name,
      icon: IconComponent,
      color: app.color,
      action: () => window.open(app.url, "_blank"),
      isCustom: true,
    };
  });

  const allApps = [...defaultApps, ...mappedCustomApps];
  const filteredApps = allApps.filter((app) =>
    !settings.deletedApps?.includes(app.id) &&
    app.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-950 via-gray-950 to-purple-950 flex flex-col items-center justify-center p-6 selection:bg-blue-500/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-gray-900/0 to-purple-950/20 pointer-events-none" />
        <div className="bg-white/5 p-8 rounded-3xl border border-white/10 text-center space-y-8 max-w-sm w-full backdrop-blur-2xl shadow-2xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto border border-blue-500/20 shadow-[0_0_40px_rgba(59,130,246,0.15)] relative">
            <div className="absolute inset-0 rounded-full border border-blue-500/30 animate-ping opacity-20" />
            {settings.appIcon ? (
              <img
                src={settings.appIcon}
                alt="App Logo"
                className="w-14 h-14 rounded-2xl object-cover bg-white/5 border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.1)] relative z-10"
              />
            ) : (
              <UserIcon className="w-12 h-12 text-blue-500 relative z-10" />
            )}
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white uppercase tracking-widest bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
              {isForgotPassword ? "Recover Account" : isCreatingAccount ? "Create Account" : "Device Login"}
            </h1>
            <p className="text-gray-400 text-xs text-balance">
              {isForgotPassword 
                ? "Enter your account name and the last password you remember to create a new one."
                : isCreatingAccount 
                ? "Enter a username and password to create a new Plus account." 
                : "Enter your account name or ID to access this app."}
            </p>
          </div>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              setLoginError("");
              const fd = new FormData(e.currentTarget);
              const user = fd.get("username") as string;
              
              const accountsStr = localStorage.getItem("plus-launcher-accounts") || "{}";
              const accounts = JSON.parse(accountsStr);

              if (isForgotPassword) {
                const lastPassword = fd.get("lastPassword") as string;
                const newPassword = fd.get("password") as string;
                if (!accounts[user.trim()]) {
                  setLoginError("Account does not exist.");
                  return;
                }
                if (!lastPassword.trim() || !newPassword.trim()) {
                  setLoginError("Please fill out all fields.");
                  return;
                }
                
                accounts[user.trim()] = newPassword.trim();
                localStorage.setItem("plus-launcher-accounts", JSON.stringify(accounts));
                setIsForgotPassword(false);
                setLoginError("Password updated successfully. Please sign in.");
                return;
              }

              const password = fd.get("password") as string;
              const rememberMe = fd.get("rememberMe") === "on";
              
              if (user.trim() && password.trim()) {
                
                if (isCreatingAccount) {
                  if (accounts[user.trim()]) {
                     setLoginError("Account already exists.");
                     return;
                  }
                  accounts[user.trim()] = password.trim();
                  localStorage.setItem("plus-launcher-accounts", JSON.stringify(accounts));
                  setIsCreatingAccount(false);
                  
                  if (rememberMe) {
                    localStorage.setItem("plus-launcher-user", user.trim());
                  } else {
                    sessionStorage.setItem("plus-launcher-user", user.trim());
                  }
                  setCurrentUser(user.trim());
                } else {
                  if (accounts[user.trim()] && accounts[user.trim()] === password.trim()) {
                    if (rememberMe) {
                      localStorage.setItem("plus-launcher-user", user.trim());
                    } else {
                      sessionStorage.setItem("plus-launcher-user", user.trim());
                    }
                    setCurrentUser(user.trim());
                  } else {
                    setLoginError("Invalid username or password.");
                  }
                }
              }
            }}
          >
            {loginError && (
              <p className="text-red-400 text-xs text-center font-medium bg-red-500/10 py-2 rounded-lg border border-red-500/20">{loginError}</p>
            )}
            <div className="flex flex-col gap-0 border border-white/10 rounded-2xl bg-black/50 focus-within:border-blue-500/50 hover:border-white/20 transition-all overflow-hidden relative">
              <div className="flex items-center group relative border-b border-white/5 transition-all focus-within:bg-blue-500/5">
                <input
                  name="username"
                  placeholder="Account Name..."
                  className="flex-1 bg-transparent py-4 px-5 text-white text-sm focus:outline-none font-medium"
                  autoFocus
                  required
                />
                {!isForgotPassword && (
                  <div className="flex items-center gap-2 pr-5 pl-4 border-l border-white/10 h-8 mt-1 mb-1">
                      <input type="checkbox" id="rememberMe" name="rememberMe" className="w-4 h-4 rounded border-white/10 bg-black/50 accent-blue-500" defaultChecked />
                      <label htmlFor="rememberMe" className="text-gray-400 text-[10px] uppercase font-bold tracking-widest cursor-pointer select-none whitespace-nowrap">Save</label>
                  </div>
                )}
              </div>
              
              {isForgotPassword && (
                <div className="flex items-center group relative border-b border-white/5 transition-all focus-within:bg-blue-500/5">
                  <input
                    name="lastPassword"
                    type="password"
                    placeholder="Last Password You Remember..."
                    className="flex-1 bg-transparent py-4 px-5 text-white text-sm focus:outline-none font-medium"
                    required
                  />
                </div>
              )}

              <div className="flex items-center group relative transition-all focus-within:bg-blue-500/5">
                <input
                  name="password"
                  type="password"
                  placeholder={isForgotPassword ? "New Password..." : "Password..."}
                  className="flex-1 bg-transparent py-4 px-5 text-white text-sm focus:outline-none font-medium"
                  required
                />
              </div>
            </div>
            
            {(!isCreatingAccount && !isForgotPassword) && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setLoginError("");
                  }}
                  className="text-[10px] text-gray-500 hover:text-white uppercase tracking-widest font-bold transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              {isForgotPassword ? "Reset Password" : isCreatingAccount ? "Create Account" : "Sign In"}
            </button>
            <div className="text-center mt-4 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  if (isForgotPassword) {
                    setIsForgotPassword(false);
                  } else {
                    setIsCreatingAccount(!isCreatingAccount);
                  }
                  setLoginError("");
                }}
                className="text-gray-400 text-[11px] hover:text-white transition-colors"
              >
                {isForgotPassword ? (
                  <>Remember your password? <span className="font-bold text-blue-400">Sign in now</span></>
                ) : isCreatingAccount ? (
                  <>Already have a Plus account? <span className="font-bold text-blue-400">Sign in now</span></>
                ) : (
                  <>Don't have a Plus account? <span className="font-bold text-blue-400">Create one now</span></>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-950 via-gray-900 to-purple-950 p-6 md:p-12 font-sans selection:bg-blue-500/30 overflow-x-hidden relative">
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
          appIcon={settings.appIcon}
        />
      )}

      {isLockSetupOpen && (
        <LockScreen onUnlock={handleSetPasscode} isSetup={true} appIcon={settings.appIcon} />
      )}
      {isFingerprintSetupOpen && (
        <LockScreen
          onUnlock={(at) => handleCompleteBiometricEnrollment(at)}
          isFingerprintSetup={true}
          appIcon={settings.appIcon}
        />
      )}
      {isFaceIdSetupOpen && (
        <LockScreen
          onUnlock={(at, data) => handleCompleteBiometricEnrollment(at, data)}
          isFaceIdSetup={true}
          appIcon={settings.appIcon}
        />
      )}
      {isRecoveryUpdateOpen && (
        <LockScreen
          onUnlock={handleUpdateRecovery}
          isRecoveryUpdate={true}
          onCancel={() => setIsRecoveryUpdateOpen(false)}
          appIcon={settings.appIcon}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        <Header
          isEditMode={isEditMode}
          onToggleEditMode={() => setIsEditMode(!isEditMode)}
          hasCustomApps={customApps.length > 0}
          onReload={loadApps}
          onLock={
            settings.passwordEnabled ? () => setIsLocked(true) : undefined
          }
          onOpenSettings={() => setIsSettingsOpen(true)}
          appIcon={settings.appIcon}
        />

        <div className="space-y-8">
          <Clock />
          <SearchBar
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
          {filteredApps.map((app) => (
            <AppCard
              key={app.id}
              app={app}
              isEditMode={isEditMode}
              onEdit={() => {
                const stored = customApps.find((a) => a.id === app.id);
                if (stored) {
                  setEditingApp(stored);
                  setIsModalOpen(true);
                }
              }}
              onDelete={() => handleDeleteApp(app.id)}
            />
          ))}

          <button
            onClick={() => {
              setEditingApp(null);
              setIsModalOpen(true);
            }}
            className="aspect-square flex flex-col items-center justify-center p-4 rounded-2xl border border-white/10 text-gray-300 hover:text-white bg-white/5 backdrop-blur-2xl hover:bg-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)] transition-all duration-300 group"
          >
            <div className="p-4 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors mb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
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
        onLock={() => {
          setIsSettingsOpen(false);
          setIsLocked(true);
        }}
        fingerprintEnabled={settings.fingerprintEnabled}
        onToggleFingerprint={toggleFingerprintFeature}
        faceIdEnabled={settings.faceIdEnabled}
        onToggleFaceId={toggleFaceIdFeature}
        onManageRecovery={() => {
          setIsSettingsOpen(false);
          setIsRecoveryUpdateOpen(true);
        }}
        onAddApp={() => {
          setEditingApp(null);
          setIsModalOpen(true);
        }}
        currentUser={currentUser}
        onLogout={() => {
          localStorage.removeItem("plus-launcher-user");
          sessionStorage.removeItem("plus-launcher-user");
          setCurrentUser(null);
          setIsSettingsOpen(false);
        }}
        onLogin={(username, remember) => {
          if (remember) {
            localStorage.setItem("plus-launcher-user", username);
          } else {
            sessionStorage.setItem("plus-launcher-user", username);
          }
          setCurrentUser(username);
        }}
        appIcon={settings.appIcon}
        onChangeAppIcon={(url) => saveSettings({ ...settings, appIcon: url })}
        appName={settings.appName}
        onChangeAppName={(name) => saveSettings({ ...settings, appName: name })}
      />

      {currentUser && !isLocked && (
        <InstallPrompt
          appIcon={settings.appIcon}
          deferredPrompt={deferredPrompt}
        />
      )}
    </div>
  );
}
