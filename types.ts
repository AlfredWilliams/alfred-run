/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


export enum GameStatus {
  MENU = 'MENU',
  BRIEFING = 'BRIEFING', // New status for loading/mission context
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
  INVINCIBILITY = 'INVINCIBILITY', // The Vest
  JUMP_BOOTS = 'JUMP_BOOTS',
  SHIELD = 'SHIELD',
  BULLET = 'BULLET', // The pickup item
  PLAYER_BULLET = 'PLAYER_BULLET' // The actual projectile
}

export interface GameObject {
  id: string;
  type: ObjectType;
  position: [number, number, number]; // x, y, z
  active: boolean;
  value?: string; // For letters (G, E, M...)
  color?: string;
  targetIndex?: number; // Index in the GEMINI target word
  points?: number; // Score value for gems
  hasFired?: boolean; // For Aliens
  laneOffset?: number; // For Drones (animation phase)
}

export const LANE_WIDTH = 2.2;
export const JUMP_HEIGHT = 2.5;
export const JUMP_DURATION = 0.6; // seconds
export const RUN_SPEED_BASE = 22.5;
export const SPAWN_DISTANCE = 120;
export const REMOVE_DISTANCE = 20; // Behind player

// --- Power Up Durations (Increased) ---
export const IMMORTALITY_DURATION = 8000; // Ability: 5s -> 8s
export const IMMORTALITY_VEST_DURATION = 15000; // Vest: 10s -> 15s
export const JUMP_BOOTS_DURATION = 20000; // Boots: 15s -> 20s
export const IMMORTALITY_COOLDOWN = 20000; 
export const MAGNET_DURATION = 20000; // Magnet: 10s -> 20s
export const BULLET_DURATION = 14000; // 14 seconds

// Standard Neon Colors for letters
export const LETTER_COLORS = [
    '#2979ff', // Blue
    '#ff1744', // Red
    '#ffea00', // Yellow
    '#2979ff', // Blue
    '#00e676', // Green
    '#ff1744', // Red
];

export interface ShopItem {
    id: string;
    name: string;
    description: string;
    cost: number;
    icon: any; // Lucide icon component
    oneTime?: boolean; // If true, remove from pool after buying
}
