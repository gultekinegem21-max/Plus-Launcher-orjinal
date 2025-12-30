import React, { useState, useEffect } from 'react';
import { iconMap, LinkIcon } from './Icons';
import type { StoredApp } from '../types';

interface AddAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (app: StoredApp) => void;
  appToEdit: StoredApp | null;
}

const colors = ['#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#22c55e', '#64748b', '#f59e0b', '#06b6d4', '#d946ef', '#14b8a6'];
const iconNames = Object.keys(iconMap).filter(name => !['PencilIcon', 'TrashIcon'].includes(name));

const AddAppModal: React.FC<AddAppModalProps> = ({ isOpen, onClose, onSave, appToEdit }) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(iconNames[0]);
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [useFavicon, setUseFavicon] = useState(true);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);

  const isEditing = !!appToEdit;

  // Debounce favicon fetching
  useEffect(() => {
    if (!useFavicon || !url.trim()) {
      setFaviconUrl(null);
      return;
    }
    
    const handler = setTimeout(() => {
      try {
        const fullUrl = url.startsWith('http') ? url : `https://${url}`;
        const hostname = new URL(fullUrl).hostname;
        if (hostname) {
          setFaviconUrl(`https://www.google.com/s2/favicons?domain=${hostname}&sz=128`);
        } else {
          setFaviconUrl(null);
        }
      } catch (e) {
        setFaviconUrl(null);
      }
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [url, useFavicon]);

  useEffect(() => {
    if (isOpen) {
      if (appToEdit) {
        setName(appToEdit.name);
        setUrl(appToEdit.url);
        setSelectedColor(appToEdit.color);
        const isUrlIcon = appToEdit.iconIdentifier?.startsWith('http');
        setUseFavicon(isUrlIcon);
        if (isUrlIcon) {
          setSelectedIcon(iconNames[0]);
        } else {
          setSelectedIcon(appToEdit.iconIdentifier);
        }
      } else {
        setName('');
        setUrl('');
        setSelectedIcon(iconNames[0]);
        setSelectedColor(colors[0]);
        setUseFavicon(true);
      }
    }
  }, [isOpen, appToEdit]);
  
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    const formattedUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    
    const finalIconIdentifier = useFavicon && faviconUrl ? faviconUrl : selectedIcon;

    onSave({
      id: appToEdit?.id || Date.now().toString(),
      name,
      url: formattedUrl,
      iconIdentifier: finalIconIdentifier,
      color: selectedColor,
    });
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-app-title"
    >
      <div 
        className="bg-gray-800/80 border border-gray-700 rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors" aria-label="Close dialog">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 id="add-app-title" className="text-xl sm:text-2xl font-bold text-white mb-6">
          {isEditing ? 'Edit App' : 'Add Custom App'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="appName" className="block text-sm font-medium text-gray-300 mb-2">App Name</label>
            <input
              id="appName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., My Portfolio"
              required
              className="w-full bg-gray-900/50 text-white placeholder-gray-500 border border-gray-600 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="appUrl" className="block text-sm font-medium text-gray-300 mb-2">App URL</label>
            <input
              id="appUrl"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g., your-website.com"
              required
              className="w-full bg-gray-900/50 text-white placeholder-gray-500 border border-gray-600 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-300">Icon</span>
                 <button type="button" onClick={() => setUseFavicon(!useFavicon)} className="text-sm text-blue-400 hover:text-blue-300">
                    {useFavicon ? 'Choose an icon instead' : 'Use website icon'}
                 </button>
            </div>

            {useFavicon ? (
                <div className="bg-gray-900/50 p-3 rounded-lg flex items-center gap-4">
                    <div className="w-12 h-12 flex-shrink-0 bg-gray-700 rounded-lg flex items-center justify-center">
                        {faviconUrl ? (
                            <img src={faviconUrl} alt="Favicon preview" className="w-8 h-8 rounded-md" />
                        ) : (
                            <LinkIcon className="w-8 h-8 text-gray-400" />
                        )}
                    </div>
                    <div>
                        <p className="text-white font-medium">Website Icon (Favicon)</p>
                        <p className="text-xs text-gray-400">Automatically uses the site's icon.</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-6 gap-2 bg-gray-900/50 p-2 rounded-lg">
                {iconNames.map(iconName => {
                    const Icon = iconMap[iconName];
                    return (
                    <button type="button" key={iconName} onClick={() => setSelectedIcon(iconName)} className={`aspect-square flex items-center justify-center rounded-md transition-all ${selectedIcon === iconName ? 'ring-2 ring-blue-500 bg-blue-500/20' : 'hover:bg-gray-700'}`}>
                        <Icon className="h-6 w-6" style={{ color: selectedColor }} />
                    </button>
                    );
                })}
                </div>
            )}
          </div>
          
          <div>
            <span className="block text-sm font-medium text-gray-300 mb-2">Color</span>
            <div className="grid grid-cols-6 gap-2">
              {colors.map(color => (
                <button type="button" key={color} onClick={() => setSelectedColor(color)} className={`aspect-square rounded-full transition-all ${selectedColor === color ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-white' : ''}`} style={{ backgroundColor: color }} aria-label={`Select color ${color}`}></button>
              ))}
            </div>
          </div>
          <div className="pt-2">
            <button type="submit" disabled={!name.trim() || !url.trim()} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed">
              {isEditing ? 'Save Changes' : 'Add App'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAppModal;