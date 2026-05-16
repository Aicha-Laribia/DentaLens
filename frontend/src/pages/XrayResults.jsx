import { useRef, useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import axios from 'axios'
import Header from '../components/Header'
import NearbyMap from '../components/NearbyMap'
import { normalizeXrayResult, severityForFinding } from '../utils/xrayReport'
import { useLang } from '../context/LangContext'

const TABS = [
  { id: 'xray', label: '🩻 X-Ray' },
  { id: 'progression', label: '⏳ If Untreated' },
  { id: 'opinion', label: '🤔 Treatment review' },
  { id: 'costs', label: '💰 Costs' },
  { id: 'nearby', label: '📍 Nearby' },
  { id: 'chat', label: '💬 AI Chat' },
]

export default function XrayResults() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { lang } = useLang()
  const [tab, setTab] = useState('xray')
  const [opinionPlan, setOpinionPlan] = useState('')
  const [opinion, setOpinion] = useState(null)
  const [opinionLoading, setOpinionLoading] = useState(false)
  const [chat, setChat] = useState([
    { role: 'assistant', content: "Hi! I've analyzed your X-ray. Ask me anything about your results. 😊" }
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const findingsRef = useRef(null)
  const nearbyRef = useRef(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(Boolean(state?.slug))

  useEffect(() => {
    let cancelled = false
    let pollTimeout = null

    const pollResults = async (attempts = 0, maxAttempts = 20) => {
      if (cancelled) return
      
      try {
        const res = await axios.get(`http://localhost:8000/xray-results/${state.slug}?lang=${lang}`)
        if (!cancelled) {
          // Check if analysis is done
          if (res.data.is_done === true) {
            setData(normalizeXrayResult(res.data, state.imageUrl))
            setLoading(false)
          } else if (attempts < maxAttempts) {
            // Still processing, poll again in 2 seconds
            pollTimeout = setTimeout(() => pollResults(attempts + 1, maxAttempts), 2000)
          } else {
            // Polling timed out
            setData(normalizeXrayResult({}, state.imageUrl))
            setLoading(false)
          }
        }
      } catch (err) {
        if (cancelled) return
        
        // If error, try polling again unless we've exhausted attempts
        if (attempts < maxAttempts) {
          pollTimeout = setTimeout(() => pollResults(attempts + 1, maxAttempts), 2000)
        } else {
          console.error('Results retrieval failed:', err)
          setData(normalizeXrayResult({}, state.imageUrl))
          setLoading(false)
        }
      }
    }

    if (state?.slug) {
      setLoading(true)
      pollResults()
    } else if (state?.data) {
      setData(normalizeXrayResult(state.data, state.imageUrl))
      setLoading(false)
    }

    return () => {
      cancelled = true
      if (pollTimeout) clearTimeout(pollTimeout)
    }
  }, [state, lang])

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!data) { navigate('/'); return null }

  const urgent = data.findings.filter(f => f.illnesses.some(i => i.probability >= 75))
  const monitor = data.findings.filter(f => severityForFinding(f) === 'monitor')
  const isPlaceholder = state?.placeholderMode || data.id?.includes('placeholder') || data.slug?.includes('placeholder')

  const allFindings = data.findings.flatMap(finding =>
    finding.illnesses.map(illness => ({
      tooth: finding.tooth,
      name: illness.name,
      probability: illness.probability,
      suspicious: finding.suspicious_lesion
    }))
  )
  const topFindings = allFindings.slice().sort((a, b) => b.probability - a.probability).slice(0, 3)
  const averageConfidence = allFindings.length
    ? Math.round(allFindings.reduce((sum, item) => sum + item.probability, 0) / allFindings.length)
    : 0
  const clinicalSummary = urgent.length
    ? 'High-risk findings detected. See a dentist for definitive diagnosis and treatment planning as soon as possible.'
    : monitor.length
      ? 'Findings require clinical follow-up and monitoring. Confirm them during your next visit.'
      : 'No critical issues detected. Continue preventive care and routine dental follow-up.'

  function scrollTo(ref) {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function getOpinion() {
    setOpinionLoading(true)
    try {
      const res = await axios.post('http://localhost:8000/second-opinion', {
        findings: data.findings,
        dentist_plan: opinionPlan
      })
      setOpinion(res.data)
    } catch {
      const highConfidence = allFindings.slice(0, 5).map(item => `Tooth ${item.tooth}: ${item.name} (${Math.round(item.probability)}%)`)
      setOpinion({
        summary: 'Preview mode active: this report compares your plan against detected tooth findings, without a paid AI call.',
        supported: [],
        unsupported: opinionPlan.trim() ? [] : ['No dentist plan was provided.'],
        missed: highConfidence,
        questions: [
          'Which tooth is each proposed treatment for?',
          'Is there a deeper lesion that was not mentioned?',
          'Can the treatment plan remain conservative?',
          'What is the expected fee range in MAD?'
        ]
      })
    } finally { setOpinionLoading(false) }
  }

  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return
    const msg = chatInput.trim()
    setChatInput('')
    const updated = [...chat, { role: 'user', content: msg }]
    setChat(updated)
    setChatLoading(true)
    try {
      const res = await axios.post('http://localhost:8000/chat', {
        findings: data.findings,
        conversation: updated,
        message: msg
      })
      setChat([...updated, { role: 'assistant', content: res.data.response }])
    } catch {
      const top = urgent[0]
      const focus = top ? `tooth ${top.tooth}` : 'the detected findings'
      setChat([...updated, {
        role: 'assistant',
        content: `Placeholder answer: based on ${focus}, use this as a second-opinion prep note and confirm it with a dentist.`
      }])
    } finally { setChatLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[#f4f8fb] flex flex-col">
      <Header />

      {isPlaceholder && (
        <div className="bg-cyan-50 border-b border-cyan-200 px-6 py-2 text-sm text-cyan-800">
          Placeholder scan mode is active. The report structure is accurate for your real X-ray API results.
        </div>
      )}

      {urgent.length > 0 && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-2 flex items-center gap-2">
          <span className="text-red-500">⚠️</span>
          <span className="text-red-700 text-sm font-medium">
            {urgent.length} urgent finding{urgent.length > 1 ? 's' : ''} detected — please see a dentist soon.
          </span>
          {data.has_suspicious && (
            <span className="ml-2 bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full font-semibold">
              Unusual lesion — specialist recommended
            </span>
          )}
        </div>
      )}

      <main className="max-w-7xl mx-auto w-full px-4 py-8 space-y-8">
        {tab === 'xray' && (
          <>
            <section className="rounded-[2rem] bg-white p-6 shadow-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <div className="lg:flex-1 space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-700">X-ray report</div>
              <div className="space-y-4">
                <h1 className="text-4xl font-bold text-slate-900">What the scan found and what it means</h1>
                <p className="max-w-2xl text-lg leading-8 text-slate-600">This report is built directly from the API response. It highlights each tooth finding, its confidence, and the next practical step for the user.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm text-gray-500">Urgent findings</p>
                  <p className="mt-3 text-2xl font-semibold text-red-600">{urgent.length}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm text-gray-500">Review needed</p>
                  <p className="mt-3 text-2xl font-semibold text-amber-600">{monitor.length}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm text-gray-500">Average confidence</p>
                  <p className="mt-3 text-2xl font-semibold text-teal">{averageConfidence}%</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm text-gray-500">Total findings</p>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">{data.summary?.pathologies_detected || allFindings.length}</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Clinical summary</p>
                  <p className="mt-3 text-lg font-semibold text-slate-900">{clinicalSummary}</p>
                </div>
                <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm uppercase tracking-[0.22em] text-slate-500">API details</p>
                  <p className="mt-3 text-sm text-slate-600">{data.message || 'No additional message from the scan API.'}</p>
                  <p className="mt-2 text-xs text-slate-500">Report generated in {data.response_time?.toFixed?.(2) ?? data.response_time} seconds</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => scrollTo(findingsRef)} className="rounded-3xl bg-teal px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary">Go to findings</button>
                <button onClick={() => scrollTo(nearbyRef)} className="rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">See nearby care</button>
              </div>
            </div>

            <div className="lg:w-[440px] rounded-[2rem] border border-slate-200 bg-slate-950 p-4 text-white shadow-xl">
              <div className="rounded-[1.5rem] overflow-hidden bg-slate-900 shadow-inner">
                <div className="border-b border-slate-800 px-5 py-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">API images</p>
                  <p className="mt-2 text-sm text-slate-300">Original radiograph and annotated output, when available.</p>
                </div>
                <div className="grid gap-3 p-4 sm:grid-cols-2">
                  {data.original_image && (
                    <div className="rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 cursor-pointer" onClick={() => setSelectedImage({ src: data.original_image, alt: 'Original X-ray' })}>
                      <img src={data.original_image} alt="Original X-ray" className="h-40 w-full object-cover hover:opacity-80 transition" />
                      <div className="bg-slate-900 px-3 py-2 text-xs text-slate-400">Original image (click to enlarge)</div>
                    </div>
                  )}
                  {data.draw_image && (
                    <div className="rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 cursor-pointer" onClick={() => setSelectedImage({ src: data.draw_image, alt: 'Annotated X-ray' })}>
                      <img src={data.draw_image} alt="Annotated X-ray" className="h-40 w-full object-cover hover:opacity-80 transition" />
                      <div className="bg-slate-900 px-3 py-2 text-xs text-slate-400">Annotated image (click to enlarge)</div>
                    </div>
                  )}
                </div>
                {data.embeded_link && (
                  <div className="border-t border-slate-800 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400 mb-2">Interactive viewer</p>
                    <iframe src={data.embeded_link} className="w-full h-64 rounded-3xl border border-slate-700" title="Interactive X-ray viewer"></iframe>
                  </div>
                )}
                {data.embeded_report_link && (
                  <div className="border-t border-slate-800 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400 mb-2">PDF report</p>
                    <a href={data.embeded_report_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-3xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
                      Download PDF Report
                    </a>
                  </div>
                )}
              </div>
              <div className="mt-5 grid gap-3 rounded-[1.5rem] border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300">
                {topFindings.map((finding, index) => (
                  <div key={`${finding.tooth}-${index}`}>
                    <p className="font-semibold text-slate-100">Tooth {finding.tooth}</p>
                    <p>{finding.name} — {finding.probability}% confidence</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
            </section>

            <section className="flex flex-wrap gap-3 px-6">
          {TABS.map(tabItem => (
            <button
              key={tabItem.id}
              onClick={() => setTab(tabItem.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${tab === tabItem.id ? 'bg-teal text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              {tabItem.label}
            </button>
          ))}
        </section>

            <section ref={findingsRef} className="rounded-[2rem] bg-white p-6 shadow-xl">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-teal-700">Results overview</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">What this scan found</h2>
            </div>
            <p className="max-w-xl text-sm text-slate-500">The report shows each tooth with a confidence score, suspicious area tag, and a clear recommendation for the next step.</p>
          </div>

          <div className="space-y-4">
            {data.findings.map((finding, index) => (
              <motion.div key={finding.tooth} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Tooth {finding.tooth}</p>
                    <div className="mt-2 text-sm text-slate-600 space-y-1">
                      {finding.illnesses.map((illness, idx) => (
                        <p key={idx}>• {illness.name} — {Math.round(illness.probability)}%</p>
                      ))}
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-3 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm">
                    <span className={severityForFinding(finding) === 'urgent' ? 'text-red-600' : severityForFinding(finding) === 'monitor' ? 'text-amber-600' : 'text-emerald-600'}>
                      {severityForFinding(finding) === 'urgent' ? 'High risk' : severityForFinding(finding) === 'monitor' ? 'Monitor' : 'Low'}
                    </span>
                    <span>{finding.illnesses[0]?.probability ?? 0}%</span>
                  </div>
                </div>
                {finding.ai_second_opinion && (
                  <div className="mt-4 rounded-3xl bg-white p-4 text-sm text-slate-700 shadow-sm">
                    <p className="font-semibold text-slate-900">Suggested approach</p>
                    <p className="mt-2">{finding.ai_second_opinion}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
            </section>
          </>
        )}

        {tab === 'progression' && (
          <section className="space-y-6">
            <div className="rounded-[2rem] border border-blue-100 bg-blue-50 p-6 text-sm text-blue-800">
              <strong>Why this matters:</strong> Early treatment reduces risk and cost.
            </div>
            {data.progressions.length === 0 ? (
              <div className="rounded-[2rem] bg-white p-12 text-center shadow-xl">
                <div className="text-5xl mb-4">✅</div>
                <p className="text-teal font-semibold text-lg">No major progressive pathologies detected.</p>
              </div>
            ) : data.progressions.map((prog, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="rounded-[1rem] bg-white shadow-md p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{prog.label} — Tooth {prog.tooth}</div>
                    <div className="text-xs text-gray-500">{Math.round(prog.probability)}% confidence</div>
                  </div>
                </div>
                <ul className="mt-3 space-y-2 text-sm text-gray-700">
                  {prog.untreated.slice(0,3).map((stage, j) => (
                    <li key={j}>• {stage.time}: {stage.desc}</li>
                  ))}
                </ul>
                <div className="mt-3 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-gray-800">If treated: {prog.treated}</div>
              </motion.div>
            ))}
          </section>
        )}

        {tab === 'opinion' && (
          <section className="space-y-6">
            <div className="rounded-[2rem] bg-white p-6 shadow-xl">
              <h2 className="font-bold text-primary text-lg mb-2">🤔 Treatment review</h2>
              <p className="text-gray-500 text-sm mb-4">Paste your dentist's treatment plan. Our AI compares it against what the X-ray actually shows.</p>
              <textarea
                value={opinionPlan}
                onChange={e => setOpinionPlan(e.target.value)}
                placeholder="e.g. My dentist recommends 3 fillings, one root canal on tooth 46, and scaling..."
                className="w-full rounded-3xl border border-gray-200 bg-slate-50 p-5 text-sm focus:outline-none focus:border-teal"
                rows={5}
              />
              <button
                onClick={getOpinion}
                disabled={!opinionPlan.trim() || opinionLoading}
                className="mt-3 w-full rounded-3xl bg-teal text-white py-3 text-sm font-semibold transition hover:bg-primary disabled:opacity-50"
              >
                {opinionLoading ? 'Analyzing...' : 'Compare with AI findings'}
              </button>
            </div>
            {opinion && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="rounded-[2rem] bg-white p-5 shadow-xl">
                  <p className="text-slate-700">{opinion.summary}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { key: 'supported', label: '✅ AI Confirms', box: 'bg-green-50 border-green-200', title: 'text-green-700', text: 'text-green-600' },
                    { key: 'unsupported', label: '⚠️ Not Detected', box: 'bg-red-50 border-red-200', title: 'text-red-700', text: 'text-red-600' },
                    { key: 'missed', label: '🔍 Missing from Plan', box: 'bg-yellow-50 border-yellow-200', title: 'text-yellow-700', text: 'text-yellow-600' }
                  ].map(({ key, label, box, title, text }) => opinion[key]?.length > 0 && (
                    <div key={key} className={`${box} rounded-3xl border p-4`}>
                      <h4 className={`font-semibold ${title} text-sm mb-2`}>{label}</h4>
                      <ul className="space-y-1">{opinion[key].map((item, i) => <li key={i} className={`text-xs ${text}`}>• {item}</li>)}</ul>
                    </div>
                  ))}
                </div>
                {opinion.questions?.length > 0 && (
                  <div className="rounded-[2rem] bg-blue-50 border border-blue-200 p-5 text-blue-800">
                    <h4 className="font-semibold mb-3">💬 Ask your dentist</h4>
                    <ol className="space-y-2 text-sm">{opinion.questions.map((q, i) => <li key={i} className="flex gap-2"><span className="font-semibold">{i+1}.</span><span>{q}</span></li>)}</ol>
                  </div>
                )}
              </motion.div>
            )}
          </section>
        )}

        {tab === 'costs' && (
          <section className="space-y-6">
            <div className="rounded-[2rem] bg-white p-6 shadow-xl">
              <h2 className="font-bold text-primary text-lg mb-4">💰 Estimated costs in Morocco</h2>
              <div className="space-y-3 mb-6">
                {data.costs.breakdown.map((item, i) => (
                  <div key={i} className="flex justify-between items-center gap-4 rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
                    <div>
                      <p className="font-medium text-slate-900">{item.treatment}</p>
                      <p className="text-xs text-slate-500">Tooth {item.tooth}</p>
                    </div>
                    <p className="font-semibold text-teal">{item.min}–{item.max} MAD</p>
                  </div>
                ))}
              </div>
              <div className="rounded-3xl bg-light p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-bold text-slate-900">Total estimate</span>
                <span className="text-2xl font-bold text-teal">{data.costs.total_min.toLocaleString()}–{data.costs.total_max.toLocaleString()} MAD</span>
              </div>
              <p className="text-xs text-slate-400 mt-3">* Estimates based on average Moroccan clinic prices. Always request a written devis before treatment.</p>
            </div>
            <div className="rounded-[2rem] bg-amber-50 border border-amber-200 p-5 text-sm text-amber-800">
              <strong>💡 Act early:</strong> Treating now is typically 3–10x less expensive than emergency care.
            </div>
          </section>
        )}

        {tab === 'nearby' && (
          <section ref={nearbyRef} className="rounded-[2rem] bg-white p-6 shadow-xl">
            <NearbyMap type="dentist" />
          </section>
        )}

        {tab === 'chat' && (
          <section className="rounded-[2rem] bg-white p-6 shadow-xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-bold text-primary text-lg">💬 Ask the AI</h2>
                <p className="text-sm text-slate-500">Get fast explanations for your scan results.</p>
              </div>
            </div>
            <div className="flex h-[520px] flex-col overflow-hidden rounded-[2rem] border border-slate-200">
              <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50">
                {chat.map((msg, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-3xl px-4 py-3 text-sm ${msg.role === 'user' ? 'bg-teal text-white rounded-br-sm' : 'bg-white text-slate-700 rounded-bl-sm shadow-sm'}`}>
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white rounded-3xl px-4 py-3 flex gap-1 shadow-sm">
                      {[0, 1, 2].map(i => <div key={i} className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                    </div>
                  </div>
                )}
              </div>
              <div className="border-t border-slate-200 p-4 bg-white flex gap-3">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChat()}
                  placeholder="Is this cavity urgent?"
                  className="flex-1 rounded-3xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:border-teal"
                />
                <button onClick={sendChat} disabled={!chatInput.trim() || chatLoading} className="rounded-3xl bg-teal px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">Send</button>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl max-h-full p-4" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 z-10 rounded-full bg-black bg-opacity-50 p-2 text-white hover:bg-opacity-75"
            >
              ✕
            </button>
            <TransformWrapper minScale={0.5} maxScale={4} centerOnInit>
              {({ zoomIn, zoomOut, resetTransform }) => (
                <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
                  <div className="p-4 bg-slate-100 flex gap-2 justify-center">
                    <button onClick={zoomIn} className="rounded-lg bg-slate-200 px-3 py-1 text-sm">Zoom In</button>
                    <button onClick={zoomOut} className="rounded-lg bg-slate-200 px-3 py-1 text-sm">Zoom Out</button>
                    <button onClick={resetTransform} className="rounded-lg bg-slate-200 px-3 py-1 text-sm">Reset</button>
                  </div>
                  <TransformComponent wrapperClass="max-h-[80vh]">
                    <img src={selectedImage.src} alt={selectedImage.alt} className="max-w-full h-auto" />
                  </TransformComponent>
                </div>
              )}
            </TransformWrapper>
          </div>
        </div>
      )}
    </div>
  )
}
