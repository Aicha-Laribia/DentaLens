/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';

// 1. THE DICTIONARY (Zero external libraries)
const translations = {
  en: {
    "brand": "DentaLens",
    "tagline": "AI Diagnostics",
    "hero_title": "Smart Dental",
    "hero_subtitle": "Care for Everyone.",
    "hero_desc": "AI-powered diagnostics and professional triage. Designed for accuracy, built for people.",
    "selfie_title": "Selfie Triage",
    "selfie_desc": "Instant analysis of your smile to detect urgency, gum health, and visible pathologies.",
    "selfie_cta": "Start Scan",
    "xray_title": "X-Ray Scan",
    "xray_desc": "Upload clinical radiographs for detailed YOLOv8-powered bounding box detection.",
    "xray_cta": "Upload X-Ray",
    "footer_disclaimer": "⚠️ Demo prototype — not a clinical tool"
  },
  fr: {
    "brand": "DentaLens",
    "tagline": "Diagnostics IA",
    "hero_title": "Soins Dentaires",
    "hero_subtitle": "Intelligents pour tous.",
    "hero_desc": "Diagnostics par IA et triage professionnel. Conçu pour la précision, pensé pour les patients.",
    "selfie_title": "Triage Selfie",
    "selfie_desc": "Analyse instantanée de votre sourire pour détecter l'urgence, la santé des gencives et les pathologies visibles.",
    "selfie_cta": "Commencer",
    "xray_title": "Radiographie",
    "xray_desc": "Uploadez vos radiographies cliniques pour une détection YOLOv8 avec coordonnées.",
    "xray_cta": "Uploader la radio",
    "footer_disclaimer": "⚠️ Prototype de démonstration — pas un outil clinique"
  },
  ar: {
    "brand": "دنتالنز",
    "tagline": "تشخيص بالذكاء الاصطناعي",
    "hero_title": "رعاية أسنان",
    "hero_subtitle": "ذكية للجميع.",
    "hero_desc": "تشخيص دقيق بالذكاء الاصطناعي وفرز احترافي. مصمم للدقة، مبني من أجل الناس.",
    "selfie_title": "فرز بالسيلفي",
    "selfie_desc": "تحليل فوري لابتسامتك للكشف عن الأمراض وصحة اللثة والحالات المرئية.",
    "selfie_cta": "ابدأ الفحص",
    "xray_title": "تصوير بالأشعة",
    "xray_desc": "ارفع صورة الأشعة السينية لتحليل دقيق بتقنية YOLOv8.",
    "xray_cta": "رفع الأشعة",
    "footer_disclaimer": "⚠️ نموذج تجريبي — ليس أداة سريرية"
  }
};

const LangContext = createContext();

export function LangProvider({ children }) {
  const [lang, setLang] = useState('en');

  // Our custom, unbreakable translation function
  const t = (key) => {
    if (!translations[lang]) return key;
    return translations[lang][key] || key;
  };

  const changeLang = (l) => {
    setLang(l);
  };

  // Handle RTL dynamically on the body/html level
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, changeLang, t }}>
      <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="w-full h-full">
        {children}
      </div>
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
