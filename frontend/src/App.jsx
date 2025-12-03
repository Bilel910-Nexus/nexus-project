import { Canvas, useFrame } from '@react-three/fiber'
import { CameraControls, Stars, Line, Float } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { useState, useMemo, useEffect, useRef } from 'react'
import * as THREE from 'three'

// --- 1. TYPEWRITER ---
const Typewriter = ({ text }) => {
  const [displayedText, setDisplayedText] = useState("")
  useEffect(() => {
    setDisplayedText("")
    let index = 0
    const intervalId = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(index))
      index++
      if (index === text.length) clearInterval(intervalId)
    }, 20)
    return () => clearInterval(intervalId)
  }, [text])
  return <p style={{ margin: 0, lineHeight: '1.6', fontWeight: '300' }}>{displayedText}</p>
}

// --- 2. CRISTAL (Design Artefact) ---
function MemoryCrystal({ position, text, onHover, onClickNode }) {
  const meshRef = useRef()
  const randomOffset = useMemo(() => Math.random() * 100, [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    meshRef.current.rotation.x = t * 0.2 + randomOffset
    meshRef.current.rotation.y = t * 0.3 + randomOffset
    const pulse = (Math.sin(t * 2 + randomOffset) + 1) / 2 
    meshRef.current.material.emissiveIntensity = 1.5 + pulse * 3.5
  })

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5} position={position}>
      <mesh 
        ref={meshRef}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; onHover(text) }}
        onPointerOut={(e) => { e.stopPropagation(); document.body.style.cursor = 'auto'; onHover(null) }}
        onClick={(e) => { e.stopPropagation(); onClickNode(position) }}
      >
        <icosahedronGeometry args={[0.15, 0]} />
        <meshPhysicalMaterial 
          color="#00f3ff"           
          emissive="#00f3ff"        
          roughness={0.3}           
          metalness={0.1}           
          transmission={0.6}        
          thickness={0.5}           
          toneMapped={false}        
        />
      </mesh>
    </Float>
  )
}

// --- 3. GALAXIE ---
function Galaxy({ onHoverNode, refreshTrigger, onNodeClick }) {
  const [memories, setMemories] = useState([])

  useEffect(() => {
    // 👇 ICI : Connexion au Backend Render
    fetch('https://nexus-project-434h.onrender.com/galaxy')
      .then(res => res.json())
      .then(data => {
        const mappedData = data.map(mem => ({
          ...mem,
          position: new THREE.Vector3(
             (Math.sin(mem.id * 123.45) * 6),
             (Math.cos(mem.id * 67.89) * 4),
             (Math.sin(mem.id * 91.23) * 6)
          )
        }))
        setMemories(mappedData)
      })
      .catch(() => console.log("Backend non connecté"))
  }, [refreshTrigger])

  const connections = useMemo(() => {
    const lines = []
    memories.forEach((p1, i) => memories.forEach((p2, j) => {
      if (i !== j && p1.position.distanceTo(p2.position) < 4) {
        lines.push([p1.position, p2.position])
      }
    }))
    return lines
  }, [memories])
  
  const groupRef = useRef()
  useFrame(() => { if(groupRef.current) groupRef.current.rotation.y += 0.0001 })

  return (
    <group ref={groupRef}>
      {memories.map((mem) => (
        <MemoryCrystal 
          key={mem.id}
          position={mem.position}
          text={mem.text}
          onHover={onHoverNode}
          onClickNode={onNodeClick}
        />
      ))}
      {connections.map((l, i) => <Line key={i} points={l} color="rgba(0, 243, 255, 0.05)" transparent lineWidth={1} />)}
    </group>
  )
}

// --- 4. INTERFACE ---
function Interface({ hoveredText, onMessageSent }) {
  const [question, setQuestion] = useState("")
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)

  const askNexus = async (e) => {
    e.preventDefault()
    if (!question) return
    setLoading(true); setResponse(null)
    
    try {
      // 👇 ICI : Connexion au Backend Render
      const res = await fetch(`https://nexus-project-434h.onrender.com/ask?question=${question}`)
      const data = await res.json()
      setResponse(data.response)
      onMessageSent() 
    } catch (e) { setResponse("Connexion impossible.") }
    
    setLoading(false)
    setQuestion("")
  }

  const styles = {
    overlay: {
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10,
      pointerEvents: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center',
    },
    hudContainer: {
      pointerEvents: 'auto', width: '600px',
      background: 'rgba(5, 5, 5, 0.7)', backdropFilter: 'blur(20px)',
      borderRadius: '20px', border: '1px solid rgba(0, 243, 255, 0.2)',
      padding: '50px', boxShadow: '0 0 50px rgba(0, 243, 255, 0.1)',
      textAlign: 'center'
    },
    title: {
      fontFamily: "'Orbitron', sans-serif", fontSize: '2.5rem', color: 'white', margin: '0 0 5px 0',
      letterSpacing: '8px', fontWeight: '400', textShadow: '0 0 10px rgba(0,243,255,0.5)'
    },
    signature: {
      fontFamily: "'Rajdhani', sans-serif", color: '#888', fontSize: '0.8rem', 
      letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '20px', display: 'block'
    },
    scannerLine: {
      height: '20px', fontFamily: "'Rajdhani', sans-serif", fontSize: '0.8rem', color: '#00f3ff', 
      marginBottom: '20px', letterSpacing: '1px', textTransform: 'uppercase', opacity: hoveredText ? 1 : 0.3
    },
    chatBox: {
      minHeight: '80px', textAlign: 'left', marginBottom: '30px', 
      color: '#ddd', fontFamily: "'Rajdhani', sans-serif", fontSize: '1.1rem'
    },
    inputContainer: {
      position: 'relative', display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.2)'
    },
    input: {
      width: '100%', background: 'transparent', border: 'none',
      color: '#fff', fontSize: '1rem', padding: '15px 0', fontFamily: "'Rajdhani', sans-serif", outline: 'none',
    },
    button: {
      padding: '10px 20px', border: 'none', background: 'white', borderRadius: '30px',
      color: 'black', fontFamily: "'Orbitron', sans-serif", fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer',
      letterSpacing: '1px', transition: 'all 0.3s', marginLeft: '10px'
    }
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.hudContainer}>
        <h1 style={styles.title}>NEXUS</h1>
        <span style={styles.signature}>Built by Bilel Chikar</span>
        
        <div style={styles.scannerLine}>
          {hoveredText ? `>> ${hoveredText.substring(0, 60)}...` : ">> SYSTEM SCANNING..."}
        </div>

        <div style={styles.chatBox}>
          {response ? <Typewriter text={response} /> : 
            <p style={{ color:'#555', fontStyle:'italic', textAlign:'center' }}>En attente d'une commande...</p>
          }
        </div>
        <form onSubmit={askNexus} style={styles.inputContainer}>
          <input 
            style={styles.input} type="text" placeholder="Dis quelque chose..." value={question} 
            onChange={e => setQuestion(e.target.value)} 
          />
          <button type="submit" style={styles.button}>{loading ? '...' : 'ASK'}</button>
        </form>
      </div>
    </div>
  )
}

// --- 5. SCÈNE ---
function Scene({ onHoverNode, refreshSignal }) {
  const controlsRef = useRef()

  const focusOnStar = (position) => {
    if (controlsRef.current) {
      controlsRef.current.setLookAt(
        position.x, position.y, position.z + 2.5, 
        position.x, position.y, position.z, 
        true 
      )
    }
  }

  const resetView = () => {
    if (controlsRef.current) {
      controlsRef.current.setLookAt(0, 0, 12, 0, 0, 0, true)
    }
  }

  return (
    <>
      <Galaxy onHoverNode={onHoverNode} refreshTrigger={refreshSignal} onNodeClick={focusOnStar} />
      <mesh onClick={resetView} position={[0, 0, -5]} visible={false}>
        <planeGeometry args={[100, 100]} />
      </mesh>
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
      <CameraControls ref={controlsRef} minDistance={1} maxDistance={30} />
      <EffectComposer>
        <Bloom luminanceThreshold={0.1} luminanceSmoothing={0.9} intensity={2.0} />
      </EffectComposer>
    </>
  )
}

export default function App() {
  const [hoveredText, setHoveredText] = useState(null)
  const [refreshSignal, setRefreshSignal] = useState(0)
  const triggerRefresh = () => setRefreshSignal(prev => prev + 1)

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#050505', overflow: 'hidden' }}>
      <Interface hoveredText={hoveredText} onMessageSent={triggerRefresh} />
      <Canvas camera={{ position: [0, 0, 12], fov: 50 }}>
        <fog attach="fog" args={['#050505', 5, 30]} />
        <ambientLight intensity={0.4} /> 
        <pointLight position={[10, 10, 10]} intensity={1} color="#00f3ff" />
        <Scene onHoverNode={setHoveredText} refreshSignal={refreshSignal} />
      </Canvas>
    </div>
  )
}