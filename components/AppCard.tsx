
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
    // Only block the action if it is a CUSTOM app and we are in edit mode.
    // This allows default apps (like "Launcher Settings") to still work so you can exit edit mode.
    if (isEditMode && app.isCustom) {
      e.preventDefault();
      return;
    }
    app.action();
  }

  // Apply wiggle animation only to custom apps when in edit mode
  const animationClass = isEditMode && app.isCustom ? 'animate-wiggle' : '';

  return (
    <div className={`relative ${animationClass}`}>
      <button
        onClick={handleAction}
        className={`group aspect-square w-full flex flex-col items-center justify-center p-2 sm:p-4 bg-gray-800/40 backdrop-blur-lg rounded-2xl border border-gray-700/50 text-white transition-all duration-300 ease-in-out hover:bg-gray-700/60 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${isEditMode && !app.isCustom ? 'opacity-50 hover:translate-y-0 cursor-pointer' : ''}`}
        style={{ '--app-color': app.color } as React.CSSProperties}
        aria-label={app.name}
      >
        <div className="p-3 sm:p-4 rounded-xl transition-colors duration-300" style={{ backgroundColor: `${app.color}20` }}>
          <Icon className="h-8 w-8 sm:h-10 sm:w-10 transition-transform duration-300 group-hover:scale-110" style={{ color: app.color }} />
        </div>
        <span className="mt-2 text-xs sm:text-sm font-medium text-gray-300 group-hover:text-white transition-colors duration-300">{app.name}</span>
      </button>
      {isEditMode && app.isCustom && (
        <div className="absolute -top-2 -right-2 flex gap-1 p-1 z-10">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
            className="p-2 bg-gray-800 border border-gray-600 rounded-full text-blue-400 hover:text-white hover:bg-blue-600 transition-colors shadow-lg"
            aria-label={`Edit ${app.name}`}
          >
            <PencilIcon className="h-4 w-4" />
          </button>
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
