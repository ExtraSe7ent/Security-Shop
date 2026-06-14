import { createContext, useContext, useState, useEffect } from 'react';
import { modeAPI } from '../api';

const ModeContext = createContext(null);

export function ModeProvider({ children }) {
  const [mode, setMode] = useState('base'); // 'base' or 'secure'
  const [loading, setLoading] = useState(false);

  // Fetch initial mode from backend
  useEffect(() => {
    modeAPI.getMode()
      .then(res => setMode(res.data.mode))
      .catch(() => setMode('base'));
  }, []);

  const toggleMode = async () => {
    const newMode = mode === 'base' ? 'secure' : 'base';
    setLoading(true);
    try {
      await modeAPI.setMode(newMode);
      setMode(newMode);
    } catch (err) {
      console.error('Failed to toggle mode:', err);
    } finally {
      setLoading(false);
    }
  };

  const isSecure = mode === 'secure';

  return (
    <ModeContext.Provider value={{ mode, isSecure, loading, toggleMode }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useMode must be used within a ModeProvider');
  }
  return context;
}
