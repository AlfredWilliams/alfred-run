/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, useEffect } from 'react';
import { Heart, Zap, Trophy, MapPin, Diamond, Rocket, ArrowUpCircle, Shield, Activity, PlusCircle, Play, Lock, Edit3, Pause, Settings, Magnet, Terminal, Cpu, Radio } from 'lucide-react';
import { useStore } from '../../store';
import { GameStatus, LETTER_COLORS, ShopItem, RUN_SPEED_BASE, IMMORTALITY_DURATION, IMMORTALITY_COOLDOWN } from '../../types';
import { audio } from '../System/Audio';

// Available Shop Items
const SHOP_ITEMS: ShopItem[] = [
    {
        id: 'DOUBLE_JUMP',
        name: 'DOUBLE JUMP',
        description: 'Jump again in mid-air. Essential for high obstacles.',
        cost: 1000,
        icon: ArrowUpCircle,
        oneTime: true
    },
    {
        id: 'MAX_LIFE',
        name: 'MAX LIFE UP',
        description: 'Permanently adds a heart slot and heals you.',
        cost: 1500,
        icon: Activity
    },
    {
        id: 'HEAL',
        name: 'REPAIR KIT',
        description: 'Restores 1 Life point instantly.',
        cost: 1000,
        icon: PlusCircle
    },
    {
        id: 'IMMORTAL',
        name: 'IMMORTALITY',
        description: 'Unlock Ability: Press Space/Tap to be invincible for 5s.',
        cost: 3000,
        icon: Shield,
        oneTime: true
    },
    {
        id: 'MAGNET',
        name: 'MAGNET ACTIVATION',
        description: 'Activates the magnet for 10s. Pulls gems!',
        cost: 500,
        icon: Magnet
    }
];

const ShopScreen: React.FC = () => {
    // Select only what we need for the shop
    const score = useStore(s => s.score);
    const hasDoubleJump = useStore(s => s.hasDoubleJump);
    const hasImmortality = useStore(s => s.hasImmortality);
    const buyItem = useStore(s => s.buyItem);
    const closeShop = useStore(s => s.closeShop);
    
    const [items, setItems] = useState<ShopItem[]>([]);

    useEffect(() => {
        let pool = SHOP_ITEMS.filter(item => {
            if (item.id === 'DOUBLE_JUMP' && hasDoubleJump) return false;
            if (item.id === 'IMMORTAL' && hasImmortality) return false;
            return true;
        });

        pool = pool.sort(() => 0.5 - Math.random());
        setItems(pool.slice(0, 3));
    }, []);

    return (
        <div className="absolute inset-0 bg-black/90 z-[100] text-white pointer-events-auto backdrop-blur-md overflow-y-auto">
             <div className="flex flex-col items-center justify-center min-h-full py-8 px-4">
                 <h2 className="text-3xl md:text-4xl font-black text-cyan-400 mb-2 font-cyber tracking-widest text-center">CYBER SHOP</h2>
                 <div className="flex items-center text-yellow-400 mb-6 md:mb-8">
                     <span className="text-base md:text-lg mr-2">AVAILABLE CREDITS:</span>
                     <span className="text-xl md:text-2xl font-bold">{score.toLocaleString()}</span>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl w-full mb-8">
                     {items.map(item => {
                         const Icon = item.icon;
                         const canAfford = score >= item.cost;
                         return (
                             <div key={item.id} className="bg-gray-900/80 border border-gray-700 p-4 md:p-6 rounded-xl flex flex-col items-center text-center hover:border-cyan-500 transition-colors">
                                 <div className="bg-gray-800 p-3 md:p-4 rounded-full mb-3 md:mb-4">
                                     <Icon className="w-6 h-6 md:w-8 md:h-8 text-cyan-400" />
                                 </div>
                                 <h3 className="text-lg md:text-xl font-bold mb-2">{item.name}</h3>
                                 <p className="text-gray-400 text-xs md:text-sm mb-4 h-10 md:h-12 flex items-center justify-center">{item.description}</p>
                                 <button 
                                    onClick={() => buyItem(item.id as any, item.cost)}
                                    disabled={!canAfford}
                                    className={`px-4 md:px-6 py-2 rounded font-bold w-full text-sm md:text-base ${canAfford ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110' : 'bg-gray-700 cursor-not-allowed opacity-50'}`}
                                 >
                                     {item.cost} GEMS
                                 </button>
                             </div>
                         );
                     })}
                 </div>

                 <button 
                    onClick={closeShop}
                    className="flex items-center px-8 md:px-10 py-3 md:py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg md:text-xl rounded hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,0,255,0.4)]"
                 >
                     RESUME MISSION <Play className="ml-2 w-5 h-5" fill="white" />
                 </button>
             </div>
        </div>
    );
};

const AbilityHUD: React.FC = () => {
    // Selectors
    const hasImmortality = useStore(s => s.hasImmortality);
    const isImmortalityActive = useStore(s => s.isImmortalityActive);
    const immortalityLastUsed = useStore(s => s.immortalityLastUsed);
    const activateImmortality = useStore(s => s.activateImmortality);
    
    // Shield selector for display
    const hasShield = useStore(s => s.hasShield);

    const [progress, setProgress] = useState(1); 
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        if (!hasImmortality) return;

        let rAF: number;
        const update = () => {
            const now = Date.now();
            const elapsed = now - immortalityLastUsed;

            if (isImmortalityActive) {
                const p = 1 - (elapsed / IMMORTALITY_DURATION);
                setProgress(Math.max(0, p));
                setTimeLeft(Math.ceil((IMMORTALITY_DURATION - elapsed) / 1000));
            } else {
                if (elapsed < IMMORTALITY_COOLDOWN) {
                    const rechargeDuration = IMMORTALITY_COOLDOWN - IMMORTALITY_DURATION;
                    const rechargeElapsed = elapsed - IMMORTALITY_DURATION;
                    const p = Math.max(0, rechargeElapsed / rechargeDuration);
                    
                    setProgress(p);
                    setTimeLeft(Math.ceil((IMMORTALITY_COOLDOWN - elapsed) / 1000));
                } else {
                    setProgress(1);
                    setTimeLeft(0);
                }
            }
            rAF = requestAnimationFrame(update);
        };
        update();
        return () => cancelAnimationFrame(rAF);
    }, [hasImmortality, isImmortalityActive, immortalityLastUsed]);

    // If we have a shield, show it
    if (hasShield) {
         return (
            <div className="flex flex-col items-center pointer-events-auto animate-pulse">
                <div className="relative group cursor-pointer">
                    <div className="w-16 h-16 rounded-full border-4 border-cyan-400 bg-cyan-900/50 flex items-center justify-center shadow-[0_0_20px_#00ffff]">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-center">
                        <span className="text-cyan-400 font-bold font-cyber text-[10px] tracking-widest">SHIELD UP</span>
                    </div>
                </div>
            </div>
         )
    }

    if (!hasImmortality) return null;

    const isReady = progress >= 0.99 && !isImmortalityActive;
    
    const size = 64;
    const strokeWidth = 5;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress * circumference);

    return (
        <div className="flex flex-col items-center pointer-events-auto" onClick={activateImmortality}>
             <div className="relative group cursor-pointer transition-transform active:scale-95">
                 <svg width={size} height={size} className="transform -rotate-90">
                     <circle 
                        cx={size/2} cy={size/2} r={radius} 
                        stroke="rgba(20,20,30,0.8)" strokeWidth={strokeWidth} fill="rgba(0,0,0,0.6)" 
                     />
                     <circle 
                        cx={size/2} cy={size/2} r={radius} 
                        stroke={isImmortalityActive ? '#ffd700' : isReady ? '#00ffff' : '#00ffff'} 
                        strokeWidth={strokeWidth} 
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className={`transition-all duration-75 ease-linear ${!isReady && !isImmortalityActive ? 'opacity-50' : 'opacity-100'}`}
                        style={{ filter: isImmortalityActive ? 'drop-shadow(0 0 5px gold)' : isReady ? 'drop-shadow(0 0 5px cyan)' : 'none' }}
                     />
                 </svg>

                 <div className="absolute inset-0 flex items-center justify-center">
                     <Shield 
                        className={`w-8 h-8 transition-colors duration-300 ${
                            isImmortalityActive ? 'text-yellow-400 fill-yellow-400 animate-pulse' : 
                            isReady ? 'text-cyan-400' : 'text-gray-500'
                        }`} 
                     />
                 </div>

                 {(!isReady || isImmortalityActive) && (
                     <div className="absolute inset-0 flex items-center justify-center">
                         <span className={`text-xl font-bold font-mono drop-shadow-md ${isImmortalityActive ? 'text-white' : 'text-white/80'}`}>
                            {timeLeft}
                         </span>
                     </div>
                 )}

                 <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-center">
                     {isImmortalityActive ? (
                         <span className="text-yellow-400 font-bold font-cyber text-[10px] tracking-widest animate-pulse">ACTIVE</span>
                     ) : !isReady ? (
                         <span className="text-gray-400 font-bold font-cyber text-[10px] tracking-widest">COOLDOWN</span>
                     ) : (
                         <span className="text-cyan-400 font-bold font-cyber text-[10px] tracking-widest animate-pulse">READY</span>
                     )}
                 </div>
             </div>
        </div>
    );
};

const BriefingScreen: React.FC = () => {
    const startGame = useStore(s => s.startGame);
    const targetWord = useStore(s => s.targetWord);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Simple loading simulation
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setTimeout(() => startGame(), 500); // Brief pause at 100% before launch
                    return 100;
                }
                // Random speed to feel like data loading
                return Math.min(100, prev + Math.random() * 5);
            });
        }, 50);

        return () => clearInterval(interval);
    }, [startGame]);

    return (
        <div className="absolute inset-0 bg-black z-[100] text-green-400 font-mono flex items-center justify-center p-8 pointer-events-auto">
            <div className="w-full max-w-2xl border-2 border-green-500/50 p-6 md:p-10 rounded-sm bg-black/90 shadow-[0_0_50px_rgba(0,255,0,0.1)] relative overflow-hidden">
                {/* Scanlines */}
                <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,255,0,0.05)_50%)] bg-[length:100%_4px] pointer-events-none"></div>
                
                <div className="flex items-center mb-8 border-b border-green-500/30 pb-4">
                    <Terminal className="w-8 h-8 mr-4 animate-pulse" />
                    <h1 className="text-2xl md:text-4xl font-bold tracking-widest uppercase">Mission Briefing</h1>
                </div>

                <div className="space-y-6 mb-10">
                    <div className="flex items-start">
                        <Radio className="w-6 h-6 mr-4 mt-1 opacity-70" />
                        <div>
                            <h3 className="text-green-300/60 text-sm uppercase tracking-wider mb-1">Objective</h3>
                            <p className="text-lg md:text-xl leading-relaxed">
                                Navigate the quantum highway. Collect neural data fragments to reconstruct the keyphrase:
                            </p>
                        </div>
                    </div>

                    <div className="bg-green-900/20 border border-green-500/30 p-6 text-center">
                        <span className="text-4xl md:text-6xl font-black font-cyber tracking-[0.2em] text-white drop-shadow-[0_0_10px_#00ff00]">
                            {targetWord.join('')}
                        </span>
                    </div>

                    <div className="flex items-start">
                        <Cpu className="w-6 h-6 mr-4 mt-1 opacity-70" />
                        <div>
                            <h3 className="text-green-300/60 text-sm uppercase tracking-wider mb-1">Parameters</h3>
                            <ul className="list-disc list-inside text-green-400/80 space-y-1">
                                <li>Avoid hostile entities and debris.</li>
                                <li>Collect Gems for upgrades.</li>
                                <li>Complete the word to enter Hyper-Speed Fever Mode.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <div className="flex justify-between text-xs uppercase mb-2">
                        <span>System Initialization</span>
                        <span>{Math.floor(progress)}%</span>
                    </div>
                    <div className="w-full h-4 bg-green-900/30 border border-green-500/30 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-green-500 shadow-[0_0_15px_#00ff00] transition-all duration-75 ease-out"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <p className="text-center text-xs mt-2 animate-pulse text-green-500/70">
                        {progress < 30 ? "CONNECTING TO MAINFRAME..." : 
                         progress < 60 ? "DOWNLOADING ASSETS..." : 
                         progress < 90 ? "CALIBRATING PHYSICS ENGINE..." : 
                         "READY TO LAUNCH"}
                    </p>
                </div>
            </div>
        </div>
    );
}

export const HUD: React.FC = () => {
  // Use atomic selectors to avoid re-rendering entire HUD on every small state change
  const score = useStore(s => s.score);
  const highScore = useStore(s => s.highScore);
  const lives = useStore(s => s.lives);
  const maxLives = useStore(s => s.maxLives);
  const collectedLetters = useStore(s => s.collectedLetters);
  const status = useStore(s => s.status);
  const level = useStore(s => s.level);
  const gemsCollected = useStore(s => s.gemsCollected);
  const isFeverMode = useStore(s => s.isFeverMode);
  const speed = useStore(s => s.speed);
  const targetWord = useStore(s => s.targetWord);
  const multiplier = useStore(s => s.multiplier);
  
  const restartGame = useStore(s => s.restartGame);
  const enterBriefing = useStore(s => s.enterBriefing);
  const goToMenu = useStore(s => s.goToMenu);
  const setTargetWord = useStore(s => s.setTargetWord);
  const togglePause = useStore(s => s.togglePause);
  
  const [targetInput, setTargetInput] = useState('ALFRED');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' || e.key === 'p' || e.key === ' ') {
            if (e.key === ' ') e.preventDefault(); 
            
            const currentStatus = useStore.getState().status;
            if (currentStatus === GameStatus.PLAYING || currentStatus === GameStatus.PAUSED) {
                togglePause();
            }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePause]);

  const containerClass = "absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-8 z-50";

  if (status === GameStatus.SHOP) {
      return <ShopScreen />;
  }
  
  if (status === GameStatus.BRIEFING) {
      return <BriefingScreen />;
  }

  if (status === GameStatus.PAUSED) {
      return (
        <div className="absolute inset-0 bg-black/60 z-[100] text-white pointer-events-auto backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center p-8 bg-gray-900/90 border border-cyan-500/50 rounded-2xl shadow-[0_0_30px_rgba(0,255,255,0.2)]">
                <h2 className="text-4xl font-black font-cyber text-cyan-400 mb-8 tracking-widest">SYSTEM PAUSED</h2>
                <button 
                  onClick={togglePause}
                  className="px-8 py-3 bg-white text-black font-bold text-xl rounded hover:scale-105 transition-all mb-4 w-full flex items-center justify-center"
                >
                    <Play className="mr-2 w-5 h-5" fill="black" /> RESUME
                </button>
                <button 
                  onClick={() => {
                      togglePause(); // Unpause state internally so audio/logic resets cleanly
                      goToMenu(); 
                  }}
                  className="px-8 py-3 bg-transparent border border-red-500/50 text-red-400 font-bold text-lg rounded hover:bg-red-900/20 transition-all w-full"
                >
                    ABORT MISSION
                </button>
            </div>
        </div>
      );
  }

  if (status === GameStatus.MENU) {
      return (
          <div className="absolute inset-0 flex items-center justify-center z-[100] bg-black/80 backdrop-blur-sm p-4 pointer-events-auto">
              <div className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,255,255,0.2)] border border-white/10 animate-in zoom-in-95 duration-500">
                <div className="relative w-full bg-gray-900 min-h-[500px]">
                     {/* Title Section (Replaces Static Image) */}
                     <div className="w-full h-72 bg-gradient-to-br from-indigo-900 via-purple-900 to-black flex items-center justify-center relative overflow-hidden">
                        {/* Decorative Grid */}
                        <div className="absolute inset-0 opacity-20" 
                             style={{ 
                                 backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(0, 255, 255, .3) 25%, rgba(0, 255, 255, .3) 26%, transparent 27%, transparent 74%, rgba(0, 255, 255, .3) 75%, rgba(0, 255, 255, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0, 255, 255, .3) 25%, rgba(0, 255, 255, .3) 26%, transparent 27%, transparent 74%, rgba(0, 255, 255, .3) 75%, rgba(0, 255, 255, .3) 76%, transparent 77%, transparent)',
                                 backgroundSize: '50px 50px'
                             }} 
                        />
                        
                        <div className="text-center z-10 transform -rotate-3">
                            <h1 className="text-6xl md:text-7xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-purple-500 font-cyber tracking-tighter drop-shadow-[0_0_25px_rgba(0,255,255,0.6)] leading-none">
                                ALFRED
                            </h1>
                            <h1 className="text-6xl md:text-7xl font-black italic text-white font-cyber tracking-widest drop-shadow-[0_0_15px_rgba(255,0,255,0.8)] leading-none ml-12">
                                RUN
                            </h1>
                        </div>
                     </div>
                     
                     <div className="absolute inset-0 bg-gradient-to-t from-[#050011] via-black/40 to-transparent pointer-events-none"></div>

                     <div className="absolute inset-0 flex flex-col justify-end items-center p-6 pb-8 text-center z-10">
                        <div className="absolute top-4 right-4 bg-black/60 px-3 py-1 rounded-full border border-yellow-500/30 flex items-center">
                            <Trophy className="w-3 h-3 text-yellow-500 mr-2" />
                            <span className="text-yellow-400 text-xs font-bold font-mono tracking-wider">
                                BEST: {highScore.toLocaleString()}
                            </span>
                        </div>

                        <div className="w-full mb-4">
                            <label className="block text-cyan-400/80 text-xs font-mono tracking-widest mb-2">
                                MISSION TARGET PROTOCOL
                            </label>
                            <div className="relative flex items-center justify-center">
                                <input 
                                    type="text" 
                                    maxLength={6}
                                    value={targetInput}
                                    onChange={(e) => setTargetInput(e.target.value.toUpperCase())}
                                    className="w-full bg-black/40 border-2 border-cyan-500/50 rounded-lg py-3 px-4 text-center text-2xl font-black font-cyber text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(0,255,255,0.5)] transition-all uppercase"
                                    placeholder="ENTER NAME"
                                />
                                <Edit3 className="absolute right-4 w-5 h-5 text-cyan-500/50 pointer-events-none" />
                            </div>
                            <p className="text-xs text-gray-500 mt-1 font-mono">MAX 6 CHARACTERS</p>
                        </div>

                        <button 
                          onClick={() => { 
                              audio.init(); 
                              const wordToUse = targetInput.trim() || 'ALFRED';
                              setTargetWord(wordToUse);
                              enterBriefing(); // Go to briefing instead of direct start
                          }}
                          className="w-full group relative px-6 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white font-black text-xl rounded-xl hover:bg-white/20 transition-all shadow-[0_0_20px_rgba(0,255,255,0.2)] hover:shadow-[0_0_30px_rgba(0,255,255,0.4)] hover:border-cyan-400 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/40 via-purple-500/40 to-pink-500/40 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                            <span className="relative z-10 tracking-widest flex items-center justify-center">
                                INITIALIZE RUN <Play className="ml-2 w-5 h-5 fill-white" />
                            </span>
                        </button>

                        <p className="text-cyan-400/60 text-[10px] md:text-xs font-mono mt-3 tracking-wider">
                            [ ARROWS / SWIPE TO MOVE ]
                        </p>
                     </div>
                </div>
              </div>
          </div>
      );
  }

  if (status === GameStatus.GAME_OVER) {
      return (
          <div className="absolute inset-0 bg-black/90 z-[100] text-white pointer-events-auto backdrop-blur-sm overflow-y-auto">
              <div className="flex flex-col items-center justify-center min-h-full py-8 px-4">
                <h1 className="text-4xl md:text-6xl font-black text-white mb-6 drop-shadow-[0_0_10px_rgba(255,0,0,0.8)] font-cyber text-center">GAME OVER</h1>
                
                <div className="grid grid-cols-1 gap-3 md:gap-4 text-center mb-8 w-full max-w-md">
                    <div className="bg-gray-900/80 p-3 md:p-4 rounded-lg border border-gray-700 flex items-center justify-between">
                        <div className="flex items-center text-yellow-400 text-sm md:text-base"><Trophy className="mr-2 w-4 h-4 md:w-5 md:h-5"/> LEVEL</div>
                        <div className="text-xl md:text-2xl font-bold font-mono">{level} / 3</div>
                    </div>
                    <div className="bg-gray-900/80 p-3 md:p-4 rounded-lg border border-gray-700 flex items-center justify-between">
                        <div className="flex items-center text-cyan-400 text-sm md:text-base"><Diamond className="mr-2 w-4 h-4 md:w-5 md:h-5"/> GEMS COLLECTED</div>
                        <div className="text-xl md:text-2xl font-bold font-mono">{gemsCollected}</div>
                    </div>
                     <div className="bg-gray-800/50 p-3 md:p-4 rounded-lg flex items-center justify-between mt-2">
                        <div className="flex items-center text-white text-sm md:text-base">TOTAL SCORE</div>
                        <div className="text-2xl md:text-3xl font-bold font-cyber text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">{score.toLocaleString()}</div>
                    </div>
                    {score >= highScore && score > 0 && (
                        <div className="p-2 bg-yellow-500/20 border border-yellow-500/50 rounded text-yellow-300 font-bold animate-pulse">
                            NEW HIGH SCORE!
                        </div>
                    )}
                </div>

                <button 
                  onClick={() => { audio.init(); restartGame(); }}
                  className="px-8 md:px-10 py-3 md:py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg md:text-xl rounded hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,255,255,0.4)]"
                >
                    RUN AGAIN
                </button>
              </div>
          </div>
      );
  }

  if (status === GameStatus.VICTORY) {
    return (
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/90 to-black/95 z-[100] text-white pointer-events-auto backdrop-blur-md overflow-y-auto">
            <div className="flex flex-col items-center justify-center min-h-full py-8 px-4">
                <Rocket className="w-16 h-16 md:w-24 md:h-24 text-yellow-400 mb-4 animate-bounce drop-shadow-[0_0_15px_rgba(255,215,0,0.6)]" />
                <h1 className="text-3xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-500 to-pink-500 mb-2 drop-shadow-[0_0_20px_rgba(255,165,0,0.6)] font-cyber text-center leading-tight">
                    MISSION COMPLETE
                </h1>
                <p className="text-cyan-300 text-sm md:text-2xl font-mono mb-8 tracking-widest text-center">
                    THE ANSWER TO THE UNIVERSE HAS BEEN FOUND
                </p>
                
                <div className="grid grid-cols-1 gap-4 text-center mb-8 w-full max-w-md">
                    <div className="bg-black/60 p-6 rounded-xl border border-yellow-500/30 shadow-[0_0_15px_rgba(255,215,0,0.1)]">
                        <div className="text-xs md:text-sm text-gray-400 mb-1 tracking-wider">FINAL SCORE</div>
                        <div className="text-3xl md:text-4xl font-bold font-cyber text-yellow-400">{score.toLocaleString()}</div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/60 p-4 rounded-lg border border-white/10">
                            <div className="text-xs text-gray-400">GEMS</div>
                            <div className="text-xl md:text-2xl font-bold text-cyan-400">{gemsCollected}</div>
                        </div>
                        <div className="bg-black/60 p-4 rounded-lg border border-white/10">
                             <div className="text-xs text-gray-400">HIGH SCORE</div>
                            <div className="text-xl md:text-2xl font-bold text-purple-400">{highScore.toLocaleString()}</div>
                        </div>
                     </div>
                </div>

                <button 
                  onClick={() => { audio.init(); restartGame(); }}
                  className="px-8 md:px-12 py-4 md:py-5 bg-white text-black font-black text-lg md:text-xl rounded hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] tracking-widest"
                >
                    RESTART MISSION
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className={containerClass}>
        <div className="flex justify-between items-start w-full">
            <div className="flex flex-col">
                <div className="flex items-end">
                    <div className="text-3xl md:text-5xl font-bold text-cyan-400 drop-shadow-[0_0_10px_#00ffff] font-cyber">
                        {score.toLocaleString()}
                    </div>
                    {/* Multiplier Indicator */}
                    {multiplier > 1 && (
                        <div className="ml-2 mb-1 text-xl md:text-2xl font-black text-yellow-400 animate-pulse italic">
                            x{multiplier}
                        </div>
                    )}
                </div>
            </div>
            
            <div className="flex items-start space-x-4">
                <div className="flex space-x-1 md:space-x-2">
                    {[...Array(maxLives)].map((_, i) => (
                        <Heart 
                            key={i} 
                            className={`w-6 h-6 md:w-8 md:h-8 ${i < lives ? 'text-pink-500 fill-pink-500' : 'text-gray-800 fill-gray-800'} drop-shadow-[0_0_5px_#ff0054]`} 
                        />
                    ))}
                </div>
                
                <button 
                    onClick={togglePause}
                    className="pointer-events-auto p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all border border-white/20"
                >
                    <Pause className="w-6 h-6 text-white" fill="white" />
                </button>
            </div>
        </div>
        
        <div className="absolute top-5 left-1/2 transform -translate-x-1/2 text-sm md:text-lg text-purple-300 font-bold tracking-wider font-mono bg-black/50 px-3 py-1 rounded-full border border-purple-500/30 backdrop-blur-sm z-50">
            LEVEL {level} <span className="text-gray-500 text-xs md:text-sm">/ 3</span>
        </div>

        {isFeverMode && (
             <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-40">
                <h1 className="text-5xl md:text-7xl font-black text-yellow-400 font-cyber animate-pulse drop-shadow-[0_0_20px_gold]">FEVER MODE</h1>
                <p className="text-white text-xl font-mono tracking-widest">HYPERSPEED ENGAGED</p>
             </div>
        )}

        <div className="absolute top-16 md:top-24 left-1/2 transform -translate-x-1/2 flex space-x-2 md:space-x-3">
            {targetWord.map((char, idx) => {
                const isCollected = collectedLetters.includes(idx);
                const color = LETTER_COLORS[idx % LETTER_COLORS.length];

                return (
                    <div 
                        key={idx}
                        style={{
                            borderColor: isCollected ? color : 'rgba(55, 65, 81, 1)',
                            color: isCollected ? 'rgba(0, 0, 0, 0.8)' : 'rgba(55, 65, 81, 1)',
                            boxShadow: isCollected ? `0 0 20px ${color}` : 'none',
                            backgroundColor: isCollected ? color : 'rgba(0, 0, 0, 0.9)'
                        }}
                        className={`w-8 h-10 md:w-10 md:h-12 flex items-center justify-center border-2 font-black text-lg md:text-xl font-cyber rounded-lg transform transition-all duration-300`}
                    >
                        {char}
                    </div>
                );
            })}
        </div>

        <div className="w-full flex justify-between items-end">
             <div className="flex items-center justify-start min-w-[80px]">
                 <AbilityHUD />
             </div>

             <div className="flex items-center space-x-2 text-cyan-500 opacity-70">
                 <Zap className="w-4 h-4 md:w-6 md:h-6 animate-pulse" />
                 <span className="font-mono text-base md:text-xl">SPEED {Math.round((speed / RUN_SPEED_BASE) * 100)}%</span>
             </div>
        </div>
    </div>
  );
};