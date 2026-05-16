import React, { Suspense, useState } from 'react'
import { Canvas, useLoader } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import { motion } from 'framer-motion'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('3D Model Error:', error, errorInfo)
    this.props.setError(true)
  }

  render() {
    if (this.state.hasError) {
      return null
    }
    return this.props.children
  }
}

function ModelLoader() {
  const materials = useLoader(MTLLoader, '/models/3D_Model.mtl')
  const model = useLoader(OBJLoader, '/models/3D_Model.obj', (loader) => {
    materials.preload()
    loader.setMaterials(materials)
  })
  
  return <primitive object={model} scale={50} position={[0, -1.35, 0]} />
}

function ModelCanvas() {
  return (
    <Canvas camera={{ position: [0, 8, 30], fov: 45 }}>
      <ambientLight intensity={0.6} />
      <pointLight position={[5, 5, 5]} intensity={1} />
      <pointLight position={[-5, -5, -5]} intensity={0.3} />
      <OrbitControls enablePan={false} minDistance={5} maxDistance={80} />
      <Suspense fallback={<Model3DLoading />}>
        <ModelLoader />
      </Suspense>
    </Canvas>
  )
}

function Model3DLoading() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#3b82f6" wireframe />
    </mesh>
  )
}

export default function ToothModel3D({ findings }) {
  const primaryFinding = findings?.[0] ?? null
  const [modelError, setModelError] = useState(false)

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 bg-gray-900 rounded-2xl overflow-hidden" style={{ height: 400 }}>
        {modelError ? (
          <div className="w-full h-full flex items-center justify-center text-white">
            <div className="text-center">
              <p className="text-lg mb-2">Unable to load 3D model</p>
              <p className="text-sm text-gray-400">Please try refreshing the page</p>
            </div>
          </div>
        ) : (
          <ErrorBoundary setError={setModelError}>
            <ModelCanvas />
          </ErrorBoundary>
        )}
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

        {primaryFinding ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-4 shadow"
          >
            <h4 className="font-semibold text-primary text-sm mb-2">
              Top finding: Tooth {primaryFinding.tooth}
            </h4>
            {primaryFinding.illnesses?.map((ill, i) => (
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
            ))}
          </motion.div>
        ) : (
          <div className="bg-white rounded-xl p-4 shadow text-sm text-slate-600">
            No specific tooth selected. The 3D model shows the full dental arch and the most important scan finding by default.
          </div>
        )}

        <p className="text-xs text-gray-400 text-center">
          Drag to rotate · Scroll to zoom · Use the menu above to switch views.
        </p>
      </div>
    </div>
  )
}
