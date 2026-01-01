import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, Direction, translations } from '../locales';

interface SettingsContextProps {
  language: Language;
  direction: Direction;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['en']) => string;
}

const SettingsContext = createContext<SettingsContextProps | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLangState] = useState<Language>('en');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  useEffect(() => {
    // Load persisted settings
    const savedLang = localStorage.getItem('sea_sed_lang') as Language;
    if (savedLang && translations[savedLang]) {
      setLangState(savedLang);
    }

    const savedTheme = localStorage.getItem('sea_sed_theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLangState(lang);
    localStorage.setItem('sea_sed_lang', lang);
  };

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('sea_sed_theme', newMode ? 'dark' : 'light');
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const direction: Direction = (language === 'he' || language === 'ar') ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
  }, [direction, language]);

  const t = (key: keyof typeof translations['en']) => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <SettingsContext.Provider value={{ language, direction, isDarkMode, toggleTheme, setLanguage, t }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};