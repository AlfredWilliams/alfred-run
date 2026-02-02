/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Environment } from './components/World/Environment';
import { Player } from './components/World/Player';
import { LevelManager } from './components/World/LevelManager';
import { Effects } from './components/World/Effects';
import { HUD } from './components/UI/HUD';
import { useStore } from './store';

// Dynamic Camera Controller
const CameraController = () => {
  const { camera, size } = useThree();
  const { laneCount } = useStore();
  
  // Shake Intensity Ref (0 to 1)
  const shakeIntensity = useRef(0);

  useEffect(() => {
    const onHit = () => {
        shakeIntensity.current = 1.0; 
    };
    window.addEventListener('player-hit', onHit);
    return () => window.removeEventListener('player-hit', onHit);
  }, []);
  
  useFrame((state, delta) => {
    // Determine if screen is narrow (mobile portrait)
    const aspect = size.width / size.height;
    const isMobile = aspect < 1.2; 

    // Calculate expansion factors
    // Mobile requires backing up significantly more because vertical FOV is fixed in Three.js,
    // meaning horizontal view shrinks as aspect ratio drops.
    const heightFactor = isMobile ? 2.5 : 0.5; // Increased height slightly for better visibility
    const distFactor = isMobile ? 5.5 : 1.0; // Back up further on mobile

    // Base (3 lanes): y=5.5, z=8
    const extraLanes = Math.max(0, laneCount - 3);

    const targetY = 5.5 + (extraLanes * heightFactor);
    const targetZ = 8.0 + (extraLanes * distFactor);

    const targetPos = new THREE.Vector3(0, targetY, targetZ);
    
    // Smoothly interpolate camera position
    // Increased lerp speed for snappier camera feel on mobile
    camera.position.lerp(targetPos, delta * 3.0);
    
    // Apply Shake
    if (shakeIntensity.current > 0.01) {
        const shakePower = shakeIntensity.current * 0.5;
        camera.position.x += (Math.random() - 0.5) * shakePower;
        camera.position.y += (Math.random() - 0.5) * shakePower;
        camera.position.z += (Math.random() - 0.5) * shakePower;
        
        shakeIntensity.current = THREE.MathUtils.lerp(shakeIntensity.current, 0, delta * 5);
    } else {
        shakeIntensity.current = 0;
    }
    
    camera.lookAt(0, 0, -30); 
  });
  
  return null;
};

function Scene() {
  return (
    <>
        <Environment />
        <group>
            {/* Attach a userData to identify player group for LevelManager collision logic */}
            <group userData={{ isPlayer: true }} name="PlayerGroup">
                 <Player />
            </group>
            <LevelManager />
        </group>
        <Effects />
    </>
  );
}

function App() {
  return (
    // h-[100dvh] ensures full height on mobile browsers with dynamic toolbars
    <div className="relative w-full h-[100dvh] bg-black overflow-hidden select-none touch-none">
      <HUD />
      <Canvas
        shadows={{ type: THREE.PCFSoftShadowMap }}
        dpr={[1, 1.5]} // Cap pixel ratio to 1.5 for performance stability on high-res mobile screens
        gl={{ 
            antialias: false, 
            stencil: false, 
            depth: true, 
            powerPreference: "high-performance",
            // Preserve drawing buffer can help with screenshots but hurts perf, keep false
            preserveDrawingBuffer: false 
        }}
        camera={{ position: [0, 5.5, 8], fov: 60 }}
      >
        <CameraController />
        <Suspense fallback={null}>
            <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default App;
