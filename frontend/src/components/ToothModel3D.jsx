import { Canvas } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'

function Tooth({ position, color, label, onClick, selected }) {
  return (
    <group position={position} onClick={onClick}>
      <mesh>
        <cylinderGeometry args={[0.18, 0.22, 0.5, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={selected ? '#ffffff' : '#000000'}
          emissiveIntensity={selected ? 0.3 : 0}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
      </mesh>
    </group>
  )
}

function getToothColor(finding) {
  if (!finding) return '#f5f5f0'
  if (finding.suspicious_lesion) return '#7c3aed'
  const maxProb = Math.max(...(finding.illnesses?.map(i => i.probability) || [0]))
  if (maxProb > 75) return '#dc2626'
  if (maxProb > 45) return '#d97706'
  if (maxProb > 0)  return '#facc15'
  return '#10b981'
}

export default function ToothModel3D({ findings }) {
  const [selected, setSelected] = useState(null)

  const findingMap = useMemo(() => {
    const map = {}
    findings.forEach(f => { map[f.tooth] = f })
    return map
  }, [findings])

  // Upper arch: FDI 11–18 and 21–28
  const upper = [
    ['18','17','16','15','14','13','12','11'],
    ['21','22','23','24','25','26','27','28']
  ]
  // Lower arch: FDI 48–41 and 31–38
  const lower = [
    ['48','47','46','45','44','43','42','41'],
    ['31','32','33','34','35','36','37','38']
  ]

  const teeth = []
  upper.forEach((row, ri) => {
    row.forEach((fdi, i) => {
      const x = ri === 0 ? -(i - 3.5) * 0.55 : (i - 3.5) * 0.55
      const z = -Math.abs(i - 3.5) * 0.15 + 0.5
      teeth.push({ fdi, x, y: 0.8, z })
    })
  })
  lower.forEach((row, ri) => {
    row.forEach((fdi, i) => {
      const x = ri === 0 ? -(i - 3.5) * 0.55 : (i - 3.5) * 0.55
      const z = -Math.abs(i - 3.5) * 0.15 + 0.5
      teeth.push({ fdi, x, y: -0.8, z })
    })
  })

  const selectedFinding = selected ? findingMap[selected] : null

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 bg-gray-900 rounded-2xl overflow-hidden" style={{ height: 400 }}>
        <Canvas camera={{ position: [0, 2, 6], fov: 45 }}>
          <ambientLight intensity={0.6} />
          <pointLight position={[5, 5, 5]} intensity={1} />
          <pointLight position={[-5, -5, -5]} intensity={0.3} />
          <OrbitControls enablePan={false} minDistance={3} maxDistance={10} />
          {teeth.map(({ fdi, x, y, z }) => (
            <Tooth
              key={fdi}
              position={[x, y, z]}
              color={getToothColor(findingMap[fdi])}
              label={fdi}
              selected={selected === fdi}
              onClick={e => { e.stopPropagation(); setSelected(fdi) }}
            />
          ))}
        </Canvas>
      </div>

      <div className="lg:w-64 space-y-4">
        {/* Legend */}
        <div className="bg-white rounded-xl p-4 shadow">
          <h4 className="font-semibold text-primary text-sm mb-3">Legend</h4>
          {[
            { color: '#dc2626', label: 'Urgent (>75%)' },
            { color: '#d97706', label: 'Moderate (45–75%)' },
            { color: '#facc15', label: 'Low (<45%)' },
            { color: '#10b981', label: 'Healthy' },
            { color: '#7c3aed', label: 'Suspicious lesion' },
            { color: '#f5f5f0', label: 'No data' }
          ].map(l => (
            <div key={l.label} className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full" style={{ background: l.color }} />
              <span className="text-xs text-gray-600">{l.label}</span>
            </div>
          ))}
        </div>

        {/* Selected tooth info */}
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-4 shadow"
          >
            <h4 className="font-semibold text-primary text-sm mb-2">
              Tooth {selected}
            </h4>
            {selectedFinding?.illnesses?.length > 0 ? (
              selectedFinding.illnesses.map((ill, i) => (
                <div key={i} className="mb-2">
                  <p className="text-xs font-medium text-gray-700">{ill.name}</p>
                  <div className="mt-1 h-1.5 bg-gray-100 rounded-full">
                    <div
                      className="h-1.5 rounded-full bg-danger"
                      style={{ width: `${ill.probability}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{Math.round(ill.probability)}% confidence</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-success">No issues detected</p>
            )}
          </motion.div>
        )}

        <p className="text-xs text-gray-400 text-center">
          Drag to rotate · Scroll to zoom · Click a tooth
        </p>
      </div>
    </div>
  )
}