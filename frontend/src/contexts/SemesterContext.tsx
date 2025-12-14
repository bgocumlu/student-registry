import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { settingsApi } from '@/services/api';

interface SemesterContextType {
  currentSemester: string;
  setCurrentSemester: (semester: string) => void;
}

const SemesterContext = createContext<SemesterContextType | undefined>(undefined);

export function SemesterProvider({ children }: { children: ReactNode }) {
  const [currentSemester, setCurrentSemester] = useState('2025-Spring');

  // Fetch current semester from backend on mount
  useEffect(() => {
    const fetchCurrentSemester = async () => {
      try {
        const setting = await settingsApi.getCurrentSemester();
        if (setting && setting.value) {
          setCurrentSemester(setting.value);
        }
      } catch (error: any) {
        // If setting doesn't exist (404), use default
        // Other errors are logged but don't prevent the app from loading
        if (error.status !== 404 && error.message && !error.message.includes('404')) {
          console.error('Error fetching current semester:', error);
        }
      }
    };
    fetchCurrentSemester();
  }, []);

  return (
    <SemesterContext.Provider value={{ currentSemester, setCurrentSemester }}>
      {children}
    </SemesterContext.Provider>
  );
}

export function useSemester() {
  const context = useContext(SemesterContext);
  if (!context) {
    throw new Error('useSemester must be used within SemesterProvider');
  }
  return context;
}
