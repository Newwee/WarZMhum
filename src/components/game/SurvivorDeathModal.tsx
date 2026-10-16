'use client';

import React from 'react';
import { Skull, RotateCcw, Home, ShieldAlert, PackageOpen } from 'lucide-react';

interface SurvivorDeathModalProps {
  killerName?: string;
  weaponName?: string;
  onRespawn: () => void;
  onLeave: () => void;
}

export function SurvivorDeathModal({
  killerName,
  weaponName,
  onRespawn,
  onLeave,
}: SurvivorDeathModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-zinc-950/95 border-2 border-red-600/50 rounded-2xl p-6 md:p-8 shadow-2xl shadow-red-950/60 flex flex-col items-center text-center">
        {/* Pulsing Skull Indicator */}
        <div className="relative w-20 h-20 rounded-full bg-red-950/70 border border-red-500/50 flex items-center justify-center mb-5 shadow-lg shadow-red-950/80">
          <span className="absolute inset-0 rounded-full border border-red-500/40 animate-ping opacity-60 pointer-events-none" />
          <Skull className="w-10 h-10 text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]" />
        </div>

        <div className="text-xs font-mono font-bold tracking-widest text-red-400/90 uppercase mb-1">
          {killerName ? `KILLED BY ${killerName.toUpperCase()}` : 'ELIMINATED IN COMBAT'}
        </div>
        <h2 className="text-3xl font-black font-mono tracking-tight text-white mb-2">
          YOU DIED
        </h2>
        {weaponName && (
          <div className="inline-block px-3 py-1 bg-red-950/40 border border-red-800/40 rounded-full text-xs font-mono text-zinc-300 mb-4">
            FATAL WEAPON: <span className="text-red-400 font-bold">{weaponName}</span>
          </div>
        )}

        {/* WarZ Tactical Death Notice */}
        <div className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5 mb-6 text-left space-y-2">
          <div className="flex items-start gap-2.5">
            <PackageOpen className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs font-mono text-zinc-300 leading-relaxed">
              Equipped loadout dropped at your death coordinates as a <span className="text-amber-400 font-bold">Loot Crate</span>.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-xs font-mono text-zinc-400 leading-relaxed">
              Your <span className="text-emerald-400 font-bold">Outpost Safe Stash</span> and bank balance remain safe.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <button
            onClick={onRespawn}
            className="w-full sm:flex-1 py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-mono font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/40 active:scale-95 cursor-pointer text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            RESPAWN IN SAFE OUTPOST
          </button>

          <button
            onClick={onLeave}
            className="w-full sm:w-auto py-3.5 px-5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-mono font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer text-sm"
          >
            <Home className="w-4 h-4" />
            LOBBY
          </button>
        </div>
      </div>
    </div>
  );
}
