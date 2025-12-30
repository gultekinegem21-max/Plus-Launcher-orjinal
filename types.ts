
import type React from 'react';

export interface AppItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  action: () => void;
  isCustom?: boolean;
}

export interface StoredApp {
  id: string;
  name: string;
  url: string;
  iconIdentifier: string; // Can be a key from iconMap or a URL for a favicon
  color: string;
}

export interface LauncherSettings {
  passwordEnabled: boolean;
  passwordHash: string;
}
