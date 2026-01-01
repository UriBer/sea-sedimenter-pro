import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { translations, Language, Direction } from '../locales';

interface SettingsContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  direction: Direction;
  t: (key: string) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    // Load persisted settings
    const savedLang = localStorage.getItem('sea_sed_lang') as Language;
    if (savedLang && ['en', 'he', 'ar', 'ru'].includes(savedLang)) {
      setLanguage(savedLang);
    }
    const savedTheme = localStorage.getItem('sea_sed_theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('sea_sed_lang', lang);
    const dir = (lang === 'he' || lang === 'ar') ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  };

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('sea_sed_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('sea_sed_theme', 'light');
      }
      return next;
    });
  };

  const t = (key: string): string => {
    const dict = translations[language] || translations['en'];
    // @ts-ignore
    return dict[key] || key;
  };

  const direction: Direction = (language === 'he' || language === 'ar') ? 'rtl' : 'ltr';

  return (
    <SettingsContext.Provider value={{ 
      isDarkMode, 
      toggleTheme, 
      language, 
      setLanguage: handleSetLanguage, 
      direction, 
      t 
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within SettingsProvider");
  return context;
};