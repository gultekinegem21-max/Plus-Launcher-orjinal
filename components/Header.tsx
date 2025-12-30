
import React, { useState, useEffect } from 'react';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

interface HeaderProps {
    isEditMode: boolean;
    onToggleEditMode: () => void;
    hasCustomApps: boolean;
    onReload?: () => void;
    onLock?: () => void;
}

const Header: React.FC<HeaderProps> = ({ isEditMode, onToggleEditMode, hasCustomApps, onReload, onLock }) => {
  const [greeting, setGreeting] = useState(getGreeting());

  useEffect(() => {
    const timerId = setInterval(() => {
      setGreeting(getGreeting());
    }, 60000); // Update every minute
    return () => clearInterval(timerId);
  }, []);

  return (
    <header className="flex justify-between items-center text-white">
        <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">Plus<span className="text-blue-500">+</span>Launcher</h1>
            <div className="flex items-center gap-2">
                {hasCustomApps && (
                    <button 
                        onClick={onToggleEditMode} 
                        className={`text-sm px-3 py-1 rounded-md transition-colors ${isEditMode ? 'bg-blue-600 text-white' : 'bg-gray-700/50 hover:bg-gray-700'}`}
                    >
                        {isEditMode ? 'Done' : 'Edit'}
                    </button>
                )}
                {onLock && (
                   <button 
                       onClick={onLock}
                       className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full transition-all"
                       title="Lock Launcher"
                   >
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                       </svg>
                   </button>
                )}
                {onReload && (
                   <button 
                       onClick={onReload}
                       className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full transition-all"
                       title="Reload apps"
                   >
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                       </svg>
                   </button>
                )}
            </div>
        </div>
      <p className="text-md text-gray-300 hidden sm:block">{greeting}</p>
    </header>
  );
};

export default Header;
