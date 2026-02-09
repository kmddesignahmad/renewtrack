import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Lang, t, TranslationKey } from './i18n';

interface LangContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
  dir: 'ltr' | 'rtl';
}

const LangContext = createContext<LangContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
  dir: 'ltr',
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = document.cookie.match(/(?:^|; )rt_lang=([^;]*)/);
    return (saved ? decodeURIComponent(saved[1]) : 'en') as Lang;
  });

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `rt_lang=${newLang}; expires=${expires}; path=/; SameSite=Strict`;
  };

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [lang, dir]);

  return (
    <LangContext.Provider value={{ lang, setLang, t: (key) => t(lang, key), dir }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
