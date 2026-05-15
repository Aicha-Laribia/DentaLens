import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, UploadCloud, Sparkles, Clock3, FileSearch, Camera } from 'lucide-react'
import { motion } from 'framer-motion'
import axios from 'axios'
import Header from '../components/Header'
import { useLang } from '../context/LangContext'
import { DEMO_XRAY_RESULT } from '../utils/demoData'

const LOADING_KEYS = [
  'Uploading your X-ray image…',
  'Preparing the radiograph viewer…',
  'Mapping tooth-level findings…',
  'Estimating treatment cost ranges…',
  'Building your ready-to-share report…'
]

const BENEFITS = [
  { icon: ShieldCheck, title: 'Reliable format', description: 'Designed for panoramic, periapical, and bitewing images.' },
  { icon: Sparkles, title: 'Clean report', description: 'Every finding is grouped by tooth, not random generic phrases.' },
  { icon: Clock3, title: 'Fast preview', description: 'Use the placeholder report instantly without API tokens.' },
]

export default function XrayFlow() {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msgIndex, setMsgIndex] = useState(0)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)
  const fileRef = useRef()
  const navigate = useNavigate()
  const { t } = useLang()

  function openPlaceholderReport() {
    navigate('/xray/results', {
      state: {
        data: DEMO_XRAY_RESULT,
        imageUrl: null,
        placeholderMode: true
      }
    })
  }

  async function handleFile(file) {
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setLoading(true)
    setError('')

    let idx = 0
    const interval = setInterval(() => {
      idx = (idx + 1) % LOADING_KEYS.length
      setMsgIndex(idx)
    }, 2600)

    try {
      const form = new FormData()
      form.append('image', file)
      const res = await axios.post('http://localhost:8000/xray-analyze', form)
      const analysisData = res.data

      clearInterval(interval)
      navigate('/xray/results', {
        state: {
          data: analysisData.slug ? null : analysisData,
          slug: analysisData.slug,
          imageUrl: preview || URL.createObjectURL(file),
          placeholderMode: !analysisData.slug
        }
      })
    } catch (e) {
      clearInterval(interval)
      navigate('/xray/results', {
        state: {
          data: DEMO_XRAY_RESULT,
          imageUrl: preview || URL.createObjectURL(file),
          placeholderMode: true
        }
      })
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F7F9] flex flex-col">
      <Header />

      <main className="flex-1 px-4 py-12 lg:px-10">
        <div className="mx-auto max-w-6xl grid gap-10 lg:grid-cols-[0.9fr_0.9fr] items-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-sm font-semibold text-teal ring-1 ring-teal/20">
              Track 2 · X-ray scan review</div>
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl font-bold text-slate-900">Upload your dental X-ray with confidence</h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">Get a professional, structured scan report that highlights each tooth issue, shows severity, and turns raw image results into actionable dental insights.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {BENEFITS.map((item) => (
                <div key={item.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <item.icon className="h-5 w-5 text-teal" />
                  <h3 className="mt-3 text-base font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
                </div>
              ))}
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl">
              <div className="flex items-center gap-3 text-slate-500 mb-4">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-teal">1</span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Upload your X-ray</p>
                  <p className="text-sm text-slate-500">JPEG or PNG works best for panoramic, periapical, and bitewing radiographs.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-500 mb-4">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-teal">2</span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Review the annotated report</p>
                  <p className="text-sm text-slate-500">Each tooth finding appears with localized confidence and treatment guidance.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-500">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-teal">3</span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Compare with a treatment plan</p>
                  <p className="text-sm text-slate-500">Use the second opinion tab to validate dentist recommendations and spot missed issues.</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-cyan-100 text-cyan-800">
                <UploadCloud size={36} />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900">Upload your X-ray</h2>
              <p className="mt-2 text-sm text-slate-500">Drag and drop or click to browse. A clean preview shows your selected image immediately.</p>
            </div>

            <div
              className={`mt-8 rounded-[1.75rem] border-2 p-8 text-center transition-all ${dragging ? 'border-teal bg-teal-50' : 'border-dashed border-slate-300 bg-white hover:border-teal hover:bg-teal-50'}`}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
              onClick={() => fileRef.current.click()}
            >
              {preview ? (
                <img src={preview} alt="X-ray preview" className="mx-auto mb-6 max-h-52 w-full rounded-3xl object-contain" />
              ) : (
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 text-teal">
                  <Camera size={28} />
                </div>
              )}
              <p className="text-lg font-semibold text-slate-800">{preview ? 'Ready to analyze your scan' : t('drop_here')}</p>
              <p className="mt-2 text-sm text-slate-500">{t('or_browse')}</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={e => handleFile(e.target.files[0])}
              />
            </div>

            <button
              onClick={openPlaceholderReport}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-slate-900 px-6 py-4 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800"
            >
              <FileSearch size={18} />
              Preview sample report
            </button>

            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-left text-sm text-slate-600">
              <p className="font-medium text-slate-900">Why this helps</p>
              <p className="mt-2 leading-6">This demo shows the exact report structure we’ll use with your real X-ray API, so you can test the experience before going live.</p>
            </div>
          </motion.div>
        </div>

        {loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto mt-10 flex max-w-lg flex-col items-center gap-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
            <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
              <div className="absolute inset-4 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin" />
              <span className="relative text-3xl">🦷</span>
            </div>
            <p className="text-center text-lg font-semibold text-slate-800">Analyzing your X-ray</p>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">
              {LOADING_KEYS[msgIndex]}
            </div>
          </motion.div>
        )}

        {error && <p className="mt-6 text-center text-sm text-red-600">{error}</p>}
      </main>
    </div>
  )
}
