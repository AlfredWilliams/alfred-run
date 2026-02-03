/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { create } from 'zustand';
import { 
    GameStatus, 
    GameConfig, 
    BONUS_WORDS, 
    STANDARD_WORDS 
} from './types';

interface GameState {
  // --- Core State ---
  status: GameStatus;
  score: number;
  highScore: number;
  lives: number;
  maxLives: number;
  level: number;
  distance: number;
  laneCount: number;
  
  // --- Movement & Environment ---
  speed: number;
  
  // --- Collection Mechanism ---
  targetWord: string[]; 
  collectedLetters: number[]; 
  gemsCollected: number;
  
  // --- Modifiers & Abilities ---
  combo: number; 
  multiplier: number;
  
  // Inventory / Buffs
  hasDoubleJump: boolean;
  tempDoubleJumpActive: boolean;
  
  hasImmortality: boolean; // Purchased ability
  isImmortalityActive: boolean;
  immortalityLastUsed: number;
  
  hasShield: boolean;
  
  // Active Powerup States
  isMagnetActive: boolean;
  isShootingActive: boolean;
  
  // Game Modes
  isFeverMode: boolean;
  isBonusStage: boolean;

  // --- Actions ---
  // Lifecycle
  enterBriefing: () => void;
  startGame: () => void;
  goToMenu: () => void;
  togglePause: () => void;
  restartGame: () => void;
  
  // Inputs & Events
  setTargetWord: (word: string) => void;
  takeDamage: () => void;
  addScore: (amount: number) => void;
  collectGem: (value: number) => void;
  collectLife: () => void;
  collectLetter: (index: number) => void;
  setDistance: (dist: number) => void;
  
  // Ability Activations
  activateMagnet: () => void;
  activateShooting: () => void;
  activateVest: () => void;
  activateJumpBoots: () => void;
  activateShield: () => void;
  activateImmortality: () => void;
  collectMysteryBox: () => void;
  
  // Progression
  buyItem: (type: string, cost: number) => boolean;
  openShop: () => void;
  closeShop: () => void;
  applyTimeSpeedBoost: () => void;
  advanceLevel: () => void;
}

// Helper to get high score safely
const getStoredHighScore = () => {
    try {
        const stored = localStorage.getItem('alfred_run_highscore');
        return stored ? parseInt(stored, 10) : 0;
    } catch {
        return 0;
    }
};

const getRandomWord = (pool: string[]) => {
    return pool[Math.floor(Math.random() * pool.length)].split('');
};

const INITIAL_STATE = {
    score: 0,
    lives: 3,
    maxLives: 3,
    speed: GameConfig.RUN_SPEED_BASE,
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
    isBonusStage: false,
    isMagnetActive: false,
    isShootingActive: false,
    combo: 0,
    multiplier: 1
};

export const useStore = create<GameState>((set, get) => ({
  status: GameStatus.MENU,
  highScore: getStoredHighScore(),
  targetWord: ['A', 'L', 'F', 'R', 'E', 'D'], // Default
  ...INITIAL_STATE,

  setTargetWord: (word: string) => {
    const cleanWord = word.toUpperCase().replace(/[^A-Z]/g, '').split('').slice(0, 8); 
    set({ targetWord: cleanWord.length > 0 ? cleanWord : ['A', 'L', 'F', 'R', 'E', 'D'] });
  },

  enterBriefing: () => set({
    status: GameStatus.BRIEFING,
    ...INITIAL_STATE,
    // Keep targetWord as set by user or default
  }),

  startGame: () => set({ status: GameStatus.PLAYING }),

  goToMenu: () => set({
    status: GameStatus.MENU,
    score: 0,
    collectedLetters: [],
    level: 1,
    speed: 0
  }),

  restartGame: () => set({ 
    status: GameStatus.PLAYING, 
    ...INITIAL_STATE
  }),

  togglePause: () => set((state) => ({
    status: state.status === GameStatus.PLAYING ? GameStatus.PAUSED : 
            state.status === GameStatus.PAUSED ? GameStatus.PLAYING : state.status
  })),

  takeDamage: () => {
    const { lives, isImmortalityActive, hasShield, score, highScore, isBonusStage } = get();
    
    if (isImmortalityActive || isBonusStage) return; // Invincible in bonus

    if (hasShield) {
        set({ hasShield: false });
        return; 
    }

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

  // --- Power Ups ---
  activateMagnet: () => {
      set({ isMagnetActive: true });
      setTimeout(() => set({ isMagnetActive: false }), GameConfig.DURATIONS.MAGNET);
  },

  activateShooting: () => {
      set({ isShootingActive: true });
      setTimeout(() => set({ isShootingActive: false }), GameConfig.DURATIONS.BULLET);
  },
  
  activateVest: () => {
      set({ isImmortalityActive: true });
      setTimeout(() => {
          if (!get().isFeverMode) set({ isImmortalityActive: false });
      }, GameConfig.DURATIONS.IMMORTALITY_VEST);
  },

  activateJumpBoots: () => {
      set({ tempDoubleJumpActive: true });
      setTimeout(() => set({ tempDoubleJumpActive: false }), GameConfig.DURATIONS.JUMP_BOOTS);
  },

  activateShield: () => set({ hasShield: true }),

  collectMysteryBox: () => {
      const rand = Math.random();
      const { lives, maxLives } = get();
      const actions = [
          { weight: 0.2, check: lives < maxLives, act: get().collectLife },
          { weight: 0.35, check: true, act: get().activateShooting },
          { weight: 0.5, check: true, act: () => get().addScore(500) },
          { weight: 0.7, check: true, act: get().activateMagnet },
          { weight: 0.85, check: true, act: get().activateShield },
          { weight: 1.0, check: true, act: () => get().addScore(1000) }
      ];
      
      const selected = actions.find(a => rand < a.weight && a.check) || actions[actions.length - 1];
      selected.act();
  },

  applyTimeSpeedBoost: () => set((state) => ({
      // Fixed speed in bonus stage, otherwise accelerate
      speed: state.isBonusStage ? state.speed : state.speed + 5 
  })),

  setDistance: (dist) => set({ distance: dist }),

  collectLetter: (index) => {
    const { collectedLetters, speed, targetWord, isFeverMode, isBonusStage } = get();
    
    if (isFeverMode) return; // Ignore collections during fever

    if (!collectedLetters.includes(index)) {
      const newLetters = [...collectedLetters, index];
      
      // Speed up slightly on collection (unless in bonus)
      const nextSpeed = isBonusStage ? speed : speed + (GameConfig.RUN_SPEED_BASE * 0.10);

      set({ 
        collectedLetters: newLetters,
        speed: nextSpeed,
        combo: get().combo + 5,
        multiplier: Math.min(5, Math.floor((get().combo + 5) / 10) + 1)
      });

      // --- WORD COMPLETION LOGIC ---
      if (newLetters.length === targetWord.length) {
          
          if (isBonusStage) {
              // BONUS STAGE COMPLETE: Trigger Fever then Advance
              set({ isFeverMode: true, isImmortalityActive: true, isShootingActive: true });
              set({ speed: Math.max(speed, GameConfig.RUN_SPEED_BASE * 2.5) }); 

              setTimeout(() => {
                  if (get().status !== GameStatus.PLAYING) return;
                  set({ isFeverMode: false, isImmortalityActive: false, isShootingActive: false });
                  get().advanceLevel(); // Advance AFTER fever ends
              }, 5000);

          } else {
              // NORMAL STAGE COMPLETE: Fever then Advance
              set({ isFeverMode: true, isImmortalityActive: true, isShootingActive: true });
              set({ speed: Math.max(speed, GameConfig.RUN_SPEED_BASE * 2.5) });

              setTimeout(() => {
                  if (get().status !== GameStatus.PLAYING) return;
                  
                  set({ isFeverMode: false, isImmortalityActive: false, isShootingActive: false });
                  
                  if (get().level < GameConfig.MAX_LEVEL) {
                       get().advanceLevel();
                  } else {
                       // Victory
                       const finalScore = get().score + 5000;
                       let newHighScore = get().highScore;
                       if (finalScore > newHighScore) {
                           newHighScore = finalScore;
                           localStorage.setItem('alfred_run_highscore', finalScore.toString());
                       }
                       set({ status: GameStatus.VICTORY, score: finalScore, highScore: newHighScore });
                  }
              }, 5000);
          }
      }
    }
  },

  advanceLevel: () => {
      const { level, laneCount } = get();
      const nextLevel = level + 1;
      
      // Check if next level is a Bonus Stage (Level 4, 8, 12...)
      const isNextBonus = nextLevel % 4 === 0;

      if (isNextBonus) {
          set({
              level: nextLevel,
              isBonusStage: true,
              targetWord: getRandomWord(BONUS_WORDS),
              collectedLetters: [],
              speed: GameConfig.RUN_SPEED_BASE * 2.0, 
              isMagnetActive: true // Auto-magnet for bonus fun
          });
          // Note: No timeout here. Stage ends when word is complete.
      } else {
          // Normal Level
          const newSpeed = (GameConfig.RUN_SPEED_BASE * (1 + (0.4 * nextLevel))); 
          
          set({
              level: nextLevel,
              laneCount: Math.min(laneCount + 2, 9), 
              status: GameStatus.PLAYING, 
              speed: newSpeed,
              collectedLetters: [],
              isBonusStage: false,
              isMagnetActive: false,
              // Level 1 keeps user word (or default), Level 2+ gets random words
              targetWord: getRandomWord(STANDARD_WORDS)
          });
      }
  },

  openShop: () => set({ status: GameStatus.SHOP }),
  closeShop: () => set({ status: GameStatus.PLAYING }),

  buyItem: (type, cost) => {
      const { score, maxLives, lives } = get();
      
      if (score >= cost) {
          set({ score: score - cost });
          
          switch (type) {
              case 'DOUBLE_JUMP': set({ hasDoubleJump: true }); break;
              case 'MAX_LIFE': set({ maxLives: maxLives + 1, lives: lives + 1 }); break;
              case 'HEAL': set({ lives: Math.min(lives + 1, maxLives) }); break;
              case 'IMMORTAL': set({ hasImmortality: true }); break;
              case 'MAGNET': get().activateMagnet(); break;
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
          if (now - immortalityLastUsed >= GameConfig.DURATIONS.COOLDOWN_IMMORTALITY) {
              set({ isImmortalityActive: true, immortalityLastUsed: now });
              
              setTimeout(() => {
                  if (!get().isFeverMode) set({ isImmortalityActive: false });
              }, GameConfig.DURATIONS.IMMORTALITY_ABILITY);
          }
      }
  },
}));
