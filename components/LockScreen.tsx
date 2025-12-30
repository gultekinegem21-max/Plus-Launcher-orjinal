
import React, { useState, useEffect } from 'react';
import Clock from './Clock';
import { LockIcon, ShieldCheckIcon } from './Icons';

interface LockScreenProps {
  onUnlock: (password: string) => boolean;
  isSetup?: boolean;
}

const LockScreen: React.FC<LockScreenProps> = ({ onUnlock, isSetup }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleKeypad = (num: string) => {
    if (input.length < 8) {
      setInput(prev => prev + num);
      setError(false);
    }
  };

  const handleBackspace = () => {
    setInput(prev => prev.slice(0, -1));
    setError(false);
  };

  const handleUnlock = () => {
    const isValid = onUnlock(input);
    if (isValid) {
      setSuccess(true);
    } else {
      setError(true);
      setTimeout(() => setInput(''), 300);
    }
  };

  // Auto-attempt unlock if input is at least 4 chars and the enter button is usually pressed
  useEffect(() => {
    if (!isSetup && input.length >= 4 && input.length <= 8) {
        // Optional: you could auto-check here, but for security feel it's better to hit enter
    }
  }, [input, isSetup]);

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900/80 backdrop-blur-3xl flex flex-col items-center justify-center p-4">
      {/* Clock - More responsive positioning */}
      <div className="mb-4 sm:mb-8 scale-75 sm:scale-100">
        <Clock />
      </div>

      <div className={`w-full max-w-[260px] space-y-4 sm:space-y-6 transition-all duration-300 ${error ? 'animate-wiggle' : ''} ${success ? 'scale-110 opacity-0' : 'opacity-100'}`}>
        <div className="flex flex-col items-center gap-1 sm:gap-2">
          <div className="p-2.5 rounded-full bg-blue-500/20 text-blue-400">
            {isSetup ? <ShieldCheckIcon className="w-6 h-6 sm:w-8 sm:h-8" /> : <LockIcon className="w-6 h-6 sm:w-8 sm:h-8" />}
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white">
            {isSetup ? 'Set Passcode' : 'Launcher Locked'}
          </h2>
          <p className="text-gray-400 text-[10px] sm:text-xs text-center px-4">
            {isSetup ? 'Enter 4-8 digits' : 'Enter your passcode'}
          </p>
        </div>

        {/* Pin Display */}
        <div className="flex justify-center gap-2 sm:gap-3 h-6">
          {Array.from({ length: Math.max(input.length, 4) }).map((_, i) => (
            <div 
              key={i} 
              className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 transition-all duration-200 ${
                i < input.length 
                  ? 'bg-white border-white scale-110' 
                  : 'border-gray-600 bg-transparent'
              }`} 
            />
          ))}
        </div>

        {/* Compact Keypad - Optimized for Visibility */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeypad(num.toString())}
              className="aspect-square rounded-full bg-gray-800/60 hover:bg-gray-700 text-white text-xl sm:text-2xl font-semibold transition-all border border-gray-700/50 flex items-center justify-center active:scale-90 shadow-sm"
            >
              {num}
            </button>
          ))}
          <button 
            type="button"
            onClick={handleBackspace} 
            className="aspect-square flex items-center justify-center text-gray-500 hover:text-white transition-colors active:scale-90"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.37-6.37a2.25 2.25 0 010-3.18l6.37-6.37A2.25 2.25 0 0110.47 2.25h10.28c1.242 0 2.25 1.008 2.25 2.25v15a2.25 2.25 0 01-2.25 2.25H10.47a2.25 2.25 0 01-1.47-.58z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => handleKeypad('0')}
            className="aspect-square rounded-full bg-gray-800/60 hover:bg-gray-700 text-white text-xl sm:text-2xl font-semibold transition-all border border-gray-700/50 flex items-center justify-center active:scale-90 shadow-sm"
          >
            0
          </button>
          <button 
            type="button"
            onClick={handleUnlock} 
            disabled={input.length < 4}
            className="aspect-square flex items-center justify-center rounded-full bg-blue-600/40 text-blue-400 hover:bg-blue-600 hover:text-white transition-all border border-blue-500/40 active:scale-95 disabled:opacity-5 disabled:grayscale"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LockScreen;
