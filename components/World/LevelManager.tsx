/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text3D, Center, Float } from '@react-three/drei';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '../../store';
import { GameObject, ObjectType, LANE_WIDTH, SPAWN_DISTANCE, REMOVE_DISTANCE, GameStatus, LETTER_COLORS } from '../../types';
import { audio } from '../System/Audio';

// --- Shared Materials (Performance Optimization) ---
const SHADOW_MAT = new THREE.MeshBasicMaterial({ color: '#000000', opacity: 0.3, transparent: true });

const OBSTACLE_MAT = new THREE.MeshStandardMaterial({ 
    color: "#330011", roughness: 0.3, metalness: 0.8, flatShading: true 
});
// We clone gem mats for different colors or use color prop on mesh if simple
const GEM_MAT_BASE = new THREE.MeshStandardMaterial({ 
    color: "#00ffff", roughness: 0, metalness: 1, emissive: "#00ffff", emissiveIntensity: 2 
});
const HEART_MAT = new THREE.MeshStandardMaterial({ 
    color: "#ff0000", roughness: 0.2, metalness: 0.5, emissive: "#ff0000", emissiveIntensity: 3 
});
const MAGNET_MAT = new THREE.MeshStandardMaterial({
    color: "#ff3333", roughness: 0.4, metalness: 0.9, emissive: "#550000", emissiveIntensity: 1
});
const SHIELD_MAT = new THREE.MeshPhysicalMaterial({
    color: "#0088ff", roughness: 0.1, metalness: 0.9, transmission: 0.5, opacity: 0.6, transparent: true, emissive: "#0044aa", emissiveIntensity: 2
});
const VEST_MAT = new THREE.MeshStandardMaterial({
    color: "#ffd700", roughness: 0.3, metalness: 1.0, emissive: "#ffaa00", emissiveIntensity: 1
});
const BOOTS_MAT = new THREE.MeshStandardMaterial({
    color: "#00ff00", roughness: 0.4, metalness: 0.8, emissive: "#004400", emissiveIntensity: 1
});
const GIFT_BOX_MAT = new THREE.MeshStandardMaterial({
    color: "#ff00ff", roughness: 0.2, metalness: 0.4
});

const DRONE_BODY_MAT = new THREE.MeshStandardMaterial({ color: "#222222", metalness: 0.9, roughness: 0.1 });
const DRONE_LIGHT_MAT = new THREE.MeshBasicMaterial({ color: "#ff0000" });

const ALIEN_BODY_MAT = new THREE.MeshStandardMaterial({ color: "#4400cc", metalness: 0.8, roughness: 0.2 });
const ALIEN_DOME_MAT = new THREE.MeshStandardMaterial({ color: "#00ff00", emissive: "#00ff00", emissiveIntensity: 0.5, transparent: true, opacity: 0.8 });
const ALIEN_EYE_MAT = new THREE.MeshBasicMaterial({ color: "#ff00ff" });

const MISSILE_CORE_MAT = new THREE.MeshStandardMaterial({ color: "#ff0000", emissive: "#ff0000", emissiveIntensity: 4 });
const MISSILE_RING_MAT = new THREE.MeshBasicMaterial({ color: "#ffff00" });

const SHOP_FRAME_MAT = new THREE.MeshStandardMaterial({ color: "#111111", metalness: 0.8, roughness: 0.2 });
const SHOP_BACK_MAT = new THREE.MeshBasicMaterial({ color: "#000000" });
const SHOP_OUTLINE_MAT = new THREE.MeshBasicMaterial({ color: "#00ffff", wireframe: true, transparent: true, opacity: 0.3 });
const SHOP_FLOOR_MAT = new THREE.MeshBasicMaterial({ color: "#00ffff", transparent: true, opacity: 0.3 });

// --- Geometries ---
const OBSTACLE_GEOMETRY = new THREE.ConeGeometry(0.9, 1.6, 6);
const OBSTACLE_GLOW_GEO = new THREE.ConeGeometry(0.9, 1.6, 6);
const OBSTACLE_RING_GEO = new THREE.RingGeometry(0.6, 0.9, 6);
const GEM_GEOMETRY = new THREE.IcosahedronGeometry(0.3, 0);
const HEART_GEOMETRY = new THREE.OctahedronGeometry(0.4, 0);
const MAGNET_GEOMETRY = new THREE.TorusGeometry(0.4, 0.1, 8, 16, Math.PI); // Half torus U shape
const SHIELD_GEOMETRY = new THREE.IcosahedronGeometry(0.5, 1);
const VEST_GEOMETRY = new THREE.CylinderGeometry(0.4, 0.3, 0.6, 8); // Simple vest shape
const BOOT_GEOMETRY = new THREE.BoxGeometry(0.3, 0.3, 0.5); // Simple boot
const GIFT_GEOMETRY = new THREE.BoxGeometry(0.6, 0.6, 0.6);
const DRONE_GEO = new THREE.SphereGeometry(0.5, 8, 8);
const DRONE_SPIKE_GEO = new THREE.ConeGeometry(0.1, 0.6, 8);

const ALIEN_BODY_GEO = new THREE.CylinderGeometry(0.6, 0.3, 0.3, 8);
const ALIEN_DOME_GEO = new THREE.SphereGeometry(0.4, 16, 16, 0, Math.PI * 2, 0, Math.PI/2);
const ALIEN_EYE_GEO = new THREE.SphereGeometry(0.1);
const MISSILE_CORE_GEO = new THREE.CylinderGeometry(0.08, 0.08, 3.0, 8);
const MISSILE_RING_GEO = new THREE.TorusGeometry(0.15, 0.02, 16, 32);

// Shadow Geometries
const SHADOW_LETTER_GEO = new THREE.PlaneGeometry(2, 0.6);
const SHADOW_GEM_GEO = new THREE.CircleGeometry(0.6, 32);
const SHADOW_HEART_GEO = new THREE.CircleGeometry(0.6, 32);
const SHADOW_ALIEN_GEO = new THREE.CircleGeometry(0.8, 32);
const SHADOW_MISSILE_GEO = new THREE.PlaneGeometry(0.15, 3);
const SHADOW_DEFAULT_GEO = new THREE.CircleGeometry(0.8, 6);
const SHOP_FRAME_GEO = new THREE.BoxGeometry(1, 7, 1);
const SHOP_BACK_GEO = new THREE.BoxGeometry(1, 5, 1.2);
const SHOP_OUTLINE_GEO = new THREE.BoxGeometry(1, 7.2, 0.8);
const SHOP_FLOOR_GEO = new THREE.PlaneGeometry(1, 4);

const BASE_LETTER_INTERVAL = 150; 
const OBSTACLE_HEIGHT = 1.6;

const getLetterInterval = (level: number) => {
    return BASE_LETTER_INTERVAL * Math.pow(1.5, Math.max(0, level - 1));
};

const MISSILE_SPEED = 30;
const FONT_URL = "https://cdn.jsdelivr.net/npm/three/examples/fonts/helvetiker_bold.typeface.json";

// Reuse Vector to avoid GC
const _tempVec = new THREE.Vector3();

// --- Particle System ---
const ParticleSystem: React.FC<{ isMobile: boolean }> = ({ isMobile }) => {
    // Drastically reduce particles on mobile to prevent CPU bottleneck
    const count = isMobile ? 100 : 400;
    
    const mesh = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    
    const particles = useMemo(() => new Array(count).fill(0).map(() => ({
        life: 0,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        rot: new THREE.Vector3(),
        rotVel: new THREE.Vector3(),
        color: new THREE.Color()
    })), [count]);

    useEffect(() => {
        const handleExplosion = (e: CustomEvent) => {
            const { position, color } = e.detail;
            let spawned = 0;
            const burstAmount = isMobile ? 10 : 30; 

            for(let i = 0; i < count; i++) {
                const p = particles[i];
                if (p.life <= 0) {
                    p.life = 0.8 + Math.random() * 0.4; 
                    p.pos.set(position[0], position[1], position[2]);
                    
                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.acos(2 * Math.random() - 1);
                    const speed = 2 + Math.random() * 8;
                    
                    p.vel.set(
                        Math.sin(phi) * Math.cos(theta),
                        Math.sin(phi) * Math.sin(theta),
                        Math.cos(phi)
                    ).multiplyScalar(speed);

                    p.rot.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
                    p.rotVel.set(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).multiplyScalar(5);
                    
                    p.color.set(color);
                    
                    spawned++;
                    if (spawned >= burstAmount) break;
                }
            }
        };
        
        window.addEventListener('particle-burst', handleExplosion as any);
        return () => window.removeEventListener('particle-burst', handleExplosion as any);
    }, [particles, count, isMobile]);

    useFrame((state, delta) => {
        if (!mesh.current) return;
        const safeDelta = Math.min(delta, 0.1);

        let activeCount = 0;
        particles.forEach((p, i) => {
            if (p.life > 0) {
                p.life -= safeDelta * 1.5;
                p.pos.addScaledVector(p.vel, safeDelta);
                p.vel.y -= safeDelta * 5; 
                p.vel.multiplyScalar(0.98);

                p.rot.x += p.rotVel.x * safeDelta;
                p.rot.y += p.rotVel.y * safeDelta;
                
                dummy.position.copy(p.pos);
                const scale = Math.max(0, p.life * 0.25);
                dummy.scale.set(scale, scale, scale);
                
                dummy.rotation.set(p.rot.x, p.rot.y, p.rot.z);
                dummy.updateMatrix();
                
                mesh.current!.setMatrixAt(i, dummy.matrix);
                mesh.current!.setColorAt(i, p.color);
                activeCount++;
            } else {
                dummy.scale.set(0,0,0);
                dummy.updateMatrix();
                mesh.current!.setMatrixAt(i, dummy.matrix);
            }
        });
        
        if (activeCount > 0 || mesh.current.count > 0) {
             mesh.current.instanceMatrix.needsUpdate = true;
             if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
        }
    });

    return (
        <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
            <octahedronGeometry args={[0.5, 0]} />
            <meshBasicMaterial toneMapped={false} transparent opacity={0.9} />
        </instancedMesh>
    );
};


const getRandomLane = (laneCount: number) => {
    const max = Math.floor(laneCount / 2);
    return Math.floor(Math.random() * (max * 2 + 1)) - max;
};

export const LevelManager: React.FC<{ isMobile: boolean }> = ({ isMobile }) => {
  const { 
    status, 
    speed, 
    collectGem, 
    collectLetter, 
    collectLife,
    collectMysteryBox,
    activateVest,
    activateJumpBoots,
    activateShield,
    activateMagnet,
    applyTimeSpeedBoost,
    collectedLetters,
    laneCount,
    setDistance,
    openShop,
    level,
    targetWord,
    isFeverMode,
    isMagnetActive
  } = useStore();
  
  const objectsRef = useRef<GameObject[]>([]);
  const [renderTrigger, setRenderTrigger] = useState(0);
  const prevStatus = useRef(status);
  const prevLevel = useRef(level);

  const playerObjRef = useRef<THREE.Object3D | null>(null);
  const distanceTraveled = useRef(0);
  const nextLetterDistance = useRef(BASE_LETTER_INTERVAL);

  const playTimeRef = useRef(0);
  const hasSpeedBoostedRef = useRef(false);
  const timeSinceLastLifeRef = useRef(0);

  // Handle resets and transitions
  useEffect(() => {
    const isRestart = status === GameStatus.PLAYING && prevStatus.current === GameStatus.GAME_OVER;
    const isMenuReset = status === GameStatus.MENU;
    const isLevelUp = level !== prevLevel.current && status === GameStatus.PLAYING;
    const isVictoryReset = status === GameStatus.PLAYING && prevStatus.current === GameStatus.VICTORY;

    if (isMenuReset || isRestart || isVictoryReset) {
        objectsRef.current = [];
        setRenderTrigger(t => t + 1);
        
        distanceTraveled.current = 0;
        nextLetterDistance.current = getLetterInterval(1);
        playTimeRef.current = 0;
        hasSpeedBoostedRef.current = false;
        timeSinceLastLifeRef.current = 0;

    } else if (isLevelUp && level > 1) {
        objectsRef.current = objectsRef.current.filter(obj => obj.position[2] > -80);
        objectsRef.current.push({
            id: uuidv4(),
            type: ObjectType.SHOP_PORTAL,
            position: [0, 0, -100], 
            active: true,
        });
        nextLetterDistance.current = distanceTraveled.current - SPAWN_DISTANCE + getLetterInterval(level);
        setRenderTrigger(t => t + 1);
        
    } else if (status === GameStatus.GAME_OVER || status === GameStatus.VICTORY) {
        setDistance(Math.floor(distanceTraveled.current));
    }
    
    prevStatus.current = status;
    prevLevel.current = level;
  }, [status, level, setDistance]);

  useFrame((state) => {
      if (!playerObjRef.current) {
          const group = state.scene.getObjectByName('PlayerGroup');
          if (group && group.children.length > 0) {
              playerObjRef.current = group.children[0];
          }
      }
  });

  useFrame((state, delta) => {
    if (status !== GameStatus.PLAYING) return;

    const safeDelta = Math.min(delta, 0.05); 
    playTimeRef.current += safeDelta;
    timeSinceLastLifeRef.current += safeDelta;

    if (playTimeRef.current > 30 && !hasSpeedBoostedRef.current) {
        applyTimeSpeedBoost();
        hasSpeedBoostedRef.current = true;
    }

    const dist = speed * safeDelta;
    distanceTraveled.current += dist;

    let hasChanges = false;
    // Reuse vector
    const playerPos = _tempVec;
    playerPos.set(0,0,0);
    
    if (playerObjRef.current) {
        playerObjRef.current.getWorldPosition(playerPos);
    }

    const currentObjects = objectsRef.current;
    const keptObjects: GameObject[] = [];
    const newSpawns: GameObject[] = [];

    for (const obj of currentObjects) {
        let moveAmount = dist;
        if (obj.type === ObjectType.MISSILE) {
            moveAmount += MISSILE_SPEED * safeDelta;
        }

        const prevZ = obj.position[2];
        obj.position[2] += moveAmount;

        // --- MAGNET LOGIC ---
        // If magnet is active, pull gems/letters towards player
        if (isMagnetActive && obj.active && (obj.type === ObjectType.GEM || obj.type === ObjectType.LETTER || obj.type === ObjectType.HEART)) {
            // Distance check
            const dx = playerPos.x - obj.position[0];
            const dz = playerPos.z - obj.position[2];
            const distanceSq = dx*dx + dz*dz;
            
            if (distanceSq < 150) { // Within range
                // Lerp towards player
                obj.position[0] += (dx * safeDelta * 8); // Move faster horizontally
                obj.position[2] += (dz * safeDelta * 2); // Pull slightly forward/back
            }
        }
        
        // --- DRONE LOGIC ---
        if (obj.type === ObjectType.DRONE) {
             // Oscillate side to side
             const t = state.clock.elapsedTime * 2 + (obj.laneOffset || 0);
             const amplitude = (laneCount * LANE_WIDTH) / 2;
             obj.position[0] = Math.sin(t) * amplitude;
        }
        
        if (obj.type === ObjectType.ALIEN && obj.active && !obj.hasFired) {
             if (obj.position[2] > -90) {
                 obj.hasFired = true;
                 newSpawns.push({
                     id: uuidv4(),
                     type: ObjectType.MISSILE,
                     position: [obj.position[0], 1.0, obj.position[2] + 2],
                     active: true,
                     color: '#ff0000'
                 });
                 hasChanges = true;
                 window.dispatchEvent(new CustomEvent('particle-burst', { 
                    detail: { position: obj.position, color: '#ff00ff' } 
                 }));
             }
        }

        let keep = true;
        if (obj.active) {
            const zThreshold = 2.0; 
            const inZZone = (prevZ < playerPos.z + zThreshold) && (obj.position[2] > playerPos.z - zThreshold);
            
            if (obj.type === ObjectType.SHOP_PORTAL) {
                const dz = Math.abs(obj.position[2] - playerPos.z);
                if (dz < 2) { 
                     openShop();
                     obj.active = false;
                     hasChanges = true;
                     keep = false; 
                }
            } else if (inZZone) {
                const dx = Math.abs(obj.position[0] - playerPos.x);
                if (dx < 0.9) { 
                     const isDamageSource = obj.type === ObjectType.OBSTACLE || obj.type === ObjectType.ALIEN || obj.type === ObjectType.MISSILE || obj.type === ObjectType.DRONE;
                     if (isDamageSource) {
                         const playerBottom = playerPos.y;
                         const playerTop = playerPos.y + 1.8; 
                         let objBottom = obj.position[1] - 0.5;
                         let objTop = obj.position[1] + 0.5;

                         if (obj.type === ObjectType.OBSTACLE) {
                             objBottom = 0;
                             objTop = OBSTACLE_HEIGHT;
                         } else if (obj.type === ObjectType.MISSILE) {
                             objBottom = 0.5;
                             objTop = 1.5;
                         } else if (obj.type === ObjectType.DRONE) {
                             objBottom = 0.2;
                             objTop = 1.0;
                         }

                         const isHit = (playerBottom < objTop) && (playerTop > objBottom);
                         if (isHit) { 
                             window.dispatchEvent(new Event('player-hit'));
                             obj.active = false; 
                             hasChanges = true;
                             if (obj.type === ObjectType.MISSILE) {
                                window.dispatchEvent(new CustomEvent('particle-burst', { 
                                    detail: { position: obj.position, color: '#ff4400' } 
                                }));
                             }
                         }
                     } else {
                         const dy = Math.abs(obj.position[1] - playerPos.y);
                         if (dy < 2.5) { 
                            if (obj.type === ObjectType.GEM) {
                                collectGem(obj.points || 50);
                                audio.playGemCollect();
                            } else if (obj.type === ObjectType.LETTER && obj.targetIndex !== undefined) {
                                collectLetter(obj.targetIndex);
                                audio.playLetterCollect();
                            } else if (obj.type === ObjectType.HEART) {
                                collectLife();
                                audio.playGemCollect();
                            } else if (obj.type === ObjectType.MAGNET) {
                                activateMagnet();
                                audio.playGemCollect(); 
                            } else if (obj.type === ObjectType.MYSTERY_BOX) {
                                collectMysteryBox();
                                audio.playGemCollect(); // TODO: Distinct sound
                            } else if (obj.type === ObjectType.INVINCIBILITY) {
                                activateVest();
                                audio.playGemCollect();
                            } else if (obj.type === ObjectType.SHIELD) {
                                activateShield();
                                audio.playGemCollect();
                            } else if (obj.type === ObjectType.JUMP_BOOTS) {
                                activateJumpBoots();
                                audio.playGemCollect();
                            }
                            
                            window.dispatchEvent(new CustomEvent('particle-burst', { 
                                detail: { position: obj.position, color: obj.color || '#ffffff' } 
                            }));
                            obj.active = false;
                            hasChanges = true;
                         }
                     }
                }
            }
        }

        if (obj.position[2] > REMOVE_DISTANCE) {
            keep = false;
            hasChanges = true;
        }

        if (keep) {
            keptObjects.push(obj);
        }
    }

    if (newSpawns.length > 0) {
        keptObjects.push(...newSpawns);
    }

    let furthestZ = 0;
    const staticObjects = keptObjects.filter(o => o.type !== ObjectType.MISSILE && o.type !== ObjectType.DRONE);
    
    if (staticObjects.length > 0) {
        furthestZ = Math.min(...staticObjects.map(o => o.position[2]));
    } else {
        furthestZ = -20;
    }

    if (furthestZ > -SPAWN_DISTANCE) {
         const spawnZ = Math.min(furthestZ - (12 + (speed * 0.4)), -SPAWN_DISTANCE);

         if (isFeverMode) {
            const maxLane = Math.floor(laneCount / 2);
            for (let i = -maxLane; i <= maxLane; i++) {
                keptObjects.push({
                    id: uuidv4(),
                    type: ObjectType.GEM,
                    position: [i * LANE_WIDTH, 1.2, spawnZ],
                    active: true,
                    color: '#ffd700',
                    points: 100
                });
            }
            hasChanges = true;
         } else {
             if (timeSinceLastLifeRef.current > 70) {
                 const lane = getRandomLane(laneCount);
                 keptObjects.push({
                     id: uuidv4(),
                     type: ObjectType.HEART,
                     position: [lane * LANE_WIDTH, 1.2, spawnZ],
                     active: true,
                     color: '#ff0000'
                 });
                 timeSinceLastLifeRef.current = 0;
                 hasChanges = true;
             } else {
                 const isLetterDue = distanceTraveled.current >= nextLetterDistance.current;

                 if (isLetterDue) {
                     const lane = getRandomLane(laneCount);
                     const target = targetWord;
                     const availableIndices = target.map((_, i) => i).filter(i => !collectedLetters.includes(i));

                     if (availableIndices.length > 0) {
                         const chosenIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
                         const val = target[chosenIndex];
                         const color = LETTER_COLORS[chosenIndex % LETTER_COLORS.length];
                         keptObjects.push({
                            id: uuidv4(),
                            type: ObjectType.LETTER,
                            position: [lane * LANE_WIDTH, 1.0, spawnZ], 
                            active: true,
                            color: color,
                            value: val,
                            targetIndex: chosenIndex
                         });
                         nextLetterDistance.current += getLetterInterval(level);
                         hasChanges = true;
                     } else {
                        keptObjects.push({
                            id: uuidv4(),
                            type: ObjectType.GEM,
                            position: [lane * LANE_WIDTH, 1.2, spawnZ],
                            active: true,
                            color: '#00ffff',
                            points: 50
                        });
                        hasChanges = true;
                     }

                 } else if (Math.random() > 0.1) { 
                    const rand = Math.random();
                    // 15% chance to spawn a drone (moving obstacle) if not in easy mode
                    if (rand < 0.15 && level > 1) {
                         keptObjects.push({
                             id: uuidv4(),
                             type: ObjectType.DRONE,
                             position: [0, 1.0, spawnZ],
                             active: true,
                             color: '#ff0000',
                             laneOffset: Math.random() * 10
                         });
                         hasChanges = true;
                    } 
                    // Powerups!
                    // 3% Magnet, 2% Mystery Box, 1% Vest, 1% Shield, 2% Boots
                    else if (rand > 0.97 && !isMagnetActive) {
                         const lane = getRandomLane(laneCount);
                         keptObjects.push({
                             id: uuidv4(),
                             type: ObjectType.MAGNET,
                             position: [lane * LANE_WIDTH, 1.0, spawnZ],
                             active: true
                         });
                         hasChanges = true;
                    } else if (rand > 0.95) {
                         const lane = getRandomLane(laneCount);
                         keptObjects.push({
                             id: uuidv4(),
                             type: ObjectType.MYSTERY_BOX,
                             position: [lane * LANE_WIDTH, 1.0, spawnZ],
                             active: true
                         });
                         hasChanges = true;
                    } else if (rand > 0.94) {
                         const lane = getRandomLane(laneCount);
                         keptObjects.push({
                             id: uuidv4(),
                             type: ObjectType.INVINCIBILITY,
                             position: [lane * LANE_WIDTH, 1.0, spawnZ],
                             active: true
                         });
                         hasChanges = true;
                    } else if (rand > 0.93) {
                         const lane = getRandomLane(laneCount);
                         keptObjects.push({
                             id: uuidv4(),
                             type: ObjectType.SHIELD,
                             position: [lane * LANE_WIDTH, 1.0, spawnZ],
                             active: true
                         });
                         hasChanges = true;
                    } else if (rand > 0.91) {
                         const lane = getRandomLane(laneCount);
                         keptObjects.push({
                             id: uuidv4(),
                             type: ObjectType.JUMP_BOOTS,
                             position: [lane * LANE_WIDTH, 1.0, spawnZ],
                             active: true
                         });
                         hasChanges = true;
                    }
                    else {
                        // Standard Obstacles/Aliens
                        const isObstacle = Math.random() > 0.20;
                        if (isObstacle) {
                            const spawnAlien = level >= 2 && Math.random() < 0.2;
                            if (spawnAlien) {
                                const availableLanes = [];
                                const maxLane = Math.floor(laneCount / 2);
                                for (let i = -maxLane; i <= maxLane; i++) availableLanes.push(i);
                                availableLanes.sort(() => Math.random() - 0.5);

                                let alienCount = 1;
                                const pAlien = Math.random();
                                if (pAlien > 0.7) alienCount = Math.min(2, availableLanes.length);
                                if (pAlien > 0.9 && availableLanes.length >= 3) alienCount = 3;

                                for (let k = 0; k < alienCount; k++) {
                                    const lane = availableLanes[k];
                                    keptObjects.push({
                                        id: uuidv4(),
                                        type: ObjectType.ALIEN,
                                        position: [lane * LANE_WIDTH, 1.5, spawnZ],
                                        active: true,
                                        color: '#00ff00',
                                        hasFired: false
                                    });
                                }
                            } else {
                                const availableLanes = [];
                                const maxLane = Math.floor(laneCount / 2);
                                for (let i = -maxLane; i <= maxLane; i++) availableLanes.push(i);
                                availableLanes.sort(() => Math.random() - 0.5);
                                let countToSpawn = 1;
                                const p = Math.random();
                                if (p > 0.80) countToSpawn = Math.min(3, availableLanes.length);
                                else if (p > 0.50) countToSpawn = Math.min(2, availableLanes.length);
                                else countToSpawn = 1;

                                for (let i = 0; i < countToSpawn; i++) {
                                    const lane = availableLanes[i];
                                    const laneX = lane * LANE_WIDTH;
                                    keptObjects.push({
                                        id: uuidv4(),
                                        type: ObjectType.OBSTACLE,
                                        position: [laneX, OBSTACLE_HEIGHT / 2, spawnZ],
                                        active: true,
                                        color: '#ff0054'
                                    });
                                    if (Math.random() < 0.3) {
                                        keptObjects.push({
                                            id: uuidv4(),
                                            type: ObjectType.GEM,
                                            position: [laneX, OBSTACLE_HEIGHT + 1.0, spawnZ],
                                            active: true,
                                            color: '#ffd700',
                                            points: 100
                                        });
                                    }
                                }
                            }
                        } else {
                            const lane = getRandomLane(laneCount);
                            keptObjects.push({
                                id: uuidv4(),
                                type: ObjectType.GEM,
                                position: [lane * LANE_WIDTH, 1.2, spawnZ],
                                active: true,
                                color: '#00ffff',
                                points: 50
                            });
                        }
                    }
                    hasChanges = true;
                 }
             }
         }
    }

    if (hasChanges) {
        objectsRef.current = keptObjects;
        setRenderTrigger(t => t + 1);
    }
  });

  return (
    <group>
      <ParticleSystem isMobile={isMobile} />
      {objectsRef.current.map(obj => {
        if (!obj.active) return null;
        return <GameEntity key={obj.id} data={obj} />;
      })}
    </group>
  );
};

const GameEntity: React.FC<{ data: GameObject }> = React.memo(({ data }) => {
    const groupRef = useRef<THREE.Group>(null);
    const visualRef = useRef<THREE.Group>(null);
    const shadowRef = useRef<THREE.Mesh>(null);
    const { laneCount } = useStore();
    
    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.position.set(data.position[0], 0, data.position[2]);
        }
        if (visualRef.current) {
            const baseHeight = data.position[1];
            if (data.type === ObjectType.SHOP_PORTAL) {
                 visualRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.02);
            } else if (data.type === ObjectType.MISSILE) {
                 visualRef.current.rotation.z += delta * 20;
                 visualRef.current.position.y = baseHeight;
            } else if (data.type === ObjectType.ALIEN) {
                 visualRef.current.position.y = baseHeight + Math.sin(state.clock.elapsedTime * 3) * 0.2;
                 visualRef.current.rotation.y += delta;
            } else if (data.type === ObjectType.HEART) {
                const scale = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.2;
                visualRef.current.scale.setScalar(scale);
                visualRef.current.rotation.y += delta * 2;
                visualRef.current.position.y = baseHeight + Math.sin(state.clock.elapsedTime * 3) * 0.2;
            } else if (data.type === ObjectType.MAGNET) {
                visualRef.current.rotation.y += delta * 2;
                visualRef.current.position.y = baseHeight + Math.sin(state.clock.elapsedTime * 3) * 0.1;
            } else if (data.type === ObjectType.DRONE) {
                visualRef.current.rotation.y += delta * 5;
                visualRef.current.position.y = baseHeight;
            } else if (data.type === ObjectType.MYSTERY_BOX) {
                 visualRef.current.rotation.x += delta;
                 visualRef.current.rotation.y += delta;
                 visualRef.current.position.y = baseHeight + Math.sin(state.clock.elapsedTime * 2) * 0.1;
            } else if (data.type === ObjectType.INVINCIBILITY) {
                 visualRef.current.rotation.y += delta * 0.5;
            } else if (data.type === ObjectType.SHIELD) {
                 visualRef.current.rotation.y += delta * 2;
            } else if (data.type === ObjectType.JUMP_BOOTS) {
                 visualRef.current.rotation.y -= delta * 2;
            } else if (data.type !== ObjectType.OBSTACLE) {
                visualRef.current.rotation.y += delta * 3;
                const bobOffset = Math.sin(state.clock.elapsedTime * 4 + data.position[0]) * 0.1;
                visualRef.current.position.y = baseHeight + bobOffset;
                if (shadowRef.current) {
                    const shadowScale = 1 - bobOffset; 
                    shadowRef.current.scale.setScalar(shadowScale);
                }
            } else {
                visualRef.current.position.y = baseHeight;
            }
        }
    });

    const shadowGeo = useMemo(() => {
        if (data.type === ObjectType.LETTER) return SHADOW_LETTER_GEO;
        if (data.type === ObjectType.GEM) return SHADOW_GEM_GEO;
        if (data.type === ObjectType.HEART) return SHADOW_HEART_GEO;
        if (data.type === ObjectType.MAGNET) return SHADOW_GEM_GEO;
        if (data.type === ObjectType.MYSTERY_BOX) return SHADOW_LETTER_GEO;
        if (data.type === ObjectType.INVINCIBILITY) return SHADOW_ALIEN_GEO;
        if (data.type === ObjectType.SHIELD) return SHADOW_GEM_GEO;
        if (data.type === ObjectType.JUMP_BOOTS) return SHADOW_GEM_GEO;
        if (data.type === ObjectType.DRONE) return SHADOW_ALIEN_GEO;
        if (data.type === ObjectType.SHOP_PORTAL) return null;
        if (data.type === ObjectType.ALIEN) return SHADOW_ALIEN_GEO;
        if (data.type === ObjectType.MISSILE) return SHADOW_MISSILE_GEO;
        return SHADOW_DEFAULT_GEO; 
    }, [data.type]);

    return (
        <group ref={groupRef} position={[data.position[0], 0, data.position[2]]}>
            {data.type !== ObjectType.SHOP_PORTAL && shadowGeo && (
                <mesh ref={shadowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} geometry={shadowGeo} material={SHADOW_MAT} />
            )}

            <group ref={visualRef} position={[0, data.position[1], 0]}>
                {data.type === ObjectType.SHOP_PORTAL && (
                    <group>
                         <mesh position={[0, 3, 0]} geometry={SHOP_FRAME_GEO} scale={[laneCount * LANE_WIDTH + 2, 1, 1]} material={SHOP_FRAME_MAT} />
                         <mesh position={[0, 2, 0]} geometry={SHOP_BACK_GEO} scale={[laneCount * LANE_WIDTH, 1, 1]} material={SHOP_BACK_MAT} />
                         <mesh position={[0, 3, 0]} geometry={SHOP_OUTLINE_GEO} scale={[laneCount * LANE_WIDTH + 2.2, 1, 1]} material={SHOP_OUTLINE_MAT} />
                         <Center position={[0, 5, 0.6]}>
                             <Text3D font={FONT_URL} size={1.2} height={0.2}>
                                 CYBER SHOP
                                 <meshBasicMaterial color="#ffff00" />
                             </Text3D>
                         </Center>
                         <mesh position={[0, 0.1, 0]} rotation={[-Math.PI/2, 0, 0]} geometry={SHOP_FLOOR_GEO} scale={[laneCount * LANE_WIDTH, 1, 1]} material={SHOP_FLOOR_MAT} />
                    </group>
                )}

                {data.type === ObjectType.OBSTACLE && (
                    <group>
                        <mesh geometry={OBSTACLE_GEOMETRY} castShadow receiveShadow material={OBSTACLE_MAT} />
                        <mesh scale={[1.02, 1.02, 1.02]} geometry={OBSTACLE_GLOW_GEO}>
                             <meshBasicMaterial color={data.color} wireframe transparent opacity={0.3} />
                        </mesh>
                         <mesh position={[0, -OBSTACLE_HEIGHT/2 + 0.05, 0]} rotation={[-Math.PI/2,0,0]} geometry={OBSTACLE_RING_GEO}>
                             <meshBasicMaterial color={data.color} transparent opacity={0.4} side={THREE.DoubleSide} />
                         </mesh>
                    </group>
                )}

                {data.type === ObjectType.ALIEN && (
                    <group>
                        <mesh castShadow geometry={ALIEN_BODY_GEO} material={ALIEN_BODY_MAT} />
                        <mesh position={[0, 0.2, 0]} geometry={ALIEN_DOME_GEO} material={ALIEN_DOME_MAT} />
                        <mesh position={[0.3, 0, 0.3]} geometry={ALIEN_EYE_GEO} material={ALIEN_EYE_MAT} />
                        <mesh position={[-0.3, 0, 0.3]} geometry={ALIEN_EYE_GEO} material={ALIEN_EYE_MAT} />
                    </group>
                )}

                {data.type === ObjectType.MISSILE && (
                    <group rotation={[Math.PI / 2, 0, 0]}>
                        <mesh geometry={MISSILE_CORE_GEO} material={MISSILE_CORE_MAT} />
                        <mesh position={[0, 1.0, 0]} geometry={MISSILE_RING_GEO} material={MISSILE_RING_MAT} />
                        <mesh position={[0, 0, 0]} geometry={MISSILE_RING_GEO} material={MISSILE_RING_MAT} />
                        <mesh position={[0, -1.0, 0]} geometry={MISSILE_RING_GEO} material={MISSILE_RING_MAT} />
                    </group>
                )}
                
                {data.type === ObjectType.DRONE && (
                    <group>
                        <mesh geometry={DRONE_GEO} material={DRONE_BODY_MAT} castShadow />
                        <mesh geometry={DRONE_SPIKE_GEO} position={[0.5, 0, 0]} rotation={[0, 0, -Math.PI/2]} material={DRONE_LIGHT_MAT} />
                        <mesh geometry={DRONE_SPIKE_GEO} position={[-0.5, 0, 0]} rotation={[0, 0, Math.PI/2]} material={DRONE_LIGHT_MAT} />
                        <mesh geometry={DRONE_SPIKE_GEO} position={[0, 0.5, 0]} rotation={[0, 0, 0]} material={DRONE_LIGHT_MAT} />
                        <mesh geometry={DRONE_SPIKE_GEO} position={[0, -0.5, 0]} rotation={[0, 0, Math.PI]} material={DRONE_LIGHT_MAT} />
                    </group>
                )}
                
                {data.type === ObjectType.MYSTERY_BOX && (
                    <group>
                        <mesh geometry={GIFT_GEOMETRY} material={GIFT_BOX_MAT} />
                        <Center position={[0, 0, 0.31]}>
                             <Text3D font={FONT_URL} size={0.4} height={0.05}>
                                 ?
                                 <meshBasicMaterial color="#ffffff" />
                             </Text3D>
                        </Center>
                    </group>
                )}

                {data.type === ObjectType.INVINCIBILITY && (
                    <group>
                        {/* Simple Armor Vest representation */}
                        <mesh geometry={VEST_GEOMETRY} material={VEST_MAT} />
                        <mesh position={[0, 0.4, 0]} rotation={[0,0,0]}>
                             <torusGeometry args={[0.2, 0.05, 8, 16]} />
                             <meshBasicMaterial color="#ffffff" />
                        </mesh>
                    </group>
                )}

                {data.type === ObjectType.SHIELD && (
                    <group>
                        <mesh geometry={SHIELD_GEOMETRY} material={SHIELD_MAT} />
                    </group>
                )}

                {data.type === ObjectType.JUMP_BOOTS && (
                    <group>
                        <mesh position={[-0.2, 0, 0]} geometry={BOOT_GEOMETRY} material={BOOTS_MAT} />
                        <mesh position={[0.2, 0, 0]} geometry={BOOT_GEOMETRY} material={BOOTS_MAT} />
                        <mesh position={[-0.2, 0.2, 0]}>
                             <cylinderGeometry args={[0.05, 0.05, 0.4]} />
                             <meshBasicMaterial color="#00ff00" />
                        </mesh>
                        <mesh position={[0.2, 0.2, 0]}>
                             <cylinderGeometry args={[0.05, 0.05, 0.4]} />
                             <meshBasicMaterial color="#00ff00" />
                        </mesh>
                    </group>
                )}

                {data.type === ObjectType.GEM && (
                    <mesh geometry={GEM_GEOMETRY} material={GEM_MAT_BASE}>
                         {/* Dynamic color for gems needs a clone or we use base and modify in a way that doesn't churn */}
                         <meshStandardMaterial color={data.color} roughness={0} metalness={1} emissive={data.color} emissiveIntensity={2} />
                    </mesh>
                )}

                {data.type === ObjectType.HEART && (
                    <mesh geometry={HEART_GEOMETRY} material={HEART_MAT} />
                )}
                
                {data.type === ObjectType.MAGNET && (
                    <group rotation={[Math.PI, 0, 0]}>
                         <mesh geometry={MAGNET_GEOMETRY} material={MAGNET_MAT} />
                    </group>
                )}

                {data.type === ObjectType.LETTER && (
                    <group scale={[1.5, 1.5, 1.5]}>
                         <Center>
                             <Text3D 
                                font={FONT_URL} 
                                size={0.8} 
                                height={0.5} 
                                bevelEnabled
                                bevelThickness={0.02}
                                bevelSize={0.02}
                                bevelSegments={5}
                             >
                                {data.value}
                                <meshStandardMaterial color={data.color} emissive={data.color} emissiveIntensity={1.5} />
                             </Text3D>
                         </Center>
                    </group>
                )}
            </group>
        </group>
    );
});
