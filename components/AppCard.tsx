
import React from 'react';
import type { AppItem } from '../types';
import { PencilIcon, TrashIcon } from './Icons';

interface AppCardProps {
  app: AppItem;
  isEditMode?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

const AppCard: React.FC<AppCardProps> = ({ app, isEditMode, onEdit, onDelete }) => {
  const Icon = app.icon;

  const handleAction = (e: React.MouseEvent) => {
    // Only block the action if it is NOT the settings app and we are in edit mode.
    // This allows the "Launcher Settings" app to still work so you can exit edit mode.
    if (isEditMode && app.id !== 'launcher-settings') {
      e.preventDefault();
      return;
    }
    app.action();
  }

  // Apply wiggle animation only to apps that can be deleted when in edit mode
  const animationClass = isEditMode && app.id !== 'launcher-settings' ? 'animate-wiggle' : '';

  return (
    <div className={`relative ${animationClass}`}>
      <button
        onClick={handleAction}
        className={`group aspect-square w-full flex flex-col items-center justify-center p-1 sm:p-2 bg-white/5 backdrop-blur-2xl rounded-xl border border-white/10 text-white shadow-[0_4px_30px_rgba(0,0,0,0.1)] transition-all duration-300 ease-in-out hover:bg-white/10 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${isEditMode && app.id === 'launcher-settings' ? 'opacity-50 hover:translate-y-0 cursor-pointer' : ''}`}
        style={{ '--app-color': app.color } as React.CSSProperties}
        aria-label={app.name}
      >
        <div className="p-1 sm:p-2 rounded-xl transition-colors duration-300" style={{ backgroundColor: `${app.color}20` }}>
          <Icon className="h-4 w-4 sm:h-6 sm:w-6 transition-transform duration-300 group-hover:scale-110" style={{ color: app.color }} />
        </div>
        <span className="mt-2 text-[9px] sm:text-[10px] font-medium text-gray-400 group-hover:text-white transition-colors duration-300">{app.name}</span>
      </button>
      {isEditMode && app.id !== 'launcher-settings' && (
        <div className="absolute -top-2 -right-2 flex gap-1 p-1 z-10">
          {app.isCustom && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
              className="p-2 bg-gray-800 border border-gray-600 rounded-full text-blue-400 hover:text-white hover:bg-blue-600 transition-colors shadow-lg"
              aria-label={`Edit ${app.name}`}
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
            className="p-2 bg-gray-800 border border-gray-600 rounded-full text-red-400 hover:text-white hover:bg-red-600 transition-colors shadow-lg"
            aria-label={`Delete ${app.name}`}
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AppCard;
