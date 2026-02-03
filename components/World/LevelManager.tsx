/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Text3D, Center } from '@react-three/drei';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '../../store';
import { 
    GameObject, 
    ObjectType, 
    GameConfig, 
    GameStatus, 
    LETTER_COLORS 
} from '../../types';
import { audio } from '../System/Audio';

// --- Instantiated Resources (Performance) ---
const FONT_URL = "https://cdn.jsdelivr.net/npm/three/examples/fonts/helvetiker_bold.typeface.json";

const MATERIALS = {
    SHADOW: new THREE.MeshBasicMaterial({ color: '#000000', opacity: 0.3, transparent: true }),
    OBSTACLE: new THREE.MeshStandardMaterial({ color: "#330011", roughness: 0.3, metalness: 0.8, flatShading: true }),
    GEM_BASE: new THREE.MeshStandardMaterial({ color: "#00ffff", roughness: 0, metalness: 1, emissive: "#00ffff", emissiveIntensity: 2 }),
    HEART: new THREE.MeshStandardMaterial({ color: "#ff0000", roughness: 0.2, metalness: 0.5, emissive: "#ff0000", emissiveIntensity: 3 }),
    MAGNET: new THREE.MeshStandardMaterial({ color: "#ff3333", roughness: 0.4, metalness: 0.9, emissive: "#550000", emissiveIntensity: 1 }),
    SHIELD: new THREE.MeshPhysicalMaterial({ color: "#0088ff", roughness: 0.1, metalness: 0.9, transmission: 0.5, opacity: 0.6, transparent: true, emissive: "#0044aa", emissiveIntensity: 2 }),
    VEST: new THREE.MeshStandardMaterial({ color: "#ffd700", roughness: 0.3, metalness: 1.0, emissive: "#ffaa00", emissiveIntensity: 1 }),
    BOOTS: new THREE.MeshStandardMaterial({ color: "#00ff00", roughness: 0.4, metalness: 0.8, emissive: "#004400", emissiveIntensity: 1 }),
    GIFT: new THREE.MeshStandardMaterial({ color: "#ff00ff", roughness: 0.2, metalness: 0.4 }),
    BULLET: new THREE.MeshStandardMaterial({ color: "#ffaa00", roughness: 0.2, metalness: 1.0, emissive: "#ffaa00", emissiveIntensity: 1.5 }),
    PLAYER_BULLET: new THREE.MeshBasicMaterial({ color: "#00ffff", toneMapped: false }),
    DRONE_BODY: new THREE.MeshStandardMaterial({ color: "#222222", metalness: 0.9, roughness: 0.1 }),
    DRONE_LIGHT: new THREE.MeshBasicMaterial({ color: "#ff0000" }),
    ALIEN_BODY: new THREE.MeshStandardMaterial({ color: "#4400cc", metalness: 0.8, roughness: 0.2 }),
    ALIEN_DOME: new THREE.MeshStandardMaterial({ color: "#00ff00", emissive: "#00ff00", emissiveIntensity: 0.5, transparent: true, opacity: 0.8 }),
    MISSILE_CORE: new THREE.MeshStandardMaterial({ color: "#ff0000", emissive: "#ff0000", emissiveIntensity: 4 }),
    MISSILE_RING: new THREE.MeshBasicMaterial({ color: "#ffff00" }),
    SHOP_FRAME: new THREE.MeshStandardMaterial({ color: "#111111", metalness: 0.8, roughness: 0.2 }),
    SHOP_BACK: new THREE.MeshBasicMaterial({ color: "#000000" }),
    SHOP_OUTLINE: new THREE.MeshBasicMaterial({ color: "#00ffff", wireframe: true, transparent: true, opacity: 0.3 }),
    SHOP_FLOOR: new THREE.MeshBasicMaterial({ color: "#00ffff", transparent: true, opacity: 0.3 }),
    TEXT_BASE: new THREE.MeshStandardMaterial({ color: '#ffffff' }),
    WHITE_BASIC: new THREE.MeshBasicMaterial({ color: "#ffffff" }),
    GREEN_BASIC: new THREE.MeshBasicMaterial({ color: "#00ff00" }),
    GLOW_WIRE: new THREE.MeshBasicMaterial({ wireframe: true, transparent: true, opacity: 0.3 }),
    RING_TRANSPARENT: new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.4, side: THREE.DoubleSide })
};

const GEOMETRIES = {
    OBSTACLE: new THREE.ConeGeometry(0.9, 1.6, 6),
    GEM: new THREE.IcosahedronGeometry(0.3, 0),
    HEART: new THREE.OctahedronGeometry(0.4, 0),
    MAGNET: new THREE.TorusGeometry(0.4, 0.1, 8, 16, Math.PI),
    SHIELD: new THREE.IcosahedronGeometry(0.5, 1),
    VEST: new THREE.CylinderGeometry(0.4, 0.3, 0.6, 8),
    BOOT: new THREE.BoxGeometry(0.3, 0.3, 0.5),
    GIFT: new THREE.BoxGeometry(0.6, 0.6, 0.6),
    BULLET_ITEM: new THREE.CapsuleGeometry(0.2, 0.6, 4, 8),
    PLAYER_BULLET: new THREE.SphereGeometry(0.2, 6, 6),
    DRONE: new THREE.SphereGeometry(0.5, 8, 8),
    DRONE_SPIKE: new THREE.ConeGeometry(0.1, 0.6, 8),
    ALIEN_BODY: new THREE.CylinderGeometry(0.6, 0.3, 0.3, 8),
    ALIEN_DOME: new THREE.SphereGeometry(0.4, 16, 16, 0, Math.PI * 2, 0, Math.PI/2),
    ALIEN_EYE: new THREE.SphereGeometry(0.1),
    MISSILE_CORE: new THREE.CylinderGeometry(0.08, 0.08, 3.0, 8),
    MISSILE_RING: new THREE.TorusGeometry(0.15, 0.02, 16, 32),
    SHADOW_LETTER: new THREE.PlaneGeometry(2, 0.6),
    SHADOW_CIRCLE_SMALL: new THREE.CircleGeometry(0.6, 32),
    SHADOW_CIRCLE_LARGE: new THREE.CircleGeometry(0.8, 32),
    SHADOW_MISSILE: new THREE.PlaneGeometry(0.15, 3),
    SHADOW_DEFAULT: new THREE.CircleGeometry(0.8, 6),
    SHOP_FRAME: new THREE.BoxGeometry(1, 7, 1),
    SHOP_BACK: new THREE.BoxGeometry(1, 5, 1.2),
    SHOP_OUTLINE: new THREE.BoxGeometry(1, 7.2, 0.8),
    SHOP_FLOOR: new THREE.PlaneGeometry(1, 4),
    RING_OBSTACLE: new THREE.RingGeometry(0.6, 0.9, 6),
    CYL_BOOT_DECO: new THREE.CylinderGeometry(0.05, 0.05, 0.4)
};

// --- Helper Functions ---
const getRandomLane = (laneCount: number) => {
    const max = Math.floor(laneCount / 2);
    return Math.floor(Math.random() * (max * 2 + 1)) - max;
};

const getLetterInterval = (level: number) => {
    return 150 * Math.pow(1.5, Math.max(0, level - 1));
};

// Reusable Objects
const _tempVec = new THREE.Vector3();
const _bulletDummy = new THREE.Object3D();

// --- Particle System Component ---
const ParticleSystem: React.FC<{ isMobile: boolean }> = ({ isMobile }) => {
    // Reduced particle count for mobile stability
    const count = isMobile ? 80 : 300;
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
            const burstAmount = isMobile ? 8 : 25; 

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
    }, [count, isMobile, particles]);

    useFrame((state, delta) => {
        if (!mesh.current) return;
        const safeDelta = Math.min(delta, 0.1);
        let activeCount = 0;

        for (let i = 0; i < count; i++) {
            const p = particles[i];
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
                
                mesh.current.setMatrixAt(i, dummy.matrix);
                mesh.current.setColorAt(i, p.color);
                activeCount++;
            } else {
                dummy.scale.set(0,0,0);
                dummy.updateMatrix();
                mesh.current.setMatrixAt(i, dummy.matrix);
            }
        }
        
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

// --- Main Level Manager ---
interface BulletData { position: THREE.Vector3; active: boolean; }

export const LevelManager: React.FC<{ isMobile: boolean }> = ({ isMobile }) => {
  const laneCount = useStore(s => s.laneCount);
  const level = useStore(s => s.level);
  const status = useStore(s => s.status);

  // Use refs for game loop state
  const objectsRef = useRef<GameObject[]>([]);
  const bulletsRef = useRef<BulletData[]>([]);
  const bulletMeshRef = useRef<THREE.InstancedMesh>(null);
  const [renderTrigger, setRenderTrigger] = useState(0);
  
  const prevStatus = useRef(status);
  const prevLevel = useRef(level);
  const playerObjRef = useRef<THREE.Object3D | null>(null);
  
  const distanceTraveled = useRef(0);
  const nextLetterDistance = useRef(150);
  const playTimeRef = useRef(0);
  const hasSpeedBoostedRef = useRef(false);
  const timeSinceLastLifeRef = useRef(0);
  const lastShotTime = useRef(0);

  // Reduce spawn distance on mobile to prevent memory crash (80 vs 120)
  const SPAWN_DIST = isMobile ? 80 : 120;

  useEffect(() => {
    const isRestart = status === GameStatus.PLAYING && prevStatus.current === GameStatus.GAME_OVER;
    const isMenuReset = status === GameStatus.MENU;
    const isLevelUp = level !== prevLevel.current && status === GameStatus.PLAYING;
    const isVictoryReset = status === GameStatus.PLAYING && prevStatus.current === GameStatus.VICTORY;

    if (isMenuReset || isRestart || isVictoryReset) {
        objectsRef.current = [];
        bulletsRef.current = [];
        setRenderTrigger(t => t + 1);
        
        distanceTraveled.current = 0;
        nextLetterDistance.current = getLetterInterval(1);
        playTimeRef.current = 0;
        hasSpeedBoostedRef.current = false;
        timeSinceLastLifeRef.current = 0;
        lastShotTime.current = 0;
        useStore.getState().setDistance(0);

    } else if (isLevelUp && level > 1) {
        objectsRef.current = objectsRef.current.filter(obj => obj.position[2] > -80);
        objectsRef.current.push({
            id: uuidv4(),
            type: ObjectType.SHOP_PORTAL,
            position: [0, 0, -100], 
            active: true,
        });
        nextLetterDistance.current = distanceTraveled.current - SPAWN_DIST + getLetterInterval(level);
        setRenderTrigger(t => t + 1);
    }
    
    prevStatus.current = status;
    prevLevel.current = level;
  }, [status, level, SPAWN_DIST]);

  useFrame((state) => {
      if (!playerObjRef.current) {
          const group = state.scene.getObjectByName('PlayerGroup');
          if (group && group.children.length > 0) {
              playerObjRef.current = group.children[0];
          }
      }
  });

  useFrame((state, delta) => {
    const gameState = useStore.getState();
    if (gameState.status !== GameStatus.PLAYING) return;

    const safeDelta = Math.min(delta, 0.05); 
    playTimeRef.current += safeDelta;
    timeSinceLastLifeRef.current += safeDelta;

    if (playTimeRef.current > 30 && !hasSpeedBoostedRef.current) {
        gameState.applyTimeSpeedBoost();
        hasSpeedBoostedRef.current = true;
    }

    const dist = gameState.speed * safeDelta;
    distanceTraveled.current += dist;

    let hasChanges = false;
    _tempVec.set(0,0,0);
    
    if (playerObjRef.current) {
        playerObjRef.current.getWorldPosition(_tempVec);
    }
    const playerPos = _tempVec;

    // Bullet Logic
    if (gameState.isShootingActive && state.clock.elapsedTime - lastShotTime.current > 0.12) {
        lastShotTime.current = state.clock.elapsedTime;
        bulletsRef.current.push({
            position: new THREE.Vector3(playerPos.x, playerPos.y + 0.5, playerPos.z - 1.0),
            active: true
        });
        audio.playShoot();
    }

    let activeBulletCount = 0;
    const bullets = bulletsRef.current;
    
    for (let i = 0; i < bullets.length; i++) {
        const b = bullets[i];
        if (!b.active) continue;
        b.position.z -= 60 * safeDelta;
        if (b.position.z < -SPAWN_DIST - 50) {
            b.active = false;
            continue;
        }

        for (const target of objectsRef.current) {
            if (!target.active) continue;
            const isDestructible = [ObjectType.OBSTACLE, ObjectType.ALIEN, ObjectType.DRONE, ObjectType.MISSILE].includes(target.type);
            
            if (isDestructible) {
                 const dx = Math.abs(b.position.x - target.position[0]);
                 const dz = Math.abs(b.position.z - target.position[2]);
                 if (dx < 1.4 && dz < 1.4) {
                     target.active = false;
                     b.active = false;
                     hasChanges = true;
                     window.dispatchEvent(new CustomEvent('particle-burst', { 
                         detail: { position: target.position, color: '#ffaa00' } 
                     }));
                     audio.playDamage(); 
                     break;
                 }
            }
        }
        if (b.active && bulletMeshRef.current) {
            _bulletDummy.position.copy(b.position);
            _bulletDummy.scale.setScalar(1.0);
            _bulletDummy.updateMatrix();
            bulletMeshRef.current.setMatrixAt(activeBulletCount, _bulletDummy.matrix);
            activeBulletCount++;
        }
    }
    if (bulletMeshRef.current) {
        bulletMeshRef.current.count = activeBulletCount;
        bulletMeshRef.current.instanceMatrix.needsUpdate = true;
    }
    if (bullets.length > 60) bulletsRef.current = bullets.filter(b => b.active);

    // Object Loop
    const currentObjects = objectsRef.current;
    const keptObjects: GameObject[] = [];
    const newSpawns: GameObject[] = [];

    for (const obj of currentObjects) {
        let moveAmount = dist;
        if (obj.type === ObjectType.MISSILE) moveAmount += 30 * safeDelta;
        
        const prevZ = obj.position[2];
        obj.position[2] += moveAmount;

        const isMagnetic = [ObjectType.GEM, ObjectType.LETTER, ObjectType.HEART, ObjectType.BULLET].includes(obj.type);
        if (gameState.isMagnetActive && obj.active && isMagnetic) {
            const dx = playerPos.x - obj.position[0];
            const dz = playerPos.z - obj.position[2];
            if ((dx*dx + dz*dz) < 150) {
                obj.position[0] += (dx * safeDelta * 8);
                obj.position[2] += (dz * safeDelta * 2);
            }
        }
        
        if (obj.type === ObjectType.DRONE) {
             const t = state.clock.elapsedTime * 2 + (obj.laneOffset || 0);
             const amplitude = (laneCount * GameConfig.LANE_WIDTH) / 2;
             obj.position[0] = Math.sin(t) * amplitude;
        }
        
        if (obj.type === ObjectType.ALIEN && obj.active && !obj.hasFired && obj.position[2] > -90) {
             obj.hasFired = true;
             newSpawns.push({
                 id: uuidv4(),
                 type: ObjectType.MISSILE,
                 position: [obj.position[0], 1.0, obj.position[2] + 2],
                 active: true,
                 color: '#ff0000'
             });
             hasChanges = true;
             window.dispatchEvent(new CustomEvent('particle-burst', { detail: { position: obj.position, color: '#ff00ff' } }));
        }

        let keep = true;
        if (obj.active) {
            const zThreshold = 2.0; 
            const inZZone = (prevZ < playerPos.z + zThreshold) && (obj.position[2] > playerPos.z - zThreshold);
            
            if (obj.type === ObjectType.SHOP_PORTAL && Math.abs(obj.position[2] - playerPos.z) < 2) {
                 gameState.openShop();
                 obj.active = false;
                 hasChanges = true;
                 keep = false; 
            } 
            else if (inZZone) {
                const dx = Math.abs(obj.position[0] - playerPos.x);
                if (dx < 0.9) { 
                     const isDamageSource = [ObjectType.OBSTACLE, ObjectType.ALIEN, ObjectType.MISSILE, ObjectType.DRONE].includes(obj.type);
                     if (isDamageSource) {
                         const playerTop = playerPos.y + 1.8; 
                         let objTop = obj.position[1] + 0.5;
                         let objBottom = obj.position[1] - 0.5;
                         if (obj.type === ObjectType.OBSTACLE) { objBottom = 0; objTop = 1.6; }
                         if (obj.type === ObjectType.MISSILE) { objBottom = 0.5; objTop = 1.5; }

                         if (playerPos.y < objTop && playerTop > objBottom) { 
                             window.dispatchEvent(new Event('player-hit'));
                             obj.active = false; 
                             hasChanges = true;
                             if (obj.type === ObjectType.MISSILE) {
                                window.dispatchEvent(new CustomEvent('particle-burst', { detail: { position: obj.position, color: '#ff4400' } }));
                             }
                         }
                     } else {
                         const dy = Math.abs(obj.position[1] - playerPos.y);
                         if (dy < 2.5) { 
                            switch(obj.type) {
                                case ObjectType.GEM: gameState.collectGem(obj.points || 50); audio.playGemCollect(); break;
                                case ObjectType.LETTER: if(obj.targetIndex !== undefined) { gameState.collectLetter(obj.targetIndex); audio.playLetterCollect(); } break;
                                case ObjectType.HEART: gameState.collectLife(); audio.playLifeUp(); break;
                                case ObjectType.MAGNET: gameState.activateMagnet(); audio.playMagnet(); break;
                                case ObjectType.MYSTERY_BOX: gameState.collectMysteryBox(); audio.playPowerUp(); break;
                                case ObjectType.INVINCIBILITY: gameState.activateVest(); audio.playShield(); break;
                                case ObjectType.SHIELD: gameState.activateShield(); audio.playShield(); break;
                                case ObjectType.JUMP_BOOTS: gameState.activateJumpBoots(); audio.playPowerUp(); break;
                                case ObjectType.BULLET: gameState.activateShooting(); audio.playPowerUp(); break;
                            }
                            window.dispatchEvent(new CustomEvent('particle-burst', { detail: { position: obj.position, color: obj.color || '#ffffff' } }));
                            obj.active = false;
                            hasChanges = true;
                         }
                     }
                }
            }
        }

        if (obj.position[2] > GameConfig.REMOVE_DISTANCE) {
            keep = false;
            hasChanges = true;
        }

        if (keep) keptObjects.push(obj);
    }

    if (newSpawns.length > 0) keptObjects.push(...newSpawns);

    // Spawning
    const staticObjects = keptObjects.filter(o => o.type !== ObjectType.MISSILE && o.type !== ObjectType.DRONE);
    const furthestZ = staticObjects.length > 0 ? Math.min(...staticObjects.map(o => o.position[2])) : -20;

    if (furthestZ > -SPAWN_DIST) {
         const spawnZ = Math.min(furthestZ - (12 + (gameState.speed * 0.4)), -SPAWN_DIST);

         if (gameState.isBonusStage) {
            const rand = Math.random();
            const maxLane = Math.floor(laneCount / 2);
            
            if (rand < 0.25) { 
                for (let i = -maxLane; i <= maxLane; i++) {
                    keptObjects.push({ id: uuidv4(), type: ObjectType.GEM, position: [i * GameConfig.LANE_WIDTH, 1.2, spawnZ], active: true, color: '#ffd700', points: 100 });
                }
            } else if (rand < 0.45) { 
                 const target = gameState.targetWord;
                 const availableIndices = target.map((_, i) => i).filter(i => !gameState.collectedLetters.includes(i));
                 if (availableIndices.length > 0) {
                     const chosenIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
                     keptObjects.push({
                        id: uuidv4(), type: ObjectType.LETTER, position: [getRandomLane(laneCount) * GameConfig.LANE_WIDTH, 1.0, spawnZ], 
                        active: true, color: LETTER_COLORS[chosenIndex % LETTER_COLORS.length], value: target[chosenIndex], targetIndex: chosenIndex
                     });
                 }
            } else if (rand < 0.6) {
                 const lane = getRandomLane(laneCount);
                 const pType = Math.random();
                 if (pType < 0.33) keptObjects.push({ id: uuidv4(), type: ObjectType.MAGNET, position: [lane * GameConfig.LANE_WIDTH, 1.0, spawnZ], active: true });
                 else if (pType < 0.66) keptObjects.push({ id: uuidv4(), type: ObjectType.SHIELD, position: [lane * GameConfig.LANE_WIDTH, 1.0, spawnZ], active: true });
                 else keptObjects.push({ id: uuidv4(), type: ObjectType.MYSTERY_BOX, position: [lane * GameConfig.LANE_WIDTH, 1.0, spawnZ], active: true });
            } else {
                keptObjects.push({ id: uuidv4(), type: ObjectType.GEM, position: [getRandomLane(laneCount) * GameConfig.LANE_WIDTH, 1.2, spawnZ], active: true, color: '#00ffff', points: 50 });
            }
            hasChanges = true;
         } 
         else if (gameState.isFeverMode) {
            const maxLane = Math.floor(laneCount / 2);
            for (let i = -maxLane; i <= maxLane; i++) {
                keptObjects.push({ id: uuidv4(), type: ObjectType.GEM, position: [i * GameConfig.LANE_WIDTH, 1.2, spawnZ], active: true, color: '#ffd700', points: 100 });
            }
            hasChanges = true;
         } 
         else {
             if (timeSinceLastLifeRef.current > 70) {
                 keptObjects.push({ id: uuidv4(), type: ObjectType.HEART, position: [getRandomLane(laneCount) * GameConfig.LANE_WIDTH, 1.2, spawnZ], active: true, color: '#ff0000' });
                 timeSinceLastLifeRef.current = 0;
                 hasChanges = true;
             } else {
                 const isLetterDue = distanceTraveled.current >= nextLetterDistance.current;
                 if (isLetterDue) {
                     const target = gameState.targetWord;
                     const availableIndices = target.map((_, i) => i).filter(i => !gameState.collectedLetters.includes(i));
                     if (availableIndices.length > 0) {
                         const chosenIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
                         keptObjects.push({
                            id: uuidv4(), type: ObjectType.LETTER, position: [getRandomLane(laneCount) * GameConfig.LANE_WIDTH, 1.0, spawnZ], 
                            active: true, color: LETTER_COLORS[chosenIndex % LETTER_COLORS.length], value: target[chosenIndex], targetIndex: chosenIndex
                         });
                         nextLetterDistance.current += getLetterInterval(level);
                         hasChanges = true;
                     } else {
                        keptObjects.push({ id: uuidv4(), type: ObjectType.GEM, position: [getRandomLane(laneCount) * GameConfig.LANE_WIDTH, 1.2, spawnZ], active: true, color: '#00ffff', points: 50 });
                        hasChanges = true;
                     }
                 } else if (Math.random() > 0.1) { 
                    const rand = Math.random();
                    if (rand < 0.15 && level > 1) { 
                         keptObjects.push({ id: uuidv4(), type: ObjectType.DRONE, position: [0, 1.0, spawnZ], active: true, color: '#ff0000', laneOffset: Math.random() * 10 });
                    } else if (rand > 0.90) { 
                         const lane = getRandomLane(laneCount);
                         const subRand = Math.random();
                         if (subRand < 0.2) keptObjects.push({ id: uuidv4(), type: ObjectType.MAGNET, position: [lane * GameConfig.LANE_WIDTH, 1.0, spawnZ], active: true });
                         else if (subRand < 0.4) keptObjects.push({ id: uuidv4(), type: ObjectType.MYSTERY_BOX, position: [lane * GameConfig.LANE_WIDTH, 1.0, spawnZ], active: true });
                         else if (subRand < 0.6) keptObjects.push({ id: uuidv4(), type: ObjectType.SHIELD, position: [lane * GameConfig.LANE_WIDTH, 1.0, spawnZ], active: true });
                         else if (subRand < 0.8) keptObjects.push({ id: uuidv4(), type: ObjectType.BULLET, position: [lane * GameConfig.LANE_WIDTH, 1.0, spawnZ], active: true, color: '#ffaa00' });
                         else keptObjects.push({ id: uuidv4(), type: ObjectType.JUMP_BOOTS, position: [lane * GameConfig.LANE_WIDTH, 1.0, spawnZ], active: true });
                    } else {
                        const isObstacle = Math.random() > 0.20;
                        if (isObstacle) {
                            if (level >= 2 && Math.random() < 0.2) {
                                keptObjects.push({ id: uuidv4(), type: ObjectType.ALIEN, position: [getRandomLane(laneCount) * GameConfig.LANE_WIDTH, 1.5, spawnZ], active: true, color: '#00ff00', hasFired: false });
                            } else {
                                const laneX = getRandomLane(laneCount) * GameConfig.LANE_WIDTH;
                                keptObjects.push({ id: uuidv4(), type: ObjectType.OBSTACLE, position: [laneX, 0.8, spawnZ], active: true, color: '#ff0054' });
                                if (Math.random() < 0.3) keptObjects.push({ id: uuidv4(), type: ObjectType.GEM, position: [laneX, 2.6, spawnZ], active: true, color: '#ffd700', points: 100 });
                            }
                        } else {
                            keptObjects.push({ id: uuidv4(), type: ObjectType.GEM, position: [getRandomLane(laneCount) * GameConfig.LANE_WIDTH, 1.2, spawnZ], active: true, color: '#00ffff', points: 50 });
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
      <instancedMesh ref={bulletMeshRef} args={[GEOMETRIES.PLAYER_BULLET, MATERIALS.PLAYER_BULLET, 100]} />
      {objectsRef.current.map(obj => obj.active ? <GameEntity key={obj.id} data={obj} isMobile={isMobile} /> : null)}
    </group>
  );
};

// --- Pure Render Component ---
const GameEntity: React.FC<{ data: GameObject, isMobile: boolean }> = React.memo(({ data, isMobile }) => {
    const groupRef = useRef<THREE.Group>(null);
    const visualRef = useRef<THREE.Group>(null);
    const shadowRef = useRef<THREE.Mesh>(null);
    const { laneCount } = useStore(); 
    
    useFrame((state, delta) => {
        if (!groupRef.current || !visualRef.current) return;
        
        groupRef.current.position.set(data.position[0], 0, data.position[2]);
        const baseHeight = data.position[1];
        
        // Simple Animations
        const time = state.clock.elapsedTime;
        if (data.type === ObjectType.SHOP_PORTAL) visualRef.current.scale.setScalar(1 + Math.sin(time * 2) * 0.02);
        else if (data.type === ObjectType.MISSILE) { visualRef.current.rotation.z += delta * 20; visualRef.current.position.y = baseHeight; }
        else if (data.type === ObjectType.ALIEN) { visualRef.current.position.y = baseHeight + Math.sin(time * 3) * 0.2; visualRef.current.rotation.y += delta; }
        else if (data.type === ObjectType.DRONE) { visualRef.current.rotation.y += delta * 5; visualRef.current.position.y = baseHeight; }
        else if (data.type !== ObjectType.OBSTACLE) {
            visualRef.current.rotation.y += delta * 3;
            visualRef.current.position.y = baseHeight + Math.sin(time * 4 + data.position[0]) * 0.1;
            if (shadowRef.current) shadowRef.current.scale.setScalar(1 - Math.sin(time * 4 + data.position[0]) * 0.1);
        } else {
            visualRef.current.position.y = baseHeight;
        }
    });

    const shadowGeo = useMemo(() => {
        switch(data.type) {
            case ObjectType.LETTER: return GEOMETRIES.SHADOW_LETTER;
            case ObjectType.GEM: return GEOMETRIES.SHADOW_CIRCLE_SMALL;
            case ObjectType.MISSILE: return GEOMETRIES.SHADOW_MISSILE;
            case ObjectType.SHOP_PORTAL: return null;
            default: return GEOMETRIES.SHADOW_DEFAULT;
        }
    }, [data.type]);

    return (
        <group ref={groupRef} position={[data.position[0], 0, data.position[2]]}>
            {/* Disable shadows on mobile objects to save draw calls if not using shadows anyway */}
            {shadowGeo && !isMobile && <mesh ref={shadowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} geometry={shadowGeo} material={MATERIALS.SHADOW} />}
            <group ref={visualRef} position={[0, data.position[1], 0]}>
                {data.type === ObjectType.SHOP_PORTAL && (
                    <group>
                         <mesh position={[0, 3, 0]} geometry={GEOMETRIES.SHOP_FRAME} scale={[laneCount * GameConfig.LANE_WIDTH + 2, 1, 1]} material={MATERIALS.SHOP_FRAME} />
                         <mesh position={[0, 2, 0]} geometry={GEOMETRIES.SHOP_BACK} scale={[laneCount * GameConfig.LANE_WIDTH, 1, 1]} material={MATERIALS.SHOP_BACK} />
                         <mesh position={[0, 3, 0]} geometry={GEOMETRIES.SHOP_OUTLINE} scale={[laneCount * GameConfig.LANE_WIDTH + 2.2, 1, 1]} material={MATERIALS.SHOP_OUTLINE} />
                         <Center position={[0, 5, 0.6]}>
                             <Text3D font={FONT_URL} size={1.2} height={0.2} curveSegments={isMobile ? 1 : 2} bevelSegments={0}>
                                 CYBER SHOP
                                 <meshBasicMaterial color="#ffff00" />
                             </Text3D>
                         </Center>
                         <mesh position={[0, 0.1, 0]} rotation={[-Math.PI/2, 0, 0]} geometry={GEOMETRIES.SHOP_FLOOR} scale={[laneCount * GameConfig.LANE_WIDTH, 1, 1]} material={MATERIALS.SHOP_FLOOR} />
                    </group>
                )}
                {data.type === ObjectType.OBSTACLE && (
                    <group>
                        <mesh geometry={GEOMETRIES.OBSTACLE} castShadow={!isMobile} receiveShadow={!isMobile} material={MATERIALS.OBSTACLE} />
                        <mesh scale={[1.02, 1.02, 1.02]} geometry={GEOMETRIES.OBSTACLE} material={MATERIALS.GLOW_WIRE}>
                             <meshBasicMaterial color={data.color} wireframe transparent opacity={0.3} />
                        </mesh>
                         <mesh position={[0, -0.8 + 0.05, 0]} rotation={[-Math.PI/2,0,0]} geometry={GEOMETRIES.RING_OBSTACLE}>
                             <meshBasicMaterial color={data.color} transparent opacity={0.4} side={THREE.DoubleSide} />
                         </mesh>
                    </group>
                )}
                {data.type === ObjectType.ALIEN && (
                    <group>
                        <mesh castShadow={!isMobile} geometry={GEOMETRIES.ALIEN_BODY} material={MATERIALS.ALIEN_BODY} />
                        <mesh position={[0, 0.2, 0]} geometry={GEOMETRIES.ALIEN_DOME} material={MATERIALS.ALIEN_DOME} />
                        <mesh position={[0.3, 0, 0.3]} geometry={GEOMETRIES.ALIEN_EYE} material={MATERIALS.WHITE_BASIC} />
                        <mesh position={[-0.3, 0, 0.3]} geometry={GEOMETRIES.ALIEN_EYE} material={MATERIALS.WHITE_BASIC} />
                    </group>
                )}
                {data.type === ObjectType.MISSILE && (
                    <group rotation={[Math.PI / 2, 0, 0]}>
                        <mesh geometry={GEOMETRIES.MISSILE_CORE} material={MATERIALS.MISSILE_CORE} />
                        <mesh position={[0, 1.0, 0]} geometry={GEOMETRIES.MISSILE_RING} material={MATERIALS.MISSILE_RING} />
                    </group>
                )}
                {data.type === ObjectType.DRONE && (
                    <group>
                        <mesh geometry={GEOMETRIES.DRONE} material={MATERIALS.DRONE_BODY} castShadow={!isMobile} />
                        <mesh geometry={GEOMETRIES.DRONE_SPIKE} position={[0.5, 0, 0]} rotation={[0, 0, -Math.PI/2]} material={MATERIALS.DRONE_LIGHT} />
                        <mesh geometry={GEOMETRIES.DRONE_SPIKE} position={[-0.5, 0, 0]} rotation={[0, 0, Math.PI/2]} material={MATERIALS.DRONE_LIGHT} />
                    </group>
                )}
                {data.type === ObjectType.MYSTERY_BOX && (
                    <group>
                        <mesh geometry={GEOMETRIES.GIFT} material={MATERIALS.GIFT} />
                        <Center position={[0, 0, 0.31]}>
                             <Text3D font={FONT_URL} size={0.4} height={0.05} curveSegments={isMobile ? 1 : 2} bevelSegments={0}>? <meshBasicMaterial color="#ffffff" /></Text3D>
                        </Center>
                    </group>
                )}
                {data.type === ObjectType.INVINCIBILITY && (
                    <group>
                        <mesh geometry={GEOMETRIES.VEST} material={MATERIALS.VEST} />
                        <mesh position={[0, 0.4, 0]}><torusGeometry args={[0.2, 0.05, 8, 16]} /><meshBasicMaterial color="#ffffff" /></mesh>
                    </group>
                )}
                {data.type === ObjectType.SHIELD && <mesh geometry={GEOMETRIES.SHIELD} material={MATERIALS.SHIELD} />}
                {data.type === ObjectType.BULLET && <group rotation={[0, 0, Math.PI/4]}><mesh geometry={GEOMETRIES.BULLET_ITEM} material={MATERIALS.BULLET} /></group>}
                {data.type === ObjectType.JUMP_BOOTS && (
                    <group>
                        <mesh position={[-0.2, 0, 0]} geometry={GEOMETRIES.BOOT} material={MATERIALS.BOOTS} />
                        <mesh position={[0.2, 0, 0]} geometry={GEOMETRIES.BOOT} material={MATERIALS.BOOTS} />
                        <mesh position={[-0.2, 0.2, 0]} geometry={GEOMETRIES.CYL_BOOT_DECO} material={MATERIALS.GREEN_BASIC} />
                        <mesh position={[0.2, 0.2, 0]} geometry={GEOMETRIES.CYL_BOOT_DECO} material={MATERIALS.GREEN_BASIC} />
                    </group>
                )}
                {data.type === ObjectType.GEM && <mesh geometry={GEOMETRIES.GEM} material={MATERIALS.GEM_BASE}><meshStandardMaterial color={data.color} roughness={0} metalness={1} emissive={data.color} emissiveIntensity={2} /></mesh>}
                {data.type === ObjectType.HEART && <mesh geometry={GEOMETRIES.HEART} material={MATERIALS.HEART} />}
                {data.type === ObjectType.MAGNET && <group rotation={[Math.PI, 0, 0]}><mesh geometry={GEOMETRIES.MAGNET} material={MATERIALS.MAGNET} /></group>}
                {data.type === ObjectType.LETTER && (
                    <group scale={[1.5, 1.5, 1.5]}>
                         <Center>
                             {/* HEAVY OPTIMIZATION: Reduce segments for mobile to prevent freezing during word spawn */}
                             <Text3D font={FONT_URL} size={0.8} height={0.5} bevelEnabled={!isMobile} bevelThickness={0.02} bevelSize={0.02} curveSegments={isMobile ? 1 : 2}>
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
