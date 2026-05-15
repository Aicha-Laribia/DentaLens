import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Header from '../components/Header'

export default function PathChoice() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-light flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-primary mb-3">
            What do you have with you?
          </h2>
          <p className="text-gray-500">
            Choose your path — we'll take it from there.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          {[
            {
              icon: "🩻",
              title: "I have an X-ray",
              desc: "Upload your dental radiograph. Our AI runs 191 models, builds a 3D model of your teeth, shows progression timelines, estimates costs, and gives you a second opinion.",
              action: () => navigate('/xray'),
              color: "border-primary hover:bg-blue-50",
              badge: "Full diagnosis"
            },
            {
              icon: "📱",
              title: "I only have my phone",
              desc: "Take 4 guided photos of your mouth. AI performs clinical visual triage, flags urgent issues including early oral cancer warning signs, and finds the nearest imaging center near you.",
              action: () => navigate('/selfie'),
              color: "border-teal hover:bg-teal-50",
              badge: "Quick triage"
            }
          ].map((path, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={path.action}
              className={`bg-white border-2 ${path.color} rounded-2xl p-8 text-left shadow transition-all`}
            >
              <div className="text-5xl mb-4">{path.icon}</div>
              <span className="text-xs font-semibold text-teal bg-teal-50 px-2 py-1 rounded-full">
                {path.badge}
              </span>
              <h3 className="text-xl font-bold text-primary mt-3 mb-2">{path.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{path.desc}</p>
              <div className="mt-6 text-primary font-semibold text-sm">
                Get started →
              </div>
            </motion.button>
          ))}
        </div>
      </main>
    </div>
  )
}