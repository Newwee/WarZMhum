'use client';

import React, { useState } from 'react';
import { RoomMember } from '@/types/game';
import { Users, Copy, Check, Play, LogOut, Crown, ShieldCheck, ShieldAlert, Sparkles } from 'lucide-react';

interface RoomLobbyProps {
  roomCode: string;
  members: RoomMember[];
  currentUserId: string;
  isHost: boolean;
  onToggleReady: (ready: boolean) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export function RoomLobby({
  roomCode,
  members,
  currentUserId,
  isHost,
  onToggleReady,
  onStartGame,
  onLeaveRoom,
}: RoomLobbyProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const currentUser = members.find((m) => m.profile_id === currentUserId);
  const isReady = currentUser?.is_ready || false;

  // Check if all players are ready
  const allReady = members.length > 0 && members.every((m) => m.is_ready || m.role === 'HOST');

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyInviteLink = () => {
    const url = `${window.location.origin}/?room=${roomCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="relative min-h-screen bg-[#070b09] text-zinc-100 flex flex-col justify-between p-6 sm:p-12 overflow-hidden select-none">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/20 via-black to-black pointer-events-none" />
      <div className="absolute inset-0 scanline opacity-30 pointer-events-none" />

      {/* Top Bar: Room Code and Copy Actions */}
      <header className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1">
            <span>OUTPOST STAGING AREA</span>
            <span>&bull;</span>
            <span className="text-emerald-400 font-bold">READY CHECK</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black font-mono tracking-wider text-white">
              ROOM: <span className="text-emerald-400">{roomCode}</span>
            </h1>
            <button
              onClick={copyRoomCode}
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 transition-colors"
              title="Copy Room Code"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={copyInviteLink}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl font-mono text-xs text-zinc-300 flex items-center gap-2 transition-colors"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>COPY INVITE LINK</span>
          </button>

          <button
            onClick={onLeaveRoom}
            className="px-4 py-2 bg-red-950/50 hover:bg-red-900/60 border border-red-700/60 text-red-300 rounded-xl font-mono text-xs flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>LEAVE LOBBY</span>
          </button>
        </div>
      </header>

      {/* Main Squad Area: Player Roster & Ready Status */}
      <main className="relative z-10 max-w-2xl w-full mx-auto my-auto py-8">
        <div className="bg-zinc-950/90 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
            <div className="flex items-center gap-2 font-mono text-sm font-bold text-zinc-300">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>SQUAD OPERATIVES ({members.length}/4)</span>
            </div>
            <div className="text-xs font-mono text-zinc-500">
              {allReady ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> ALL SQUAD READY
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> AWAITING READY SIGNALS
                </span>
              )}
            </div>
          </div>

          {/* Player Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {members.map((member) => {
              const isMe = member.profile_id === currentUserId;
              const isMemberHost = member.role === 'HOST';

              return (
                <div
                  key={member.id || member.profile_id}
                  className={`p-4 rounded-xl border font-mono transition-all ${
                    isMe
                      ? 'bg-zinc-900/90 border-emerald-500/50 shadow-md shadow-emerald-950/20'
                      : 'bg-zinc-900/40 border-zinc-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {isMemberHost && <Crown className="w-4 h-4 text-amber-400" />}
                      <span className="font-bold text-white text-sm truncate max-w-[120px]">
                        {member.display_name}
                      </span>
                      {isMe && <span className="text-[10px] text-emerald-400 font-bold">(YOU)</span>}
                    </div>

                    {isMemberHost ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/80 border border-amber-600/50 text-amber-400 font-bold">
                        HOST
                      </span>
                    ) : member.is_ready ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-600/50 text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> READY
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                        WAITING
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>Connected &bull; Ping &lt; 30ms</span>
                  </div>
                </div>
              );
            })}

            {/* Empty Slots */}
            {Array.from({ length: Math.max(0, 4 - members.length) }).map((_, idx) => (
              <div
                key={`empty_${idx}`}
                className="p-4 rounded-xl border border-dashed border-zinc-800/80 bg-zinc-950/30 flex items-center justify-center font-mono text-xs text-zinc-600"
              >
                + Empty Survivor Slot
              </div>
            ))}
          </div>

          {/* Action Controls */}
          <div className="pt-4 border-t border-zinc-900 flex flex-col sm:flex-row items-center gap-3">
            {/* Ready Toggle for Non-Host / Players */}
            {!isHost && (
              <button
                onClick={() => onToggleReady(!isReady)}
                className={`w-full py-4 font-mono font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  isReady
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                }`}
              >
                {isReady ? <Check className="w-5 h-5" /> : null}
                <span>{isReady ? 'READY FOR DEPLOYMENT' : 'CLICK TO READY UP'}</span>
              </button>
            )}

            {/* Host Start Game Button */}
            {isHost && (
              <button
                onClick={onStartGame}
                className="w-full py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-mono font-bold text-base rounded-xl shadow-xl shadow-red-950/50 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>START SQUAD MISSION</span>
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-xs font-mono text-zinc-600 py-2">
        Awaiting squad leader signal &bull; Prepare defensive perimeter
      </footer>
    </div>
  );
}
