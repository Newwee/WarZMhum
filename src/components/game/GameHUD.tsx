'use client';

import React from 'react';
import { PlayerNetState, PlayerInventory, WeaponType, KillFeedItem } from '@/types/game';
import { Crosshair, Users, Skull, Activity, AlertCircle, Compass, Radio, DollarSign, Shield, PlusCircle } from 'lucide-react';

interface GameHUDProps {
  health: number;
  maxHealth: number;
  stamina: number;
  ammo: number;
  maxAmmo: number;
  isReloading: boolean;
  score: number;
  kills: number;
  killFeed?: KillFeedItem[];
  remotePlayers: Record<string, PlayerNetState>;
  hitMarker: 'body' | 'head' | null;
  isLocked: boolean;
  onRequestLock: () => void;
  damageVignette: boolean;
  healVignette: boolean;
  currentWeapon: WeaponType;
  inventory: PlayerInventory;
  isADS: boolean;
  perspective: 'FPS' | 'TPS';
  onSelectSlot: (weapon: WeaponType) => void;
  onOpenShop?: () => void;
  isShopOpen?: boolean;
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
  killFeed = [],
  remotePlayers,
  hitMarker,
  isLocked,
  onRequestLock,
  damageVignette,
  healVignette,
  currentWeapon,
  inventory,
  isADS,
  perspective,
  onSelectSlot,
  onOpenShop,
  isShopOpen = false,
}: GameHUDProps) {
  const hpPercent = Math.max(0, Math.min(100, (health / maxHealth) * 100));

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between p-4 sm:p-6 overflow-hidden">
      {/* Damage Hurt Vignette */}
      {damageVignette && (
        <div className="fixed inset-0 bg-red-600/35 border-[12px] border-red-600/80 animate-pulse pointer-events-none transition-opacity duration-300" />
      )}

      {/* Healing Stimulant Vignette */}
      {healVignette && (
        <div className="fixed inset-0 bg-emerald-500/25 border-[10px] border-emerald-500/60 animate-pulse pointer-events-none transition-opacity duration-300" />
      )}

      {/* TOP BAR: Clock, Squad Roster, Cash, Zone Status, Compass & KillFeed */}
      <div className="flex justify-between items-start">
        {/* Top-Left: WarZ Clock & Squad Status */}
        <div className="flex flex-col gap-2">
          {/* Digital Clock, Zone Info & Cash */}
          <div className="flex items-center gap-2">
            <div className="bg-black/75 backdrop-blur-sm border border-zinc-800/80 rounded-lg px-3 py-1.5 flex items-center gap-3">
              <span className="text-sm font-mono font-black text-zinc-200">19:27</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-800/60 font-bold uppercase">
                WAR ZONE
              </span>
              <span className="text-[10px] font-mono text-zinc-400">
                [V] VIEW: <strong className="text-emerald-400">{perspective}</strong>
              </span>
            </div>

            {/* Survivor Cash Balance */}
            <div className="bg-emerald-950/85 backdrop-blur-sm border border-emerald-500/60 rounded-lg px-3 py-1.5 flex items-center gap-1.5 shadow-lg">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-black text-emerald-400">
                ${inventory.money.toLocaleString()}
              </span>
            </div>
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
                <span className="text-zinc-300">{Math.round(health)} HP</span>
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

        {/* Top-Center: Minimal Open Survival Zone Badge (No Wave Counter) */}
        <div className="bg-black/70 backdrop-blur-md border border-zinc-800/80 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-2xl">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span className="text-[11px] font-mono font-bold text-zinc-300 tracking-wider uppercase">
            OPEN SURVIVAL ZONE // WARZ PVP
          </span>
        </div>

        {/* Top-Right: WarZ Tactical Compass Dial & Live KillFeed */}
        <div className="flex flex-col items-end gap-2 max-w-xs">
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

          {/* Real-time KillFeed List */}
          <div className="flex flex-col gap-1.5 items-end pointer-events-none mt-1">
            {killFeed.slice(-5).map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-2 px-3 py-1 rounded-lg backdrop-blur-md font-mono text-xs border shadow-lg animate-in fade-in slide-in-from-right-3 duration-200 ${
                  item.isPvP
                    ? 'bg-red-950/85 border-red-600/70 text-red-200'
                    : 'bg-black/80 border-zinc-800 text-zinc-300'
                }`}
              >
                <span className="font-bold text-white max-w-[90px] truncate">{item.killerName}</span>
                <div className="flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-zinc-900/90 border border-zinc-700/60">
                  {item.isHeadshot && <span className="text-red-400 font-black">🎯</span>}
                  <span className="text-zinc-200 font-bold">{item.weapon}</span>
                </div>
                <span className={`max-w-[90px] truncate font-bold ${item.isPvP ? 'text-amber-300' : 'text-zinc-400'}`}>
                  {item.victimName}
                </span>
              </div>
            ))}
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

      {/* Pointer Lock Overlay (Only when not locked AND shop is closed) */}
      {!isLocked && !isShopOpen && (
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
            <span className="font-bold text-white">HP: {Math.round(health)}%</span>
            <span>STAMINA: {Math.round(stamina)}%</span>
          </div>
        </div>

        {/* 2. BOTTOM-CENTER: WarZ Quick Hotbar */}
        <div className="hidden sm:flex items-center gap-1.5 bg-black/85 backdrop-blur-md border border-zinc-800/80 px-3 py-2 rounded-xl pointer-events-auto">
          {/* Slot 1: Primary Rifle */}
          <button
            onClick={() => inventory.hasRifle && onSelectSlot('RIFLE')}
            disabled={!inventory.hasRifle}
            className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold border transition-all cursor-pointer ${
              currentWeapon === 'RIFLE'
                ? 'bg-red-950/90 border-red-500 text-white shadow-md'
                : inventory.hasRifle
                ? 'bg-zinc-900/80 border-zinc-700 text-zinc-300 hover:text-white'
                : 'bg-zinc-950/60 border-zinc-900 text-zinc-600 cursor-not-allowed'
            }`}
          >
            [1] M4A1 {inventory.hasRifle ? '' : '🔒'}
          </button>

          {/* Slot 2: Secondary Pistol */}
          <button
            onClick={() => inventory.hasPistol && onSelectSlot('PISTOL')}
            disabled={!inventory.hasPistol}
            className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold border transition-all cursor-pointer ${
              currentWeapon === 'PISTOL'
                ? 'bg-amber-950/90 border-amber-500 text-white shadow-md'
                : inventory.hasPistol
                ? 'bg-zinc-900/80 border-zinc-700 text-zinc-300 hover:text-white'
                : 'bg-zinc-950/60 border-zinc-900 text-zinc-600 cursor-not-allowed'
            }`}
          >
            [2] .45 PISTOL {inventory.hasPistol ? '' : '🔒'}
          </button>

          {/* Slot 3: IceWall */}
          <button
            onClick={() => inventory.iceWalls > 0 && onSelectSlot('ICEWALL')}
            disabled={inventory.iceWalls <= 0}
            className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold border transition-all cursor-pointer ${
              currentWeapon === 'ICEWALL'
                ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-950'
                : inventory.iceWalls > 0
                ? 'bg-zinc-900/80 border-cyan-800/50 text-cyan-300 hover:text-white'
                : 'bg-zinc-950/60 border-zinc-900 text-zinc-600 cursor-not-allowed'
            }`}
          >
            [3] ICE WALL ({inventory.iceWalls})
          </button>

          {/* Slot 4: Medkit */}
          <button
            onClick={() => inventory.medkits > 0 && onSelectSlot('MEDKIT')}
            disabled={inventory.medkits <= 0}
            className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold border transition-all cursor-pointer ${
              currentWeapon === 'MEDKIT'
                ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200 shadow-md shadow-emerald-950'
                : inventory.medkits > 0
                ? 'bg-zinc-900/80 border-emerald-800/50 text-emerald-300 hover:text-white'
                : 'bg-zinc-950/60 border-zinc-900 text-zinc-600 cursor-not-allowed'
            }`}
          >
            [4] MEDKIT ({inventory.medkits})
          </button>

          {/* Slot 5: Unarmed */}
          <button
            onClick={() => onSelectSlot('UNARMED')}
            className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold border transition-all cursor-pointer ${
              currentWeapon === 'UNARMED'
                ? 'bg-zinc-800 border-zinc-400 text-white'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            [5] UNARMED
          </button>
        </div>

        {/* 3. BOTTOM-RIGHT: WarZ Weapon & Ammo Counter */}
        <div className="bg-black/85 backdrop-blur-md border border-zinc-800/80 p-3.5 rounded-xl min-w-[200px] text-right">
          {currentWeapon === 'UNARMED' && (
            <>
              <div className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider mb-0.5">
                BARE HANDS // UNARMED
              </div>
              <div className="text-3xl font-black font-mono text-zinc-300">
                FISTS
              </div>
              <div className="text-[10px] font-mono text-amber-400 mt-1">
                [L-CLICK] MELEE PUNCH
              </div>
            </>
          )}

          {currentWeapon === 'ICEWALL' && (
            <>
              <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider mb-0.5">
                ICE WALL DEPLOYER
              </div>
              <div className="text-3xl font-black font-mono text-cyan-300">
                x{inventory.iceWalls}
              </div>
              <div className="text-[10px] font-mono text-cyan-400/80 mt-1">
                [L-CLICK] DEPLOY 400HP BULLETPROOF WALL
              </div>
            </>
          )}

          {currentWeapon === 'MEDKIT' && (
            <>
              <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider mb-0.5">
                MILITARY SURGICAL MEDKIT
              </div>
              <div className="text-3xl font-black font-mono text-emerald-300">
                x{inventory.medkits}
              </div>
              <div className="text-[10px] font-mono text-emerald-400/80 mt-1">
                [L-CLICK] OR [4] INJECT (+50 HP)
              </div>
            </>
          )}

          {(currentWeapon === 'RIFLE' || currentWeapon === 'PISTOL') && (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
