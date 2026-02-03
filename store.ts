/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import { create } from 'zustand';
import { GameStatus, RUN_SPEED_BASE, IMMORTALITY_DURATION, IMMORTALITY_VEST_DURATION, IMMORTALITY_COOLDOWN, MAGNET_DURATION, JUMP_BOOTS_DURATION, BULLET_DURATION } from './types';

interface GameState {
  status: GameStatus;
  score: number;
  highScore: number;
  lives: number;
  maxLives: number;
  speed: number;
  collectedLetters: number[]; 
  targetWord: string[]; 
  level: number;
  laneCount: number;
  gemsCollected: number;
  distance: number;
  
  // Inventory / Abilities
  hasDoubleJump: boolean; // Permanent/Shop
  tempDoubleJumpActive: boolean; // From Boots pickup
  hasImmortality: boolean; // Shop ability
  isImmortalityActive: boolean;
  immortalityLastUsed: number;
  hasShield: boolean;
  
  // New Features
  isFeverMode: boolean;
  isMagnetActive: boolean;
  isShootingActive: boolean;
  combo: number; // Current combo counter
  multiplier: number; // Score multiplier (e.g. 1x, 2x, 3x)

  // Actions
  enterBriefing: () => void; // Transition to briefing screen
  startGame: () => void;
  goToMenu: () => void; // Abort mission
  setTargetWord: (word: string) => void;
  restartGame: () => void;
  togglePause: () => void;
  takeDamage: () => void;
  addScore: (amount: number) => void;
  collectGem: (value: number) => void;
  collectLife: () => void;
  activateMagnet: () => void;
  applyTimeSpeedBoost: () => void;
  collectLetter: (index: number) => void;
  setStatus: (status: GameStatus) => void;
  setDistance: (dist: number) => void;
  
  // Powerups
  collectMysteryBox: () => void;
  activateVest: () => void;
  activateJumpBoots: () => void;
  activateShield: () => void;
  activateShooting: () => void;

  // Shop / Abilities
  buyItem: (type: 'DOUBLE_JUMP' | 'MAX_LIFE' | 'HEAL' | 'IMMORTAL' | 'MAGNET', cost: number) => boolean;
  advanceLevel: () => void;
  openShop: () => void;
  closeShop: () => void;
  activateImmortality: () => void;
}

const DEFAULT_TARGET = ['A', 'L', 'F', 'R', 'E', 'D'];
const MAX_LEVEL = 100; // Increased to allow day/night cycles

// Helper to get high score safely
const getStoredHighScore = () => {
    try {
        const stored = localStorage.getItem('alfred_run_highscore');
        return stored ? parseInt(stored, 10) : 0;
    } catch {
        return 0;
    }
};

export const useStore = create<GameState>((set, get) => ({
  status: GameStatus.MENU,
  score: 0,
  highScore: getStoredHighScore(),
  lives: 3,
  maxLives: 3,
  speed: 0,
  collectedLetters: [],
  targetWord: DEFAULT_TARGET,
  level: 1,
  laneCount: 3,
  gemsCollected: 0,
  distance: 0,
  
  hasDoubleJump: false,
  tempDoubleJumpActive: false,
  hasImmortality: false,
  isImmortalityActive: false,
  immortalityLastUsed: 0,
  hasShield: false,

  isFeverMode: false,
  isMagnetActive: false,
  isShootingActive: false,
  combo: 0,
  multiplier: 1,

  setTargetWord: (word: string) => {
    const cleanWord = word.toUpperCase().replace(/[^A-Z]/g, '').split('').slice(0, 8); 
    if (cleanWord.length > 0) {
        set({ targetWord: cleanWord });
    } else {
        set({ targetWord: DEFAULT_TARGET });
    }
  },

  enterBriefing: () => set({
    status: GameStatus.BRIEFING,
    score: 0, 
    lives: 3, 
    maxLives: 3,
    speed: RUN_SPEED_BASE,
    collectedLetters: [],
    level: 1,
    laneCount: 3,
    gemsCollected: 0,
    distance: 0,
    hasDoubleJump: false,
    tempDoubleJumpActive: false,
    hasImmortality: false,
    isImmortalityActive: false,
    immortalityLastUsed: 0,
    hasShield: false,
    isFeverMode: false,
    isMagnetActive: false,
    isShootingActive: false,
    combo: 0,
    multiplier: 1
  }),

  startGame: () => set({ 
    status: GameStatus.PLAYING, 
  }),

  goToMenu: () => set({
    status: GameStatus.MENU,
    score: 0,
    collectedLetters: [],
    level: 1,
    speed: 0
  }),

  restartGame: () => set({ 
    status: GameStatus.PLAYING, 
    score: 0, 
    lives: 3, 
    maxLives: 3,
    speed: RUN_SPEED_BASE,
    collectedLetters: [],
    level: 1,
    laneCount: 3,
    gemsCollected: 0,
    distance: 0,
    hasDoubleJump: false,
    tempDoubleJumpActive: false,
    hasImmortality: false,
    isImmortalityActive: false,
    immortalityLastUsed: 0,
    hasShield: false,
    isFeverMode: false,
    isMagnetActive: false,
    isShootingActive: false,
    combo: 0,
    multiplier: 1
  }),

  togglePause: () => set((state) => {
    if (state.status === GameStatus.PLAYING) {
        return { status: GameStatus.PAUSED };
    } else if (state.status === GameStatus.PAUSED) {
        return { status: GameStatus.PLAYING };
    }
    return {};
  }),

  takeDamage: () => {
    const { lives, isImmortalityActive, hasShield, score, highScore } = get();
    
    if (isImmortalityActive) return; 

    // Shield protection
    if (hasShield) {
        set({ hasShield: false });
        // Grant brief flicker invincibility handled by Player component on hit event
        return; 
    }

    // Reset Combo on hit
    set({ combo: 0, multiplier: 1 });

    if (lives > 1) {
      set({ lives: lives - 1 });
    } else {
      let newHighScore = highScore;
      if (score > highScore) {
          newHighScore = score;
          localStorage.setItem('alfred_run_highscore', score.toString());
      }
      set({ lives: 0, status: GameStatus.GAME_OVER, speed: 0, highScore: newHighScore });
    }
  },

  addScore: (amount) => set((state) => ({ score: state.score + amount })),
  
  collectGem: (value) => set((state) => {
      const newCombo = state.combo + 1;
      // Increase multiplier every 10 gems, max 5x
      const newMultiplier = Math.min(5, Math.floor(newCombo / 10) + 1);
      
      return { 
        score: state.score + (value * newMultiplier), 
        gemsCollected: state.gemsCollected + 1,
        combo: newCombo,
        multiplier: newMultiplier
      };
  }),

  collectLife: () => set((state) => ({
    lives: Math.min(state.lives + 1, state.maxLives)
  })),

  activateMagnet: () => {
      set({ isMagnetActive: true });
      setTimeout(() => {
          set({ isMagnetActive: false });
      }, MAGNET_DURATION);
  },

  activateShooting: () => {
      set({ isShootingActive: true });
      setTimeout(() => {
          set({ isShootingActive: false });
      }, BULLET_DURATION);
  },
  
  activateVest: () => {
      // 10 second immortality
      set({ isImmortalityActive: true });
      setTimeout(() => {
          const { isFeverMode } = get();
          if (!isFeverMode) {
              set({ isImmortalityActive: false });
          }
      }, IMMORTALITY_VEST_DURATION);
  },

  activateJumpBoots: () => {
      set({ tempDoubleJumpActive: true });
      setTimeout(() => {
          set({ tempDoubleJumpActive: false });
      }, JUMP_BOOTS_DURATION);
  },

  activateShield: () => set({ hasShield: true }),

  collectMysteryBox: () => {
      const rand = Math.random();
      const { lives, maxLives } = get();
      
      if (rand < 0.2 && lives < maxLives) {
          // Heal
          get().collectLife();
      } else if (rand < 0.35) {
          // Bullet
          get().activateShooting();
      } else if (rand < 0.5) {
          // Score Bonus
          get().addScore(500);
      } else if (rand < 0.7) {
          // Magnet
          get().activateMagnet();
      } else if (rand < 0.85) {
          // Shield
          get().activateShield();
      } else {
          // Big Score
          get().addScore(1000);
      }
  },

  applyTimeSpeedBoost: () => set((state) => ({
      speed: state.speed + 5 
  })),

  setDistance: (dist) => set({ distance: dist }),

  collectLetter: (index) => {
    const { collectedLetters, level, speed, targetWord, isFeverMode } = get();
    
    if (isFeverMode) return;

    if (!collectedLetters.includes(index)) {
      const newLetters = [...collectedLetters, index];
      const speedIncrease = RUN_SPEED_BASE * 0.10;
      const nextSpeed = speed + speedIncrease;

      set({ 
        collectedLetters: newLetters,
        speed: nextSpeed,
        // Also boost combo
        combo: get().combo + 5,
        multiplier: Math.min(5, Math.floor((get().combo + 5) / 10) + 1)
      });

      if (newLetters.length === targetWord.length) {
          set({ isFeverMode: true, isImmortalityActive: true, isShootingActive: true }); // Auto shoot in fever mode
          set({ speed: nextSpeed * 1.5 });

          setTimeout(() => {
              const current = get();
              if (current.status !== GameStatus.PLAYING) return;
              set({ isFeverMode: false, isImmortalityActive: false, isShootingActive: false });
              
              if (current.level < MAX_LEVEL) {
                   current.advanceLevel();
              } else {
                   const finalScore = current.score + 5000;
                   let newHighScore = current.highScore;
                   if (finalScore > newHighScore) {
                       newHighScore = finalScore;
                       localStorage.setItem('alfred_run_highscore', finalScore.toString());
                   }
                   set({ status: GameStatus.VICTORY, score: finalScore, highScore: newHighScore });
              }
          }, 5000);
      }
    }
  },

  advanceLevel: () => {
      const { level, laneCount, speed } = get();
      const nextLevel = level + 1;
      const newSpeed = (RUN_SPEED_BASE * (1 + (0.4 * nextLevel))); 

      set({
          level: nextLevel,
          laneCount: Math.min(laneCount + 2, 9), 
          status: GameStatus.PLAYING, 
          speed: newSpeed,
          collectedLetters: [] 
      });
  },

  openShop: () => set({ status: GameStatus.SHOP }),
  
  closeShop: () => set({ status: GameStatus.PLAYING }),

  buyItem: (type, cost) => {
      const { score, maxLives, lives } = get();
      
      if (score >= cost) {
          set({ score: score - cost });
          
          switch (type) {
              case 'DOUBLE_JUMP':
                  set({ hasDoubleJump: true });
                  break;
              case 'MAX_LIFE':
                  set({ maxLives: maxLives + 1, lives: lives + 1 });
                  break;
              case 'HEAL':
                  set({ lives: Math.min(lives + 1, maxLives) });
                  break;
              case 'IMMORTAL':
                  set({ hasImmortality: true });
                  break;
              case 'MAGNET':
                  get().activateMagnet(); // Activate immediately upon purchase
                  break;
          }
          return true;
      }
      return false;
  },

  activateImmortality: () => {
      const { hasImmortality, isImmortalityActive, immortalityLastUsed, isFeverMode } = get();
      
      if (isFeverMode) return;

      const now = Date.now();
      
      if (hasImmortality && !isImmortalityActive) {
          if (now - immortalityLastUsed >= IMMORTALITY_COOLDOWN) {
              set({ isImmortalityActive: true, immortalityLastUsed: now });
              
              setTimeout(() => {
                  if (!get().isFeverMode) {
                      set({ isImmortalityActive: false });
                  }
              }, IMMORTALITY_DURATION);
          }
      }
  },

  setStatus: (status) => set({ status }),
  increaseLevel: () => set((state) => ({ level: state.level + 1 })),
}));
