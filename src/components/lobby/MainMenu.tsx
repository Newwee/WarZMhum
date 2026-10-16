'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Crosshair, Users, Play, ArrowRight, Radio, Sparkles, ShoppingBag, DollarSign, Shield, Zap } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { PlayerInventory } from '@/types/game';
import { WarZInventoryModal } from '@/components/game/WarZInventoryModal';

interface MainMenuProps {
  onPlayPublic: (playerName: string) => void;
  onCreateRoom: (playerName: string) => void;
  onJoinRoom: (roomCode: string, playerName: string) => void;
  inventory: PlayerInventory;
  onInventoryChange: (inv: PlayerInventory) => void;
}

export function MainMenu({ onPlayPublic, onCreateRoom, onJoinRoom, inventory, onInventoryChange }: MainMenuProps) {
  const [playerName, setPlayerName] = useState('Survivor');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isShopOpen, setIsShopOpen] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem('warz_player_name');
    if (savedName) {
      setPlayerName(savedName);
    } else {
      const randomId = Math.floor(1000 + Math.random() * 9000);
      setPlayerName(`Survivor_${randomId}`);
    }
  }, []);

  const handleNameChange = (val: string) => {
    setPlayerName(val);
    localStorage.setItem('warz_player_name', val);
  };

  const handlePlayNow = () => {
    if (!playerName.trim()) {
      setErrorMsg('Please enter your survivor callsign.');
      return;
    }
    setErrorMsg('');
    onPlayPublic(playerName.trim());
  };

  const handleCreate = () => {
    if (!playerName.trim()) {
      setErrorMsg('Please enter your survivor callsign.');
      return;
    }
    setErrorMsg('');
    onCreateRoom(playerName.trim());
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setErrorMsg('Please enter your survivor callsign.');
      return;
    }
    const cleanCode = roomCodeInput.trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 4) {
      setErrorMsg('Please enter a valid room code (e.g. WZ-84A).');
      return;
    }
    setErrorMsg('');
    onJoinRoom(cleanCode, playerName.trim());
  };

  return (
    <div className="relative min-h-screen bg-[#070b09] text-zinc-100 flex flex-col justify-between p-6 sm:p-12 overflow-hidden select-none">
      {/* Background Gradients & Scanline */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/20 via-black to-black pointer-events-none" />
      <div className="absolute inset-0 scanline opacity-30 pointer-events-none" />

      {/* Top Bar: Game Title & Connection Status & Cash Armory */}
      <header className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800/80 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-600/50 flex items-center justify-center shadow-lg shadow-red-950/50">
            <ShieldAlert className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black font-mono tracking-wider text-white flex items-center gap-2">
              WARZ <span className="text-red-500">SURVIVAL</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-normal">MVP v0.1</span>
            </h1>
            <p className="text-xs font-mono text-zinc-500">Multiplayer Zombie Web Defense &bull; Open World PvP</p>
          </div>
        </div>

        {/* Funds & Armory Shop Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-xs font-mono shadow-lg">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span className="text-zinc-400">FUNDS:</span>
            <span className="text-emerald-400 font-bold font-mono text-sm">
              ${inventory.money.toLocaleString()}
            </span>
          </div>

          <button
            onClick={() => setIsShopOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-mono font-black text-xs rounded-xl shadow-lg shadow-amber-950/50 flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>ARMORY & LOADOUT</span>
          </button>

          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono">
            <Radio className={`w-3.5 h-3.5 ${isSupabaseConfigured ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
            <span className="text-zinc-400">NETWORK:</span>
            <span className={isSupabaseConfigured ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {isSupabaseConfigured ? 'ONLINE' : 'LOCAL SYNC'}
            </span>
          </div>
        </div>
      </header>

      {/* Center Panel: Callsign, Play Now Public, Loadout Preview, Private Rooms */}
      <main className="relative z-10 max-w-xl w-full mx-auto my-auto py-8">
        <div className="bg-zinc-950/90 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
          {/* Callsign Input */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              SURVIVOR CALLSIGN
            </label>
            <input
              type="text"
              maxLength={16}
              value={playerName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter your name..."
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Current Equipped Loadout Strip */}
          <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400">CURRENT LOADOUT:</span>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${inventory.hasRifle ? 'bg-red-950 text-red-300 border border-red-800/60' : 'bg-zinc-800 text-zinc-500'}`}>
                {inventory.hasRifle ? 'M4A1 RIFLE' : 'NO PRIMARY'}
              </span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${inventory.hasPistol ? 'bg-amber-950 text-amber-300 border border-amber-800/60' : 'bg-zinc-800 text-zinc-500'}`}>
                {inventory.hasPistol ? '.45 PISTOL' : 'NO SIDEARM'}
              </span>
              {inventory.iceWalls > 0 && (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                  x{inventory.iceWalls} ICE WALL
                </span>
              )}
              {inventory.medkits > 0 && (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                  x{inventory.medkits} MEDKIT
                </span>
              )}
              {!inventory.hasRifle && !inventory.hasPistol && inventory.iceWalls === 0 && inventory.medkits === 0 && (
                <span className="text-amber-400 font-bold">(BARE HANDS)</span>
              )}
            </div>
            <button
              onClick={() => setIsShopOpen(true)}
              className="text-amber-400 hover:text-amber-300 underline font-bold cursor-pointer"
            >
              EDIT
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-950/50 border border-red-600/50 text-red-400 text-xs font-mono">
              {errorMsg}
            </div>
          )}

          {/* Action 1: PLAY NOW (PUBLIC WARZONE) */}
          <button
            onClick={handlePlayNow}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-mono font-black text-lg rounded-xl shadow-2xl shadow-emerald-950/60 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <Zap className="w-6 h-6 fill-current animate-pulse text-yellow-300" />
            <span>PLAY NOW (PUBLIC WARZONE)</span>
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-zinc-800"></div>
            <span className="flex-shrink mx-4 text-xs font-mono text-zinc-600 uppercase">OR CUSTOM SQUAD OUTPOST</span>
            <div className="flex-grow border-t border-zinc-800"></div>
          </div>

          {/* Action 2: Create Private Room */}
          <button
            onClick={handleCreate}
            className="w-full py-3 bg-red-950/70 hover:bg-red-900/80 border border-red-700/60 text-red-200 font-mono font-bold text-sm rounded-xl flex items-center justify-center gap-2.5 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current text-red-400" />
            <span>CREATE PRIVATE ROOM (HOST)</span>
          </button>

          {/* Action 3: Join Private Room with code */}
          <form onSubmit={handleJoin} className="flex gap-2">
            <input
              type="text"
              maxLength={8}
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
              placeholder="ENTER ROOM CODE (e.g. WZ-84A)"
              className="flex-1 px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl font-mono text-white placeholder-zinc-600 uppercase focus:outline-none focus:border-emerald-500 transition-colors text-xs"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-mono font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>JOIN</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Tip Box */}
          <div className="pt-3 border-t border-zinc-900 text-[11px] font-mono text-zinc-500 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Click <strong>PLAY NOW</strong> to jump straight into the shared global server with everyone!</span>
          </div>
        </div>
      </main>

      {/* WarZ Global Stash & Loadout Modal */}
      <WarZInventoryModal
        isOpen={isShopOpen}
        onClose={() => setIsShopOpen(false)}
        inventory={inventory}
        onUpdateInventory={onInventoryChange}
        mode="LOBBY"
      />

      {/* Footer Info */}
      <footer className="relative z-10 text-center text-xs font-mono text-zinc-600 py-4 border-t border-zinc-900">
        Controls: [WASD] Move &bull; [MOUSE] Aim & Look &bull; [LEFT CLICK] Shoot &bull; [R] Reload &bull; [SHIFT] Sprint &bull; [SPACE] Jump
      </footer>
    </div>
  );
}
