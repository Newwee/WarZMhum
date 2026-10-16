'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Crosshair, Users, Play, ArrowRight, Radio, Sparkles } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase/client';

interface MainMenuProps {
  onCreateRoom: (playerName: string) => void;
  onJoinRoom: (roomCode: string, playerName: string) => void;
}

export function MainMenu({ onCreateRoom, onJoinRoom }: MainMenuProps) {
  const [playerName, setPlayerName] = useState('Survivor');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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

      {/* Top Bar: Game Title & Connection Status */}
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
            <p className="text-xs font-mono text-zinc-500">Multiplayer Zombie Web Defense</p>
          </div>
        </div>

        {/* Backend & Network Status Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono">
          <Radio className={`w-3.5 h-3.5 ${isSupabaseConfigured ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
          <span className="text-zinc-400">NETWORK:</span>
          <span className={isSupabaseConfigured ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
            {isSupabaseConfigured ? 'SUPABASE REALTIME ACTIVE' : 'LOCAL MULTI-TAB SYNC'}
          </span>
        </div>
      </header>

      {/* Center Panel: Callsign, Create Room, Join Room */}
      <main className="relative z-10 max-w-lg w-full mx-auto my-auto py-10">
        <div className="bg-zinc-950/90 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
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

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-950/50 border border-red-600/50 text-red-400 text-xs font-mono">
              {errorMsg}
            </div>
          )}

          {/* Action 1: Create Room */}
          <button
            onClick={handleCreate}
            className="w-full py-4 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-mono font-bold rounded-xl shadow-xl shadow-red-950/40 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Play className="w-5 h-5 fill-current" />
            CREATE OUTPOST ROOM (HOST)
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-zinc-800"></div>
            <span className="flex-shrink mx-4 text-xs font-mono text-zinc-600 uppercase">OR JOIN WITH CODE</span>
            <div className="flex-grow border-t border-zinc-800"></div>
          </div>

          {/* Action 2: Join by Room Code */}
          <form onSubmit={handleJoin} className="flex gap-2">
            <input
              type="text"
              maxLength={8}
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
              placeholder="ROOM CODE (e.g. WZ-84A)"
              className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl font-mono text-white placeholder-zinc-600 uppercase focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-mono font-bold rounded-xl flex items-center gap-2 transition-all"
            >
              <span>JOIN</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Info Box */}
          <div className="pt-4 border-t border-zinc-900 text-[11px] font-mono text-zinc-500 space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Multiplayer Testing Tip:</span>
            </div>
            <p>
              Open another browser window or incognito tab, click Create on one and Join with the generated room code on the other!
            </p>
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="relative z-10 text-center text-xs font-mono text-zinc-600 py-4 border-t border-zinc-900">
        Controls: [WASD] Move &bull; [MOUSE] Aim & Look &bull; [LEFT CLICK] Shoot &bull; [R] Reload &bull; [SHIFT] Sprint &bull; [SPACE] Jump
      </footer>
    </div>
  );
}
