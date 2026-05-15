import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, UploadCloud, ChevronRight, Shield, Zap, Users, Award } from 'lucide-react';
import { useLang } from '../context/LangContext';
import Header from '../components/Header';

export default function Landing() {
  const navigate = useNavigate();
  const { t } = useLang();

  const features = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Clinically Inspired",
      description: "Built with dental professionals for accurate AI analysis"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Instant Results",
      description: "Get comprehensive analysis in seconds, not days"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "For Everyone",
      description: "Accessible dental care insights for all demographics"
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Research Grade",
      description: "Powered by advanced YOLOv8 computer vision models"
    }
  ];

  return (
    <div className="min-h-screen w-full relative bg-gradient-to-br from-slate-50 via-white to-cyan-50 overflow-hidden font-sans">
      {/* Enhanced Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(6,182,212,0.1),transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(20,184,166,0.1),transparent_50%)]" />
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `radial-gradient(circle, #cbd5e1 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
        {/* Triangles and connected dots background */}
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="triangles" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <polygon points="50,10 90,90 10,90" fill="none" stroke="#06b6d4" strokeWidth="0.5" />
              <circle cx="50" cy="10" r="2" fill="#06b6d4" />
              <circle cx="90" cy="90" r="2" fill="#06b6d4" />
              <circle cx="10" cy="90" r="2" fill="#06b6d4" />
              <line x1="50" y1="10" x2="90" y2="90" stroke="#06b6d4" strokeWidth="0.5" />
              <line x1="90" y1="90" x2="10" y2="90" stroke="#06b6d4" strokeWidth="0.5" />
              <line x1="10" y1="90" x2="50" y2="10" stroke="#06b6d4" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#triangles)" />
        </svg>
      </div>

      <div className="relative z-10">
        <Header />

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-100 text-cyan-700 rounded-full text-sm font-medium mb-8">
              <Award size={16} />
              AI-Powered Dental Diagnostics
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 tracking-tight leading-tight">
              {t('hero_title')} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-600">
                {t('hero_subtitle')}
              </span>
            </h1>

            <p className="text-slate-600 text-xl max-w-3xl mx-auto font-medium leading-relaxed mb-12">
              {t('hero_desc')}
            </p>

            {/* 3D Spinning Tooth */}
            <div className="flex justify-center mb-12">
              <div className="relative w-32 h-32">
                <div className="absolute inset-0 animate-spin-slow">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-cyan-600 opacity-80">
                    <path d="M50 10 L70 30 L70 50 L60 60 L60 80 L40 80 L40 60 L30 50 L30 30 Z" fill="currentColor" />
                    <circle cx="50" cy="45" r="5" fill="white" />
                  </svg>
                </div>
                <div className="absolute inset-0 animate-spin-reverse-slow">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-teal-600 opacity-60">
                    <path d="M45 15 L65 35 L65 55 L55 65 L55 85 L35 85 L35 65 L25 55 L25 35 Z" fill="currentColor" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/selfie')}
                className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
              >
                <Camera size={20} />
                Start Free Analysis
              </button>
              <button
                onClick={() => navigate('/xray')}
                className="px-8 py-4 bg-white text-slate-700 font-bold rounded-xl border-2 border-slate-200 hover:border-slate-300 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
              >
                <UploadCloud size={20} />
                Upload X-Ray
              </button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-sm border border-slate-200/60 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl flex items-center justify-center text-white mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{feature.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Main Action Cards */}
          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div
              onClick={() => navigate('/selfie')}
              className="group bg-white/90 backdrop-blur-xl border border-slate-200/60 p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer hover:-translate-y-2"
            >
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-lg">
                  <Camera size={32} strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-slate-800 mb-3 group-hover:text-cyan-600 transition-colors">
                    {t('selfie_title')}
                  </h2>
                  <p className="text-slate-600 text-lg leading-relaxed mb-6">
                    {t('selfie_desc')}
                  </p>
                  <div className="inline-flex items-center gap-2 text-cyan-600 font-semibold text-lg group-hover:gap-3 transition-all">
                    {t('selfie_cta')}
                    <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>

            <div
              onClick={() => navigate('/xray')}
              className="group bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer hover:-translate-y-2"
            >
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-lg">
                  <UploadCloud size={32} strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-3 group-hover:text-teal-300 transition-colors">
                    {t('xray_title')}
                  </h2>
                  <p className="text-slate-300 text-lg leading-relaxed mb-6">
                    {t('xray_desc')}
                  </p>
                  <div className="inline-flex items-center gap-2 text-teal-300 font-semibold text-lg group-hover:gap-3 transition-all">
                    {t('xray_cta')}
                    <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="text-center mt-16">
            <p className="text-slate-500 text-sm mb-4">Trusted by dental professionals worldwide</p>
            <div className="flex justify-center items-center gap-8 opacity-60">
              <div className="text-2xl">🏥</div>
              <div className="text-2xl">🦷</div>
              <div className="text-2xl">🔬</div>
              <div className="text-2xl">⚕️</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}