'use client';

import React from 'react';
import { PlayerNetState, WaveState } from '@/types/game';
import { Crosshair, Users, Skull, Activity, AlertCircle, Compass, Radio } from 'lucide-react';

interface GameHUDProps {
  health: number;
  maxHealth: number;
  stamina: number;
  ammo: number;
  maxAmmo: number;
  isReloading: boolean;
  score: number;
  kills: number;
  waveState: WaveState;
  remotePlayers: Record<string, PlayerNetState>;
  hitMarker: 'body' | 'head' | null;
  isLocked: boolean;
  onRequestLock: () => void;
  damageVignette: boolean;
  currentWeapon: 'RIFLE' | 'PISTOL';
  isADS: boolean;
  perspective: 'FPS' | 'TPS';
}

export function GameHUD({
  health,
  maxHealth,
  stamina,
  ammo,
  maxAmmo,
  isReloading,
  score,
  kills,
  waveState,
  remotePlayers,
  hitMarker,
  isLocked,
  onRequestLock,
  damageVignette,
  currentWeapon,
  isADS,
  perspective,
}: GameHUDProps) {
  const hpPercent = Math.max(0, Math.min(100, (health / maxHealth) * 100));

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between p-4 sm:p-6 overflow-hidden">
      {/* Damage Hurt Vignette */}
      {damageVignette && (
        <div className="fixed inset-0 bg-red-600/35 border-[12px] border-red-600/80 animate-pulse pointer-events-none transition-opacity duration-300" />
      )}

      {/* TOP BAR: Clock, Squad Roster, Wave Status & Compass */}
      <div className="flex justify-between items-start">
        {/* Top-Left: WarZ Clock & Squad Status (Image 1) */}
        <div className="flex flex-col gap-2">
          {/* Digital Clock & Zone Info */}
          <div className="bg-black/75 backdrop-blur-sm border border-zinc-800/80 rounded-lg px-3 py-1.5 flex items-center gap-3">
            <span className="text-sm font-mono font-black text-zinc-200">19:27</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-800/60 font-bold uppercase">
              WAR ZONE
            </span>
            <span className="text-[10px] font-mono text-zinc-400">
              [V] VIEW: <strong className="text-emerald-400">{perspective}</strong>
            </span>
          </div>

          {/* Squad List */}
          <div className="bg-black/70 backdrop-blur-sm border border-zinc-800/80 rounded-lg p-2.5 min-w-[180px]">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 mb-1.5">
              <Users className="w-3 h-3 text-emerald-400" />
              <span>SQUAD OPERATIVES</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-emerald-400 font-bold">YOU</span>
                <span className="text-zinc-300">{health} HP</span>
              </div>
              {Object.values(remotePlayers).map((p) => (
                <div key={p.id} className="flex justify-between text-[11px] font-mono text-zinc-400">
                  <span className="truncate max-w-[100px]">{p.name}</span>
                  <span className={p.health <= 0 ? 'text-red-500 font-bold' : 'text-zinc-300'}>
                    {p.health <= 0 ? 'DEAD' : `${p.health} HP`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top-Center: Wave Info */}
        <div className="bg-black/80 backdrop-blur-md border border-zinc-800 px-6 py-2 rounded-xl flex items-center gap-5 shadow-2xl">
          <div className="text-center">
            <div className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase">WAVE</div>
            <div className="text-2xl font-black font-mono text-red-500">{waveState.wave}</div>
          </div>
          <div className="h-8 w-px bg-zinc-800" />
          <div className="text-center">
            <div className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase">ZOMBIES LEFT</div>
            <div className="text-2xl font-black font-mono text-amber-400">{waveState.zombiesRemaining}</div>
          </div>
        </div>

        {/* Top-Right: WarZ Tactical Compass Dial (Image 1) */}
        <div className="flex items-center gap-3">
          <div className="bg-black/75 backdrop-blur-sm border border-zinc-800/80 rounded-lg p-2 text-right">
            <div className="text-[10px] font-mono text-zinc-500">SCORE: <strong className="text-emerald-400 text-xs">{score}</strong></div>
            <div className="text-[10px] font-mono text-zinc-500">KILLS: <strong className="text-red-400 text-xs">{kills}</strong></div>
          </div>

          <div className="w-12 h-12 rounded-full border-2 border-zinc-700/80 bg-black/80 flex items-center justify-center relative shadow-lg">
            <div className="w-0.5 h-4 bg-red-500 -top-1 absolute" />
            <Compass className="w-6 h-6 text-zinc-400" />
          </div>
        </div>
      </div>

      {/* CENTER SCREEN: Dynamic Reticle & Hitmarkers */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative flex items-center justify-center">
          {/* Crosshair (hides when ADS for realistic iron sights) */}
          {!isADS && (
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div className="w-1 h-1 bg-white rounded-full shadow-[0_0_6px_#ffffff]" />
              <div className="absolute w-4 h-[1.5px] bg-white/80 -left-4" />
              <div className="absolute w-4 h-[1.5px] bg-white/80 -right-4" />
              <div className="absolute h-4 w-[1.5px] bg-white/80 -top-4" />
              <div className="absolute h-4 w-[1.5px] bg-white/80 -bottom-4" />
            </div>
          )}

          {/* Hitmarker Confirmation */}
          {hitMarker && (
            <div className="absolute flex flex-col items-center">
              <div
                className={`text-2xl font-black select-none ${
                  hitMarker === 'head' ? 'text-red-500 scale-125' : 'text-white scale-100'
                }`}
              >
                ✕
              </div>
              {hitMarker === 'head' && (
                <span className="text-[10px] font-mono font-black text-red-500 tracking-wider">CRITICAL</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pointer Lock Overlay */}
      {!isLocked && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-black/50 backdrop-blur-xs">
          <button
            onClick={onRequestLock}
            className="px-8 py-4 bg-red-600/90 hover:bg-red-500 text-white font-mono font-bold text-base rounded-xl shadow-2xl border border-red-500/50 flex items-center gap-3 transition-transform hover:scale-105 active:scale-95"
          >
            <Crosshair className="w-6 h-6 animate-spin" />
            CLICK SCREEN TO ENGAGE WEAPONS (POINTER LOCK)
          </button>
        </div>
      )}

      {/* BOTTOM AREA: WarZ Body Silhouette (Left), Hotbar (Center), Weapon & Ammo (Right) */}
      <div className="flex justify-between items-end gap-4">
        {/* 1. BOTTOM-LEFT: Authentic WarZ Body Silhouette HUD (Image 1, 2, 3) */}
        <div className="flex items-center gap-3">
          <div className="relative w-24 h-24 rounded-full bg-black/85 border-2 border-zinc-700/80 flex items-center justify-center shadow-2xl">
            {/* Health Outer Arc */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="42"
                stroke="#262626"
                strokeWidth="4"
                fill="none"
              />
              <circle
                cx="48"
                cy="48"
                r="42"
                stroke={hpPercent > 50 ? '#10b981' : hpPercent > 25 ? '#f59e0b' : '#dc2626'}
                strokeWidth="4"
                strokeDasharray="264"
                strokeDashoffset={264 - (264 * hpPercent) / 100}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-300"
              />
            </svg>

            {/* Stamina Inner Arc */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="36"
                stroke="#18181b"
                strokeWidth="3"
                fill="none"
              />
              <circle
                cx="48"
                cy="48"
                r="36"
                stroke="#06b6d4"
                strokeWidth="3"
                strokeDasharray="226"
                strokeDashoffset={226 - (226 * stamina) / 100}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-150"
              />
            </svg>

            {/* WarZ Human Body Silhouette Vector (Image 1 & 2) */}
            <svg viewBox="0 0 100 160" className="w-10 h-16 relative z-10">
              {/* Head */}
              <circle
                cx="50"
                cy="20"
                r="12"
                fill={health < 30 ? '#dc2626' : '#ffffff'}
                className="transition-colors duration-300"
              />
              {/* Torso */}
              <rect
                x="38"
                y="36"
                width="24"
                height="45"
                rx="4"
                fill={health < 50 ? '#dc2626' : '#ffffff'}
                className="transition-colors duration-300"
              />
              {/* Left Arm */}
              <rect
                x="22"
                y="38"
                width="12"
                height="40"
                rx="3"
                fill={health < 60 ? '#dc2626' : '#ffffff'}
                className="transition-colors duration-300"
              />
              {/* Right Arm */}
              <rect
                x="66"
                y="38"
                width="12"
                height="40"
                rx="3"
                fill={health < 60 ? '#dc2626' : '#ffffff'}
                className="transition-colors duration-300"
              />
              {/* Left Leg */}
              <rect
                x="38"
                y="85"
                width="10"
                height="50"
                rx="3"
                fill={health < 40 ? '#dc2626' : '#ffffff'}
                className="transition-colors duration-300"
              />
              {/* Right Leg */}
              <rect
                x="52"
                y="85"
                width="10"
                height="50"
                rx="3"
                fill={health < 40 ? '#dc2626' : '#ffffff'}
                className="transition-colors duration-300"
              />
            </svg>
          </div>

          <div className="flex flex-col font-mono text-[11px] text-zinc-400">
            <span className="font-bold text-white">HP: {health}%</span>
            <span>STAMINA: {stamina}%</span>
          </div>
        </div>

        {/* 2. BOTTOM-CENTER: WarZ Quick Hotbar (Image 2 & 3) */}
        <div className="hidden sm:flex items-center gap-1.5 bg-black/85 backdrop-blur-md border border-zinc-800/80 px-3 py-2 rounded-xl">
          <div
            className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold border transition-all ${
              currentWeapon === 'RIFLE'
                ? 'bg-red-950/80 border-red-500 text-white shadow-md'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
            }`}
          >
            [1] M4A1 RIFLE
          </div>

          <div
            className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold border transition-all ${
              currentWeapon === 'PISTOL'
                ? 'bg-red-950/80 border-red-500 text-white shadow-md'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
            }`}
          >
            [2] .45 THUNDER
          </div>

          <div className="px-3 py-1.5 rounded-lg font-mono text-xs bg-zinc-900/40 border border-zinc-800/50 text-zinc-600">
            [3] SPIKED BAT
          </div>
          <div className="px-3 py-1.5 rounded-lg font-mono text-xs bg-zinc-900/40 border border-zinc-800/50 text-zinc-600">
            [4] MEDKIT
          </div>
        </div>

        {/* 3. BOTTOM-RIGHT: WarZ Weapon & Ammo Counter (Image 1) */}
        <div className="bg-black/85 backdrop-blur-md border border-zinc-800/80 p-3.5 rounded-xl min-w-[200px] text-right">
          <div className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider mb-0.5">
            {currentWeapon === 'PISTOL' ? '.45 Thunder Revolver' : 'M4A1 Assault Rifle'}
          </div>

          <div className="flex items-baseline justify-end gap-1.5 font-mono">
            <span
              className={`text-4xl font-black tracking-tight ${
                ammo < 5 ? 'text-red-500 animate-pulse' : 'text-zinc-100'
              }`}
            >
              {isReloading ? '--' : ammo}
            </span>
            <span className="text-zinc-500 font-bold text-sm">/ {maxAmmo}</span>
          </div>

          {isReloading ? (
            <div className="text-xs font-mono text-amber-400 font-bold flex items-center justify-end gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5 animate-spin" />
              RELOADING...
            </div>
          ) : (
            <div className="text-[10px] font-mono text-zinc-500 mt-1">
              [L-CLICK] FIRE &bull; [R-CLICK] ADS &bull; [R] RELOAD
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
