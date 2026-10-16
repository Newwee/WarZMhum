'use client';

import React from 'react';
import { PlayerNetState, WaveState } from '@/types/game';
import { Shield, Crosshair, Users, Skull, Activity, AlertCircle } from 'lucide-react';

interface GameHUDProps {
  health: number;
  maxHealth: number;
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
}

export function GameHUD({
  health,
  maxHealth,
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
}: GameHUDProps) {
  const hpPercent = Math.max(0, Math.min(100, (health / maxHealth) * 100));

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between p-6">
      {/* Red Hurt Vignette when taking damage */}
      {damageVignette && (
        <div className="fixed inset-0 bg-red-600/30 border-8 border-red-600/70 animate-pulse pointer-events-none transition-opacity duration-300" />
      )}

      {/* Top Header: Wave & Zombies Info + Teammate HUD */}
      <div className="flex justify-between items-start">
        {/* Teammates List */}
        <div className="bg-black/70 backdrop-blur-md border border-zinc-800 rounded-lg p-3 min-w-[200px]">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-2 border-b border-zinc-800 pb-1">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>SQUAD SURVIVORS</span>
          </div>
          <div className="space-y-2">
            {/* Local Player */}
            <div className="flex flex-col gap-0.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-emerald-400 font-bold">YOU</span>
                <span className="text-zinc-300">{health} HP</span>
              </div>
              <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 25 ? 'bg-amber-500' : 'bg-red-600'
                  }`}
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
            </div>

            {/* Remote Teammates */}
            {Object.values(remotePlayers).map((player) => {
              const rHpPercent = Math.max(0, Math.min(100, (player.health / player.maxHealth) * 100));
              return (
                <div key={player.id} className="flex flex-col gap-0.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-200">{player.name}</span>
                    <span className={player.health <= 0 ? 'text-red-500 font-bold' : 'text-zinc-400'}>
                      {player.health <= 0 ? 'DEAD' : `${player.health} HP`}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        player.health <= 0 ? 'bg-red-800' : rHpPercent > 50 ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${rHpPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center: Wave & Threat Level */}
        <div className="flex flex-col items-center">
          <div className="bg-black/80 backdrop-blur-md border border-zinc-800 px-6 py-2 rounded-xl flex items-center gap-6 shadow-xl">
            <div className="text-center">
              <div className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">WAVE</div>
              <div className="text-2xl font-black font-mono text-red-500">{waveState.wave}</div>
            </div>
            <div className="h-8 w-px bg-zinc-800" />
            <div className="text-center">
              <div className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">ZOMBIES LEFT</div>
              <div className="text-2xl font-black font-mono text-amber-400">{waveState.zombiesRemaining}</div>
            </div>
          </div>
        </div>

        {/* Top Right: Kills and Score */}
        <div className="bg-black/70 backdrop-blur-md border border-zinc-800 rounded-lg p-3 min-w-[150px] text-right">
          <div className="flex items-center justify-end gap-2 text-xs font-mono text-zinc-400 mb-1">
            <Skull className="w-3.5 h-3.5 text-red-400" />
            <span>KILLS: <strong className="text-white text-sm">{kills}</strong></span>
          </div>
          <div className="flex items-center justify-end gap-2 text-xs font-mono text-zinc-400">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>SCORE: <strong className="text-emerald-400 text-sm">{score}</strong></span>
          </div>
        </div>
      </div>

      {/* Center Screen: Dynamic Crosshair and Hit Marker */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative flex items-center justify-center">
          {/* Default Crosshair reticle */}
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_#10b981]" />
          <div className="absolute w-6 h-[1.5px] bg-emerald-500/70 -left-4" />
          <div className="absolute w-6 h-[1.5px] bg-emerald-500/70 -right-4" />
          <div className="absolute h-6 w-[1.5px] bg-emerald-500/70 -top-4" />
          <div className="absolute h-6 w-[1.5px] bg-emerald-500/70 -bottom-4" />

          {/* Hitmarker Flash */}
          {hitMarker && (
            <div
              className={`absolute text-2xl font-black transition-transform duration-100 ${
                hitMarker === 'head' ? 'text-red-500 scale-125' : 'text-white scale-100'
              }`}
            >
              ✕
            </div>
          )}
        </div>
      </div>

      {/* Click to Lock Mouse Prompt if unlocked */}
      {!isLocked && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-black/40 backdrop-blur-xs">
          <button
            onClick={onRequestLock}
            className="px-8 py-4 bg-emerald-600/90 hover:bg-emerald-500 text-white font-mono font-bold text-lg rounded-xl shadow-2xl border border-emerald-400/50 flex items-center gap-3 transition-transform hover:scale-105 active:scale-95"
          >
            <Crosshair className="w-6 h-6 animate-spin" />
            CLICK SCREEN TO AIM & ENGAGE (POINTER LOCK)
          </button>
        </div>
      )}

      {/* Bottom Bar: Health, Stamina, Ammo */}
      <div className="flex justify-between items-end">
        {/* Player Health Bar */}
        <div className="bg-black/80 backdrop-blur-md border border-zinc-800 p-4 rounded-xl min-w-[280px]">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-zinc-300 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              VITALS
            </span>
            <span className="text-emerald-400 font-mono text-sm">{health} / {maxHealth}</span>
          </div>
          <div className="w-full bg-zinc-900 h-3 rounded-full overflow-hidden border border-zinc-800">
            <div
              className={`h-full transition-all duration-300 ${
                hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 25 ? 'bg-amber-500' : 'bg-red-600'
              }`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        {/* Ammo & Reload Indicator */}
        <div className="bg-black/80 backdrop-blur-md border border-zinc-800 p-4 rounded-xl min-w-[240px] text-right">
          <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-0.5">AR-15 ASSAULT RIFLE</div>
          <div className="flex items-baseline justify-end gap-1 font-mono">
            <span className={`text-4xl font-black ${ammo < 8 ? 'text-red-500 animate-pulse' : 'text-slate-100'}`}>
              {isReloading ? '--' : ammo}
            </span>
            <span className="text-zinc-500 font-bold text-lg">/ {maxAmmo}</span>
          </div>
          {isReloading ? (
            <div className="text-xs font-mono text-amber-400 font-bold flex items-center justify-end gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5 animate-spin" />
              RELOADING...
            </div>
          ) : (
            <div className="text-[11px] font-mono text-zinc-500 mt-1">
              [L-CLICK] FIRE &nbsp; [R] RELOAD
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
