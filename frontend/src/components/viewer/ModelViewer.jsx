import { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Environment, Grid } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import * as THREE from 'three';

function OBJModel({ url }) {
  const obj = useLoader(OBJLoader, url);
  const ref = useRef();

  // Auto-center and scale
  const box    = new THREE.Box3().setFromObject(obj);
  const size   = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale  = maxDim > 0 ? 2 / maxDim : 1;
  const center = box.getCenter(new THREE.Vector3());

  obj.traverse(child => {
    if (child.isMesh) {
      child.material = new THREE.MeshStandardMaterial({
        color: 0xa78bfa, roughness: 0.4, metalness: 0.3,
      });
      child.castShadow = true;
    }
  });

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.25;
  });

  return (
    <primitive ref={ref} object={obj} scale={scale}
      position={[-center.x * scale, -center.y * scale, -center.z * scale]} />
  );
}

function OBJFromString({ objText }) {
  const ref    = useRef();
  const loader = new OBJLoader();
  const obj    = loader.parse(objText);

  const box    = new THREE.Box3().setFromObject(obj);
  const size   = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale  = maxDim > 0 ? 2 / maxDim : 1;
  const center = box.getCenter(new THREE.Vector3());

  obj.traverse(child => {
    if (child.isMesh) {
      child.material = new THREE.MeshStandardMaterial({
        color: 0x7c3aed, roughness: 0.5, metalness: 0.2,
      });
    }
  });

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.25;
  });

  return (
    <primitive ref={ref} object={obj} scale={scale}
      position={[-center.x * scale, -center.y * scale, -center.z * scale]} />
  );
}

export default function ModelViewer({ objUrl, objText, height = '260px' }) {
  const [autoRotate, setAutoRotate] = useState(true);

  return (
    <div className="relative w-full rounded-xl overflow-hidden"
      style={{ height, background: '#0a0a12', border: '1px solid rgba(124,58,237,0.2)' }}>
      <Canvas camera={{ position: [3, 2, 4], fov: 45 }} shadows>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
        <pointLight position={[-4, 3, -4]} color="#7c3aed" intensity={0.6} />
        <pointLight position={[4, 2, 4]}  color="#a78bfa" intensity={0.4} />

        <Suspense fallback={null}>
          {objUrl  && <OBJModel url={objUrl} />}
          {objText && <OBJFromString objText={objText} />}
          <Environment preset="night" />
        </Suspense>

        <Grid infiniteGrid fadeDistance={7} fadeStrength={4}
          cellColor="rgba(124,58,237,0.15)" sectionColor="rgba(124,58,237,0.08)"
          position={[0, -1.2, 0]} />

        <OrbitControls makeDefault autoRotate={autoRotate} autoRotateSpeed={1.5} />
      </Canvas>

      <button onClick={() => setAutoRotate(v => !v)}
        className="absolute bottom-2 left-2 px-2 py-1 rounded-md text-[10px] transition-colors"
        style={{
          background: 'rgba(0,0,0,0.6)',
          border: '1px solid rgba(124,58,237,0.3)',
          color: '#a78bfa',
          backdropFilter: 'blur(8px)',
        }}>
        {autoRotate ? 'Pause' : 'Rotate'}
      </button>

      {!objUrl && !objText && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>No model loaded</p>
        </div>
      )}
    </div>
  );
}
