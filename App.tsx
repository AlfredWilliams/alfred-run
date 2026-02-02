/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { Suspense, useRef, useEffect, useState } from 'react';
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

function Scene({ isMobile }: { isMobile: boolean }) {
  return (
    <>
        <Environment isMobile={isMobile} />
        <group>
            {/* Attach a userData to identify player group for LevelManager collision logic */}
            <group userData={{ isPlayer: true }} name="PlayerGroup">
                 <Player />
            </group>
            <LevelManager isMobile={isMobile} />
        </group>
        {/* Disable post-processing on mobile to hit 60fps on low-end devices */}
        {!isMobile && <Effects />}
    </>
  );
}

function App() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Simple check: if width < 768px, treat as mobile for optimization purposes
    const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    // h-[100dvh] ensures full height on mobile browsers with dynamic toolbars
    <div className="relative w-full h-[100dvh] bg-black overflow-hidden select-none touch-none">
      <HUD />
      <Canvas
        // Use BasicShadowMap for high performance on mobile. PCFSoft is too heavy for low-end GPUs.
        shadows={{ type: isMobile ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap }}
        // Force dpr to 1 on mobile. 1.5/2.0 kills battery and FPS on cheap phones.
        dpr={isMobile ? 1 : [1, 1.5]} 
        gl={{ 
            antialias: false, 
            stencil: false, 
            depth: true, 
            powerPreference: "high-performance",
            preserveDrawingBuffer: false 
        }}
        camera={{ position: [0, 5.5, 8], fov: 60 }}
      >
        <CameraController />
        <Suspense fallback={null}>
            <Scene isMobile={isMobile} />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default App;
