import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LangProvider } from './context/LangContext'
import './i18n'
import Landing from './pages/Landing'
import PathChoice from './pages/PathChoice'
import XrayFlow from './pages/XrayFlow'
import SelfieFlow from './pages/SelfieFlow'
import XrayResults from './pages/XrayResults'
import SelfieResults from './pages/SelfieResults'

export default function App() {
  return (
    <BrowserRouter>
      <LangProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/choose" element={<PathChoice />} />
          <Route path="/xray" element={<XrayFlow />} />
          <Route path="/selfie" element={<SelfieFlow />} />
          <Route path="/xray/results" element={<XrayResults />} />
          <Route path="/selfie/results" element={<SelfieResults />} />
        </Routes>
      </LangProvider>
    </BrowserRouter>
  )
}