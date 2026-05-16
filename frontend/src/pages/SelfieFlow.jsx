import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, UploadCloud, Lightbulb, CheckCircle, AlertCircle } from 'lucide-react';
import { useLang } from '../context/LangContext';
import Header from '../components/Header';
import axios from 'axios';

export default function SelfieFlow() {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();
  const navigate = useNavigate();
  const { t } = useLang();

  const handleFile = async (file) => {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setLoading(true);
    setError('');

    try {
      const form = new FormData();
      form.append('image', file);

      // Appel à notre backend FastAPI (le Mock de 2 secondes)
      const res = await axios.post('http://localhost:8000/selfie-triage', form);
      
      // On redirige vers la page de résultats avec les données
      navigate('/selfie/results', {
        state: { 
          result: res.data, 
          imageUrl: URL.createObjectURL(file) 
        }
      });
    } catch (err) {
      console.error(err);
      setError('Analysis failed. Please try again with a clear photo.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
        <div className="max-w-2xl w-full">

          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-100 text-cyan-700 rounded-full text-sm font-medium mb-6">
              <Camera size={16} />
              Selfie Analysis
            </div>
            <h2 className="text-4xl font-black text-slate-800 mb-3 tracking-tight">
              {t('selfie_title')}
            </h2>
            <p className="text-slate-600 text-lg max-w-md mx-auto leading-relaxed">
              Take a clear photo of your teeth using your phone's flashlight for the best AI analysis.
            </p>
          </div>

          {/* Tips Section */}
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 p-6 rounded-2xl shadow-lg mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="text-amber-500" size={20} />
              <h3 className="text-lg font-bold text-slate-800">Tips for Best Results</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                "Use good lighting - turn on your phone's flashlight",
                "Open your mouth slightly to show your teeth clearly",
                "Hold your phone steady and focus on your smile",
                "Make sure your face and teeth are fully visible"
              ].map((tip, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-600">{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upload Zone */}
          {!loading ? (
            <div className="space-y-4">
              <div
                className="w-full border-2 border-dashed border-cyan-300 bg-white/80 backdrop-blur-md rounded-3xl p-8 text-center cursor-pointer hover:border-cyan-500 hover:bg-cyan-50/50 transition-all shadow-xl shadow-cyan-100/50 group"
                onClick={() => fileRef.current.click()}
              >
                {preview ? (
                  <div className="space-y-4">
                    <img src={preview} alt="preview" className="w-full max-w-sm mx-auto h-64 object-cover rounded-2xl shadow-sm" />
                    <div className="flex items-center justify-center gap-2 text-cyan-600 font-semibold">
                      <Camera size={20} />
                      Retake Photo
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-teal-600 text-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                      <Camera size={40} strokeWidth={1.5} />
                    </div>
                    <p className="text-slate-700 font-bold text-2xl mb-2">Tap to take a photo</p>
                    <p className="text-slate-500">or upload from gallery</p>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={e => handleFile(e.target.files[0])}
                />
              </div>

              {/* Alternative Upload Button */}
              <div className="text-center">
                <button
                  onClick={() => fileRef.current.click()}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
                >
                  <UploadCloud size={18} />
                  Upload from Gallery
                </button>
              </div>
            </div>
          ) : (
            /* Enhanced Loading Animation */
            <div className="flex flex-col items-center gap-8 mt-10">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <div className="absolute inset-0 border-4 border-cyan-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-4 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-full flex items-center justify-center">
                  <span className="text-2xl animate-pulse">🦷</span>
                </div>
              </div>

              <div className="text-center space-y-2">
                <p className="text-slate-700 font-bold text-xl animate-pulse">
                  AI is analyzing your photo...
                </p>
                <p className="text-slate-500 text-sm">
                  This usually takes 5-10 seconds
                </p>
              </div>

              {/* Progress Steps */}
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                  Processing image
                </div>
                <div className="w-4 h-px bg-slate-300"></div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                  AI analysis
                </div>
                <div className="w-4 h-px bg-slate-300"></div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                  Generating report
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="text-red-500 mt-0.5 flex-shrink-0" size={20} />
              <div>
                <p className="text-red-800 font-medium">Analysis Failed</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
                <button
                  onClick={() => {
                    setError('');
                    setPreview(null);
                  }}
                  className="mt-2 text-red-700 hover:text-red-800 font-medium text-sm underline"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
