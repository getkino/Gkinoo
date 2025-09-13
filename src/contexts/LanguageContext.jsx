import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const translations = {
  tr: {
    home: 'Ana Sayfa',
    categories: 'Kategoriler',
    platforms: 'Platformlar',
    favorites: 'Favoriler',
    movies: 'Filmler',
    settings: 'Ayarlar',
    language: 'Dil',
    turkish: 'Türkçe',
    english: 'İngilizce'
  },
  en: {
    home: 'Home',
    categories: 'Categories',
    platforms: 'Platforms',
    favorites: 'Favorites',
    movies: 'Movies',
    settings: 'Settings',
    language: 'Language',
    turkish: 'Turkish',
    english: 'English'
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'tr';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
