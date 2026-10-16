'use client';

import React from 'react';
import { Skull, Trophy, RotateCcw, Home, Clock, Award } from 'lucide-react';
import { MatchSummary } from '@/types/game';

interface GameOverModalProps {
  summary: MatchSummary;
  isHost: boolean;
  onRestart: () => void;
  onLeave: () => void;
}

export function GameOverModal({ summary, isHost, onRestart, onLeave }: GameOverModalProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center">
        {/* Skull Icon Header */}
        <div className="w-16 h-16 rounded-full bg-red-950/60 border border-red-600/40 flex items-center justify-center mb-4">
          <Skull className="w-9 h-9 text-red-500 animate-pulse" />
        </div>

        <h2 className="text-3xl font-black font-mono tracking-tight text-red-500 mb-1">OUTPOST OVERRUN</h2>
        <p className="text-zinc-400 font-mono text-sm mb-6">ALL SURVIVORS ELIMINATED</p>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 w-full mb-6">
          <div className="bg-zinc-900/80 border border-zinc-800/80 p-3 rounded-xl">
            <div className="flex items-center justify-center gap-1.5 text-zinc-500 text-xs font-mono mb-1">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>WAVE</span>
            </div>
            <div className="text-2xl font-black font-mono text-white">{summary.finalWave}</div>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800/80 p-3 rounded-xl">
            <div className="flex items-center justify-center gap-1.5 text-zinc-500 text-xs font-mono mb-1">
              <Award className="w-3.5 h-3.5 text-red-500" />
              <span>KILLS</span>
            </div>
            <div className="text-2xl font-black font-mono text-white">{summary.totalZombiesKilled}</div>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800/80 p-3 rounded-xl">
            <div className="flex items-center justify-center gap-1.5 text-zinc-500 text-xs font-mono mb-1">
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
              <span>SURVIVED</span>
            </div>
            <div className="text-2xl font-black font-mono text-white">{formatTime(summary.survivalSeconds)}</div>
          </div>
        </div>

        {/* Squad Performance Table */}
        <div className="w-full bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-4 mb-6">
          <div className="text-xs font-mono text-zinc-400 font-bold mb-3 text-left">SQUAD DEBRIEF</div>
          <div className="space-y-2">
            {summary.players.map((p, idx) => (
              <div key={p.id || idx} className="flex items-center justify-between font-mono text-xs py-1 border-b border-zinc-800/50 last:border-0">
                <span className="text-zinc-200 font-semibold">{p.name}</span>
                <div className="flex items-center gap-4 text-zinc-400">
                  <span>{p.kills} Kills</span>
                  <span className="text-emerald-400 font-bold">{p.score} PTS</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full">
          {isHost ? (
            <button
              onClick={onRestart}
              className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-mono font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-950/40"
            >
              <RotateCcw className="w-4 h-4" />
              DEPLOY AGAIN
            </button>
          ) : (
            <div className="flex-1 text-xs font-mono text-zinc-500 py-3">
              Waiting for Host to redeploy...
            </div>
          )}

          <button
            onClick={onLeave}
            className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            <Home className="w-4 h-4" />
            LOBBY
          </button>
        </div>
      </div>
    </div>
  );
}
