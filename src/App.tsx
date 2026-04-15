/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Play, RotateCcw, Heart, Flower2 } from 'lucide-react';

// --- Constants ---
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const GROUND_HEIGHT = 100;
const DINO_WIDTH = 44;
const DINO_HEIGHT = 44;
const OBSTACLE_SPEED_START = 6;
const OBSTACLE_SPEED_MAX = 12;
const OBSTACLE_ACCELERATION = 0.001;
const FLOWER_SCORE = 1000;

// --- Types ---
interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Obstacle extends Entity {
  type: 'cactus' | 'bird';
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAME_OVER' | 'SPECIAL_EVENT'>('START');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  
  // Game refs to avoid re-renders in the loop
  const gameRef = useRef({
    dinoY: 0,
    dinoVelocity: 0,
    obstacles: [] as Obstacle[],
    speed: OBSTACLE_SPEED_START,
    frameCount: 0,
    isJumping: false,
    score: 0,
    lastObstacleTime: 0,
    animationId: 0,
  });

  const resetGame = useCallback(() => {
    gameRef.current = {
      dinoY: 0,
      dinoVelocity: 0,
      obstacles: [],
      speed: OBSTACLE_SPEED_START,
      frameCount: 0,
      isJumping: false,
      score: 0,
      lastObstacleTime: 0,
      animationId: 0,
    };
    setScore(0);
    setGameState('PLAYING');
  }, []);

  const handleJump = useCallback(() => {
    if (gameState === 'PLAYING' && !gameRef.current.isJumping) {
      gameRef.current.dinoVelocity = JUMP_FORCE;
      gameRef.current.isJumping = true;
    } else if (gameState === 'START' || gameState === 'GAME_OVER') {
      resetGame();
    }
  }, [gameState, resetGame]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleJump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleJump]);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const update = () => {
      const g = gameRef.current;
      const width = canvas.width;
      const height = canvas.height;
      const groundY = height - GROUND_HEIGHT;

      // 1. Update Dino
      g.dinoVelocity += GRAVITY;
      g.dinoY += g.dinoVelocity;

      if (g.dinoY > 0) {
        g.dinoY = 0;
        g.dinoVelocity = 0;
        g.isJumping = false;
      }

      // 2. Update Speed & Score
      g.speed = Math.min(OBSTACLE_SPEED_MAX, g.speed + OBSTACLE_ACCELERATION);
      g.frameCount++;
      if (g.frameCount % 5 === 0) {
        g.score++;
        setScore(g.score);
        
        // Special Event Check
        if (g.score === FLOWER_SCORE) {
          setGameState('SPECIAL_EVENT');
          cancelAnimationFrame(g.animationId);
          return;
        }
      }

      // 3. Spawn Obstacles
      const timeSinceLast = g.frameCount - g.lastObstacleTime;
      const minGap = 60 / (g.speed / 6); // Gap based on speed
      if (timeSinceLast > minGap && Math.random() < 0.02) {
        const type = g.score > 500 && Math.random() > 0.7 ? 'bird' : 'cactus';
        const obsHeight = type === 'bird' ? 30 : 40 + Math.random() * 30;
        const obsY = type === 'bird' ? groundY - 80 - Math.random() * 40 : groundY - obsHeight;
        
        g.obstacles.push({
          x: width,
          y: obsY,
          width: 30,
          height: obsHeight,
          type
        });
        g.lastObstacleTime = g.frameCount;
      }

      // 4. Move & Filter Obstacles
      g.obstacles = g.obstacles.filter(obs => {
        obs.x -= g.speed;
        return obs.x + obs.width > 0;
      });

      // 5. Collision Detection
      const dinoBox = {
        x: 50,
        y: groundY - DINO_HEIGHT + g.dinoY,
        width: DINO_WIDTH - 10, // Tighter hitbox
        height: DINO_HEIGHT - 5
      };

      for (const obs of g.obstacles) {
        if (
          dinoBox.x < obs.x + obs.width &&
          dinoBox.x + dinoBox.width > obs.x &&
          dinoBox.y < obs.y + obs.height &&
          dinoBox.y + dinoBox.height > obs.y
        ) {
          setGameState('GAME_OVER');
          setHighScore(prev => Math.max(prev, g.score));
          cancelAnimationFrame(g.animationId);
          return;
        }
      }

      // 6. Draw
      ctx.clearRect(0, 0, width, height);

      // Draw Ground
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(width, groundY);
      ctx.stroke();

      // Draw Dino (Modern Minimalist Style)
      ctx.fillStyle = '#10b981'; // Emerald 500
      const dinoYPos = groundY - DINO_HEIGHT + g.dinoY;
      
      // Body
      ctx.beginPath();
      ctx.roundRect(50, dinoYPos, DINO_WIDTH, DINO_HEIGHT, 8);
      ctx.fill();
      
      // Eye
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(50 + DINO_WIDTH - 12, dinoYPos + 12, 3, 0, Math.PI * 2);
      ctx.fill();

      // Legs (Simple animation)
      ctx.strokeStyle = '#065f46';
      ctx.lineWidth = 3;
      const legOffset = Math.sin(g.frameCount * 0.2) * 5;
      if (!g.isJumping) {
        ctx.beginPath();
        ctx.moveTo(50 + 10, dinoYPos + DINO_HEIGHT);
        ctx.lineTo(50 + 10, dinoYPos + DINO_HEIGHT + 10 + legOffset);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(50 + DINO_WIDTH - 10, dinoYPos + DINO_HEIGHT);
        ctx.lineTo(50 + DINO_WIDTH - 10, dinoYPos + DINO_HEIGHT + 10 - legOffset);
        ctx.stroke();
      }

      // Draw Obstacles
      g.obstacles.forEach(obs => {
        ctx.fillStyle = obs.type === 'cactus' ? '#ef4444' : '#3b82f6';
        ctx.beginPath();
        ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 4);
        ctx.fill();
        
        // Add some detail to cactus
        if (obs.type === 'cactus') {
           ctx.fillStyle = '#991b1b';
           ctx.fillRect(obs.x + obs.width/2 - 2, obs.y + 5, 4, obs.height - 10);
        }
      });

      g.animationId = requestAnimationFrame(update);
    };

    gameRef.current.animationId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(gameRef.current.animationId);
  }, [gameState]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans text-slate-100 overflow-hidden">
      {/* HUD */}
      <div className="w-full max-w-2xl flex justify-between items-center mb-6 px-4">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 px-4 py-2 rounded-2xl">
            <span className="text-xs uppercase tracking-widest text-slate-500 font-bold block">Score</span>
            <span className="text-2xl font-mono font-bold text-emerald-400">{score.toString().padStart(5, '0')}</span>
          </div>
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 px-4 py-2 rounded-2xl">
            <span className="text-xs uppercase tracking-widest text-slate-500 font-bold block">Best</span>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-2xl font-mono font-bold text-amber-400">{highScore.toString().padStart(5, '0')}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <h1 className="text-xl font-black tracking-tighter italic text-slate-400">DINO.QUEST</h1>
        </div>
      </div>

      {/* Game Canvas Container */}
      <div className="relative w-full max-w-2xl aspect-[2/1] bg-slate-900 rounded-3xl border-4 border-slate-800 shadow-2xl overflow-hidden group cursor-pointer" onClick={handleJump}>
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="w-full h-full"
        />

        {/* Overlays */}
        <AnimatePresence mode="wait">
          {gameState === 'START' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-16 h-16 bg-emerald-500 rounded-xl mb-6 flex items-center justify-center"
              >
                <Play className="w-8 h-8 text-slate-950 fill-current" />
              </motion.div>
              <h2 className="text-4xl font-black mb-2 tracking-tight">READY TO RUN?</h2>
              <p className="text-slate-400 mb-8 max-w-xs">Press Space or Tap to jump. Reach 1000 points for a surprise.</p>
              <button 
                onClick={(e) => { e.stopPropagation(); resetGame(); }}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-8 py-4 rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
              >
                START GAME
              </button>
            </motion.div>
          )}

          {gameState === 'GAME_OVER' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 bg-red-950/80 backdrop-blur-md flex flex-col items-center justify-center text-center p-8"
            >
              <div className="w-16 h-16 bg-red-500 rounded-full mb-6 flex items-center justify-center">
                <RotateCcw className="w-8 h-8 text-slate-950" />
              </div>
              <h2 className="text-5xl font-black mb-2 tracking-tighter text-white">GAME OVER</h2>
              <p className="text-red-200/60 mb-8 text-lg">Final Score: <span className="text-white font-bold">{score}</span></p>
              <button 
                onClick={(e) => { e.stopPropagation(); resetGame(); }}
                className="bg-white text-red-950 px-10 py-4 rounded-2xl font-bold transition-all hover:bg-red-50 hover:scale-105 active:scale-95 shadow-xl"
              >
                TRY AGAIN
              </button>
            </motion.div>
          )}

          {gameState === 'SPECIAL_EVENT' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-pink-950/90 backdrop-blur-xl flex flex-col items-center justify-center text-center p-8"
            >
              <div className="flex gap-4 mb-8">
                <motion.div
                  animate={{ 
                    x: [0, 40, 40],
                    scale: [1, 1, 1.1]
                  }}
                  transition={{ duration: 3, times: [0, 0.7, 1] }}
                  className="w-16 h-16 bg-emerald-500 rounded-xl flex items-center justify-center relative"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 2 }}
                    className="absolute -right-4 -top-4"
                  >
                    <Flower2 className="w-10 h-10 text-pink-400 fill-pink-400" />
                  </motion.div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="w-16 h-16 bg-pink-500 rounded-xl flex items-center justify-center"
                >
                  <div className="w-3 h-3 bg-white rounded-full absolute top-3 right-3" />
                </motion.div>
              </div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 2.5 }}
              >
                <h2 className="text-4xl font-black mb-2 tracking-tight text-white flex items-center justify-center gap-3">
                  MISSION ACCOMPLISHED <Heart className="fill-pink-500 text-pink-500" />
                </h2>
                <p className="text-pink-200/70 mb-8 text-lg max-w-md">
                  You reached 1000 points! Dino found his special someone and gave her a beautiful flower.
                </p>
                <button 
                  onClick={(e) => { e.stopPropagation(); setGameState('PLAYING'); resetGame(); }}
                  className="bg-white text-pink-950 px-10 py-4 rounded-2xl font-bold transition-all hover:bg-pink-50 active:scale-95 shadow-xl"
                >
                  CONTINUE RUNNING
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls Help & Space Button */}
      <div className="mt-8 flex flex-col items-center gap-6">
        <button
          onClick={(e) => { e.stopPropagation(); handleJump(); }}
          className="group relative bg-slate-800 hover:bg-slate-700 active:translate-y-1 transition-all px-12 py-4 rounded-2xl border-b-4 border-slate-900 shadow-lg flex items-center gap-3"
        >
          <span className="text-xl font-black tracking-[0.2em] text-slate-300 group-active:text-emerald-400">SPACE</span>
          <div className="w-2 h-2 rounded-full bg-slate-600 group-active:bg-emerald-500 animate-pulse" />
        </button>

        <div className="flex gap-8 text-slate-500 text-xs font-bold uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <kbd className="bg-slate-900 px-2 py-1 rounded border border-slate-800 text-slate-400">SPACEBAR</kbd>
            <span>Keyboard</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="bg-slate-900 px-2 py-1 rounded border border-slate-800 text-slate-400">TAP</kbd>
            <span>Screen</span>
          </div>
        </div>
      </div>
    </div>
  );
}
