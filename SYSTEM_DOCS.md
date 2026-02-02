# Alfred Run - System Documentation

## Overview
Alfred Run is a high-performance, retro-futuristic endless runner built with **React**, **Three.js (React Three Fiber)**, and **Zustand**. The game runs entirely on the client-side, making it highly scalable and capable of handling thousands of users with minimal server costs.

## Tech Stack
*   **Framework**: React 18+
*   **3D Engine**: @react-three/fiber (Three.js wrapper)
*   **State Management**: Zustand
*   **Styling**: Tailwind CSS
*   **Icons**: Lucide React
*   **Post-Processing**: @react-three/postprocessing (Bloom, Vignette, Noise)

---

## 1. Directory Structure & Purpose

*   **`store.ts`**: The global state manager. Contains all game logic (score, health, power-up timers, collision results).
*   **`types.ts`**: TypeScript definitions and game constants (Speed, Lane Width, Colors).
*   **`App.tsx`**: The entry point. Sets up the 3D Canvas, Lighting, and Camera logic.
*   **`components/`**:
    *   **`World/LevelManager.tsx`**: The core game loop. Handles spawning objects, moving them, and collision detection.
    *   **`World/Player.tsx`**: The 3D player model, animations (jumping, running), and visual effects (shields, magnets).
    *   **`World/Environment.tsx`**: Background elements (Starfield, Moving Grid, Retro Sun).
    *   **`World/Effects.tsx`**: Visual post-processing effects.
    *   **`UI/HUD.tsx`**: The 2D overlay (Score, Main Menu, Shop, Game Over screen).
    *   **`System/Audio.ts`**: Sound effect synthesis (Game audio is generated via code, no mp3 files required).

---

## 2. Core Systems

### Object Pooling & Spawning
Instead of creating and destroying objects constantly (which causes lag), the `LevelManager` maintains an array of `GameObject` data.
*   **Spawning**: As the player moves, the system checks `furthestZ`. If there is space, it generates new objects (Obstacles, Gems, Power-ups) based on probability weights.
*   **Despawning**: Objects behind the player (`z > REMOVE_DISTANCE`) are filtered out of the array.

### Movement
The player stays at `z=0`. The entire world moves towards the player (`z` increases).
*   **Speed**: Controlled by `state.speed`. Increases over time or via "Fever Mode".
*   **Lanes**: The game uses 3 discrete lanes. Lane switching creates a smooth lerp (interpolation) on the Player's X-axis.

### Collision Detection
Collision is calculated in `LevelManager.tsx` inside the `useFrame` loop.
1.  It checks if an object is within a Z-threshold (close to player).
2.  It checks if the object is in the same Lane (X-axis).
3.  It checks Y-axis (for jumping over low obstacles or ducking under high ones).
4.  If collision occurs, it triggers `takeDamage()` or collecting logic.

---

## 3. Features & Power-ups

| Feature | Description | Implementation File |
| :--- | :--- | :--- |
| **Magnet** | Pulls gems towards the player. | `LevelManager.tsx` (Logic), `store.ts` (State) |
| **Shield** | Prevents 1 instance of damage. | `store.ts` (Logic), `Player.tsx` (Visual) |
| **Immortality Vest** | 10s of invincibility. | `store.ts` |
| **Jump Boots** | Allows double jumping for 15s. | `Player.tsx` (Input Logic) |
| **Mystery Box** | Grants random reward (Life, Score, Power-up). | `store.ts` (`collectMysteryBox`) |
| **Fever Mode** | Triggered by collecting word "ALFRED". Super speed + Invincibility. | `store.ts` |

---

## 4. How to Modify the Game

### Adding a New Obstacle or Item
1.  **Define Type**: Add a new entry to `ObjectType` enum in `types.ts`.
2.  **Create Geometry**: In `LevelManager.tsx`, define the `THREE.Geometry` and `Material` for the new object.
3.  **Add to Spawner**: In `LevelManager.tsx` inside the generation loop, add a probability check to push this new object type into the array.
4.  **Render**: inside the `GameEntity` component in `LevelManager.tsx`, add a condition to render the new geometry based on the type.
5.  **Logic**: In `LevelManager.tsx` (collision loop) or `store.ts`, define what happens when the player hits it.

### Changing Game Balance (Speed, Difficulty)
*   **Base Speed**: Modify `RUN_SPEED_BASE` in `types.ts`.
*   **Spawn Rate**: Modify `SPAWN_DISTANCE` or the probability math in `LevelManager.tsx`.
*   **Power-up Duration**: Modify constants like `IMMORTALITY_VEST_DURATION` in `types.ts`.

### Removing a Feature
1.  Remove the spawning logic in `LevelManager.tsx`.
2.  Remove the type from `types.ts` (optional, but cleaner).
3.  Remove the render logic in `GameEntity`.

---

## 5. Hosting & Scalability Guide

### Concurrent Users Strategy
Since this is a client-side game, the server only serves static assets.
*   **1000 Daily Users / 400 Concurrent**: A standard CDN (Content Delivery Network) can handle this effortlessly.
*   **Recommended Hosts**:
    *   **Vercel / Netlify**: Free tier is likely sufficient, Pro tier guarantees performance.
    *   **AWS S3 + CloudFront**: extremely cheap for static hosting.

### Performance Optimizations (Already Implemented)
*   **Geometry Re-use**: Geometries are created once outside the render loop.
*   **Instanced Mesh**: Particles use instancing to render hundreds of objects with 1 draw call.
*   **Despawning**: Aggressive cleanup of objects behind the camera.
*   **Synthesized Audio**: No large audio files to download, reducing bandwidth costs.

### Future Backend Needs
If you want a **Global Leaderboard**, you will need a small backend (e.g., Firebase, Supabase, or a simple Node.js API).
1.  **Database**: Store `username` and `score`.
2.  **API**: `POST /score` (when game ends), `GET /leaderboard` (on menu load).
