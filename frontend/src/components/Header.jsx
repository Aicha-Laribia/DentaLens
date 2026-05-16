import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { Globe, ChevronDown, Check } from 'lucide-react';

export default function Header() {
  const navigate = useNavigate();
  const { lang, changeLang, t } = useLang();
  const [isLangOpen, setIsLangOpen] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' }
  ];

  const currentLang = languages.find(l => l.code === lang);

  return (
    <header className="flex justify-between items-center px-6 py-4 bg-white/95 backdrop-blur-xl shadow-sm sticky top-0 z-50 border-b border-slate-200/60">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-3 group transition-all duration-300 hover:scale-105"
      >
        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
          <span className="text-white font-bold text-lg">🦷</span>
        </div>
        <div className="flex flex-col text-left">
          <span className="text-xl font-bold tracking-tight text-slate-800 leading-none group-hover:text-cyan-600 transition-colors">
            {t('brand')}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mt-0.5">
            {t('tagline')}
          </span>
        </div>
      </button>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full">
          <span className="text-xs text-amber-700 font-medium">⚠️ Demo Version</span>
        </div>

        {/* Enhanced Language Switcher */}
        <div className="relative">
          <button
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all duration-200 hover:shadow-md"
          >
            <Globe size={16} className="text-slate-600" />
            <span className="text-sm font-medium text-slate-700">
              {currentLang?.flag} {currentLang?.name}
            </span>
            <ChevronDown
              size={14}
              className={`text-slate-500 transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isLangOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsLangOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-2">
                {languages.map((language) => (
                  <button
                    key={language.code}
                    onClick={() => {
                      changeLang(language.code);
                      setIsLangOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors ${
                      lang === language.code ? 'bg-cyan-50 text-cyan-700' : 'text-slate-700'
                    }`}
                  >
                    <span className="text-lg">{language.flag}</span>
                    <span className="text-sm font-medium">{language.name}</span>
                    {lang === language.code && (
                      <Check size={16} className="text-cyan-600 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
