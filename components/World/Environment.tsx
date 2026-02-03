/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store';
import { LANE_WIDTH } from '../../types';

// Theme Configuration
const THEMES = [
  // Level 1, 3, 5... (NIGHT / DARK SYNTHWAVE)
  {
    bg: '#050011',
    fog: '#1a0b2e',       // Slightly lighter fog for better visibility
    grid: '#8800ff',      // Deep Purple Grid
    sunTop: '#ffe600',    // Yellow Top
    sunBot: '#ff0077',    // Pink Bottom
    light: '#00ffff'      // Cyan Light
  },
  // Level 2, 4, 6... (DAY / BRIGHT CYBER SUNRISE)
  {
    bg: '#2d1b4e',        // Rich Purple/Blue base (Morning Sky)
    fog: '#ff7700',       // Bright Orange Fog (Sunrise look)
    grid: '#00ffff',      // Bright Cyan Grid (High contrast)
    sunTop: '#ffffff',    // White Hot Sun
    sunBot: '#ff00ff',    // Magenta Sun Bottom
    light: '#ffaa00'      // Warm Sunlight
  }
];

const SpeedLines: React.FC = () => {
    const { speed, isFeverMode } = useStore();
    const count = 30; // Reduced count
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    
    // Distribute lines in a tunnel shape around the player
    const lines = useMemo(() => {
        return new Array(count).fill(0).map(() => {
            const angle = Math.random() * Math.PI * 2;
            const radius = 8 + Math.random() * 8; // Outside playing area
            return {
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius + 5, // Offset vertically
                z: -50 + Math.random() * 100,
                speedOffset: Math.random() * 0.5 + 0.5,
                length: Math.random() * 5 + 5
            };
        });
    }, []);

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        
        // Only visible at high speeds or fever mode
        const isFast = speed > 40 || isFeverMode;
        if (!isFast) {
            meshRef.current.visible = false;
            return;
        }
        meshRef.current.visible = true;

        const moveSpeed = speed * 2.0;

        lines.forEach((line, i) => {
            line.z += moveSpeed * delta * line.speedOffset;
            
            if (line.z > 20) {
                line.z = -100 - Math.random() * 50;
            }

            dummy.position.set(line.x, line.y, line.z);
            dummy.scale.set(0.05, 0.05, line.length);
            dummy.rotation.set(0, 0, 0);
            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <cylinderGeometry args={[1, 1, 1, 4]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.3} blending={THREE.AdditiveBlending} />
        </instancedMesh>
    );
};

const StarField: React.FC<{ count: number }> = ({ count }) => {
  const speed = useStore(state => state.speed);
  const meshRef = useRef<THREE.Points>(null);
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      let x = (Math.random() - 0.5) * 400;
      let y = (Math.random() - 0.5) * 200 + 50; // Keep mostly above horizon
      let z = -550 + Math.random() * 650;

      // Exclude stars from the central play area
      if (Math.abs(x) < 15 && y > -5 && y < 20) {
          if (x < 0) x -= 15;
          else x += 15;
      }

      pos[i * 3] = x;     
      pos[i * 3 + 1] = y; 
      pos[i * 3 + 2] = z; 
    }
    return pos;
  }, [count]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    const positions = meshRef.current.geometry.attributes.position.array as Float32Array;
    const activeSpeed = speed > 0 ? speed : 2; // Always move slightly even when stopped

    for (let i = 0; i < count; i++) {
        let z = positions[i * 3 + 2];
        z += activeSpeed * delta * 2.0; // Parallax effect
        
        // Reset when it passes the camera (z > 100 gives plenty of buffer behind camera)
        if (z > 100) {
            z = -550 - Math.random() * 50; 
            
            let x = (Math.random() - 0.5) * 400;
            let y = (Math.random() - 0.5) * 200 + 50;
            
            if (Math.abs(x) < 15 && y > -5 && y < 20) {
                if (x < 0) x -= 15;
                else x += 15;
            }

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
        }
        positions[i * 3 + 2] = z;
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.7} // Slightly larger stars for mobile visibility
        color="#ffffff"
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
};

const LaneGuides: React.FC = () => {
    const { laneCount, isFeverMode, level } = useStore();
    const themeIndex = (level - 1) % 2;
    const isNight = themeIndex === 0;

    const separators = useMemo(() => {
        const lines: number[] = [];
        const startX = -(laneCount * LANE_WIDTH) / 2;
        
        for (let i = 0; i <= laneCount; i++) {
            lines.push(startX + (i * LANE_WIDTH));
        }
        return lines;
    }, [laneCount]);

    return (
        <group position={[0, 0.02, 0]}>
            {/* Lane Floor - Lowered slightly to -0.02 */}
            <mesh position={[0, -0.02, -20]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[laneCount * LANE_WIDTH, 200]} />
                <meshBasicMaterial 
                  // Brighter floor for visibility
                  color={isFeverMode ? "#664400" : isNight ? "#2a1b3e" : "#2a1540"} 
                  transparent opacity={0.9} 
                />
            </mesh>

            {/* Lane Separators - Glowing Lines */}
            {separators.map((x, i) => (
                <mesh key={`sep-${i}`} position={[x, 0, -20]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[0.05, 200]} /> 
                    <meshBasicMaterial 
                        color={isFeverMode ? "#ffcc00" : isNight ? "#00ffff" : "#ff00aa"} 
                        transparent 
                        opacity={0.6} 
                    />
                </mesh>
            ))}
        </group>
    );
};

const RetroSun: React.FC<{ isMobile: boolean }> = ({ isMobile }) => {
    const matRef = useRef<THREE.ShaderMaterial>(null);
    const sunGroupRef = useRef<THREE.Group>(null);
    const { isFeverMode, level } = useStore();

    const themeIndex = (level - 1) % 2;
    const theme = THEMES[themeIndex];
    const segments = isMobile ? 16 : 32;

    useFrame((state) => {
        if (matRef.current) {
            matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
            const targetTop = new THREE.Color(isFeverMode ? '#ffffff' : theme.sunTop);
            const targetBottom = new THREE.Color(isFeverMode ? '#ffaa00' : theme.sunBot);
            matRef.current.uniforms.uColorTop.value.lerp(targetTop, 0.05);
            matRef.current.uniforms.uColorBottom.value.lerp(targetBottom, 0.05);
        }
        if (sunGroupRef.current) {
            sunGroupRef.current.position.y = 30 + Math.sin(state.clock.elapsedTime * 0.2) * 1.0;
            sunGroupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
        }
    });

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uColorTop: { value: new THREE.Color('#ffe600') }, 
        uColorBottom: { value: new THREE.Color('#ff0077') } 
    }), []);

    return (
        <group ref={sunGroupRef} position={[0, 30, -180]}>
            <mesh>
                <sphereGeometry args={[35, segments, segments]} />
                <shaderMaterial
                    ref={matRef}
                    uniforms={uniforms}
                    transparent
                    vertexShader={`
                        varying vec2 vUv;
                        void main() {
                            vUv = uv;
                            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                        }
                    `}
                    fragmentShader={`
                        varying vec2 vUv;
                        uniform float uTime;
                        uniform vec3 uColorTop;
                        uniform vec3 uColorBottom;
                        void main() {
                            vec3 color = mix(uColorBottom, uColorTop, vUv.y);
                            float stripeFreq = 40.0;
                            float stripeSpeed = 1.0;
                            float stripes = sin((vUv.y * stripeFreq) - (uTime * stripeSpeed));
                            float stripeMask = smoothstep(0.2, 0.3, stripes);
                            float scanlineFade = smoothstep(0.7, 0.3, vUv.y); 
                            vec3 finalColor = mix(color, color * 0.1, (1.0 - stripeMask) * scanlineFade);
                            gl_FragColor = vec4(finalColor, 1.0);
                        }
                    `}
                />
            </mesh>
        </group>
    );
};

const MovingGrid: React.FC = () => {
    const { speed, isFeverMode, level } = useStore();
    const meshRef = useRef<THREE.Mesh>(null);
    const offsetRef = useRef(0);
    
    const themeIndex = (level - 1) % 2;
    const theme = THEMES[themeIndex];
    
    useFrame((state, delta) => {
        if (meshRef.current) {
             const activeSpeed = speed > 0 ? speed : 5;
             offsetRef.current += activeSpeed * delta;
             const cellSize = 10;
             const zPos = -100 + (offsetRef.current % cellSize);
             meshRef.current.position.z = zPos;
             
             const mat = meshRef.current.material as THREE.MeshBasicMaterial;
             const targetColor = new THREE.Color(isFeverMode ? '#ffaa00' : theme.grid);
             mat.color.lerp(targetColor, 0.05);
        }
    });

    return (
        <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, -100]}>
            <planeGeometry args={[300, 400, 30, 40]} />
            <meshBasicMaterial 
                color="#8800ff" 
                wireframe 
                transparent 
                opacity={0.15} 
            />
        </mesh>
    );
};

export const Environment: React.FC<{ isMobile: boolean }> = ({ isMobile }) => {
  const level = useStore(s => s.level);
  const themeIndex = (level - 1) % 2;
  const theme = THEMES[themeIndex];

  return (
    <>
      <color attach="background" args={[theme.bg]} />
      {/* Fog reduced to allow better visibility in distance */}
      <fog attach="fog" args={[theme.fog, 60, 200]} />
      
      {/* Significantly Increased Lighting for Mobile Visibility */}
      <ambientLight intensity={1.0} color={theme.bg} />
      <directionalLight position={[0, 20, -10]} intensity={2.5} color={theme.light} />
      <pointLight position={[0, 25, -150]} intensity={3} color={theme.sunBot} distance={200} decay={2} />
      
      {/* Reduce star count for performance */}
      <StarField count={isMobile ? 500 : 2500} />
      <MovingGrid />
      <LaneGuides />
      <SpeedLines />
      
      <RetroSun isMobile={isMobile} />
    </>
  );
};
