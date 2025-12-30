
import React, { useState, useEffect } from 'react';

const Clock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  };

  return (
    <div className="text-center text-white">
      <h1 className="text-6xl md:text-8xl font-bold tracking-tight">{formatTime(time)}</h1>
      <p className="text-md md:text-lg text-gray-400 mt-1">{formatDate(time)}</p>
    </div>
  );
};

export default Clock;
