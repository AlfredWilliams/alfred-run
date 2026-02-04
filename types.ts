/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// --- Global Type Augmentation for React Three Fiber ---
import { ThreeElements } from '@react-three/fiber'

declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

// --- Enums ---
export enum GameStatus {
  MENU = 'MENU',
  BRIEFING = 'BRIEFING',
  PLAYING = 'PLAYING',
  SHOP = 'SHOP',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY',
  PAUSED = 'PAUSED'
}

export enum ObjectType {
  OBSTACLE = 'OBSTACLE',
  GEM = 'GEM',
  LETTER = 'LETTER',
  SHOP_PORTAL = 'SHOP_PORTAL',
  ALIEN = 'ALIEN',
  MISSILE = 'MISSILE',
  HEART = 'HEART',
  MAGNET = 'MAGNET',
  DRONE = 'DRONE',
  MYSTERY_BOX = 'MYSTERY_BOX',
  INVINCIBILITY = 'INVINCIBILITY',
  JUMP_BOOTS = 'JUMP_BOOTS',
  SHIELD = 'SHIELD',
  BULLET = 'BULLET', 
  PLAYER_BULLET = 'PLAYER_BULLET'
}

// --- Interfaces ---
export interface GameObject {
  id: string;
  type: ObjectType;
  position: [number, number, number]; // [x, y, z]
  active: boolean;
  value?: string;       // For letters
  color?: string;       // Dynamic coloring
  targetIndex?: number; // Index in the target word array
  points?: number;      // Score value
  hasFired?: boolean;   // AI State
  laneOffset?: number;  // Animation State
}

export interface ShopItem {
    id: string;
    name: string;
    description: string;
    cost: number;
    icon: any; // Lucide icon component type
    oneTime?: boolean;
}

// --- Configuration Constants ---
export const GameConfig = {
    LANE_WIDTH: 2.2,
    JUMP_HEIGHT: 2.5,
    RUN_SPEED_BASE: 22.5,
    SPAWN_DISTANCE: 120,
    REMOVE_DISTANCE: 20,
    MAX_LEVEL: 100,
    
    // Durations (ms)
    DURATIONS: {
        IMMORTALITY_ABILITY: 8000,
        IMMORTALITY_VEST: 15000,
        JUMP_BOOTS: 20000,
        MAGNET: 20000,
        BULLET: 14000,
        COOLDOWN_IMMORTALITY: 20000,
    }
};

// --- Exported Constants for Components ---
export const LANE_WIDTH = GameConfig.LANE_WIDTH;
export const RUN_SPEED_BASE = GameConfig.RUN_SPEED_BASE;
export const IMMORTALITY_DURATION = GameConfig.DURATIONS.IMMORTALITY_ABILITY;
export const IMMORTALITY_COOLDOWN = GameConfig.DURATIONS.COOLDOWN_IMMORTALITY;

// --- Dictionaries ---
export const BONUS_WORDS = [
    'GAME', 'FOOD', 'TREAT', 'TREATMENT', 
    'SHOWINESS', 'HAPPY', 'HAPPINESS', 'JOLLOF',
    'BONUS', 'PRIZE', 'WEALTH', 'GOLDEN'
];

export const STANDARD_WORDS = [
    'ALFRED', 'REACT', 'THREE', 'SPEED', 'LIGHT', 
    'CYBER', 'NEON', 'SPACE', 'PILOT', 'DODGE', 
    'LASER', 'SYNTH', 'WAVE', 'FUTURE', 'ROBOT',
    'METAL', 'CHROME', 'TURBO', 'DRIFT', 'POWER'
];

export const LETTER_COLORS = [
    '#2979ff', // Blue
    '#ff1744', // Red
    '#ffea00', // Yellow
    '#00e676', // Green
    '#d500f9', // Purple
    '#ff9100', // Orange
];
