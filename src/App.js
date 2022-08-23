import * as THREE from 'three'
import React, { Suspense, useEffect, useState, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { a, useTransition, useSpring } from '@react-spring/three'
import { Reflector, Text, useTexture, useGLTF, ContactShadows } from '@react-three/drei'
import Overlay from './Overlay'
import create from 'zustand'

function Carla(props) {
  const { scene } = useGLTF('/carla-draco.glb')
  return <primitive object={scene} {...props} />
}

function VideoText({ clicked, ...props }) {
  const [video] = useState(() => Object.assign(document.createElement('video'), { src: '/drei.mp4', crossOrigin: 'Anonymous', loop: true }))
  useEffect(() => void (clicked && video.play()), [video, clicked])
  return (
    <Text font="/Inter-Bold.woff" fontSize={3} letterSpacing={-0.06} {...props}>
      drei
      <meshBasicMaterial toneMapped={false}>
        <videoTexture attach="map" args={[video]} encoding={THREE.sRGBEncoding} />
      </meshBasicMaterial>
    </Text>
  )
}

function Ground() {
  const [floor, normal] = useTexture(['/SurfaceImperfections003_1K_var1.jpg', '/SurfaceImperfections003_1K_Normal.jpg'])
  return (
    <Reflector blur={[400, 100]} resolution={512} args={[10, 10]} mirror={0.5} mixBlur={6} mixStrength={1.5} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
      {(Material, props) => <Material color="#a0a0a0" metalness={0.4} roughnessMap={floor} normalMap={normal} normalScale={[2, 2]} {...props} />}
    </Reflector>
  )
}

const useStore = create((set) => {
  new THREE.FontLoader().load('/helvetiker_regular.typeface.json', (font) => {
    const config = { font, size: 2.25, height: 2, curveSegments: 4, evelEnabled: false }
    set({
      items: [{ position: [-0.35, 0, 0], r: 0, geometry: new THREE.TextGeometry('S', config) }]
    })
  })
  return { items: [], material: new THREE.MeshStandardMaterial() }
})

function Geometry({ r, position, ...props }) {
  const ref = useRef()
  useFrame((state) => {
    ref.current.rotation.x = ref.current.rotation.y = ref.current.rotation.z += 0.004 * r
    ref.current.position.y = position[1] + Math[r > 0.5 ? 'cos' : 'sin'](state.clock.getElapsedTime() * r) * r
  })
  return (
    <group position={position} ref={ref}>
      <a.mesh {...props} />
    </group>
  )
}
function Geometries() {
  const { items, material } = useStore()
  const transition = useTransition(items, {
    from: { scale: [0, 0, 0], rotation: [0, 0, 0] },
    enter: ({ r }) => ({ scale: [1, 1, 1], rotation: [r * 3, r * 3, r * 3] }),
    leave: { scale: [0.1, 0.1, 0.1], rotation: [0, 0, 0] },
    config: { mass: 5, tension: 1000, friction: 100 },
    trail: 100
  })
  return transition((props, { position: [x, y, z], r, geometry }) => (
    <Geometry position={[x * 3, y * 3, z]} material={material} geometry={geometry} r={r} {...props} />
  ))
}

export default function App() {
  const [clicked, setClicked] = useState(false)
  const [ready, setReady] = useState(false)
  const store = { clicked, setClicked, ready, setReady }
  return (
    <>
      <Canvas concurrent gl={{ alpha: false }} pixelRatio={[1, 1.5]} camera={{ position: [0, 3, 100], fov: 15 }}>
        <color attach="background" args={['black']} />
        <fog attach="fog" args={['black', 15, 20]} />
        <Suspense fallback={null}>
          <group position={[0, -1, 0]}>
            <Geometries />
            <Ground />
          </group>
          <ambientLight intensity={0.5} />
          <spotLight position={[0, 10, 0]} intensity={0.3} />
          <directionalLight position={[-50, 0, -40]} intensity={0.7} />
          <Intro start={ready && clicked} set={setReady} />
        </Suspense>
      </Canvas>
      <Overlay {...store} />
    </>
  )
}

function Intro({ start, set }) {
  const [vec] = useState(() => new THREE.Vector3())
  useEffect(() => setTimeout(() => set(true), 500), [])
  return useFrame((state) => {
    if (start) {
      state.camera.position.lerp(vec.set(state.mouse.x * 5, 3 + state.mouse.y * 2, 14), 0.05)
      state.camera.lookAt(0, 0, 0)
    }
  })
}
