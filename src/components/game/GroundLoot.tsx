'use client';

import React from 'react';
import { GroundLootCrate } from '@/types/game';
import { Html } from '@react-three/drei';

interface GroundLootProps {
  crates: GroundLootCrate[];
  nearestCrateId: string | null;
  lootProgress: number; // 0 to 1
  isLooting: boolean;
}

export function GroundLoot({
  crates,
  nearestCrateId,
  lootProgress,
  isLooting,
}: GroundLootProps) {
  return (
    <>
      {crates.map((crate) => {
        if (crate.looted) return null;
        const isNear = crate.id === nearestCrateId;

        return (
          <group key={crate.id} position={crate.position}>
            {/* Tactical Military Pelican Crate */}
            <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.9, 0.44, 0.6]} />
              <meshStandardMaterial color="#3b3f36" roughness={0.6} metalness={0.4} />
            </mesh>

            {/* Crate Latches & Trim */}
            <mesh position={[0, 0.23, 0.31]}>
              <boxGeometry args={[0.75, 0.08, 0.03]} />
              <meshStandardMaterial color="#1a1c18" metalness={0.8} />
            </mesh>

            {/* Dropped Tactical Survivor Backpack on Top */}
            <mesh position={[0, 0.52, 0]} rotation={[0.1, 0.2, 0]} castShadow>
              <boxGeometry args={[0.65, 0.3, 0.45]} />
              <meshStandardMaterial color="#8a7350" roughness={0.9} />
            </mesh>

            {/* Subtle Amber Glow Marker */}
            <pointLight position={[0, 0.8, 0]} color="#f59e0b" intensity={isNear ? 2.5 : 1.2} distance={8} />

            {/* 3D In-World Floating Prompt */}
            <Html position={[0, 1.1, 0]} center distanceFactor={14} style={{ pointerEvents: 'none' }}>
              <div className="flex flex-col items-center gap-1 font-mono select-none">
                <div className={`px-2.5 py-1 rounded-lg backdrop-blur-md border text-xs font-bold shadow-xl transition-all ${
                  isNear ? 'bg-amber-950/90 border-amber-400 text-amber-300 scale-110' : 'bg-black/75 border-zinc-700 text-zinc-300'
                }`}>
                  {isNear ? (
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-amber-500 text-black font-black text-[10px]">
                        HOLD [E]
                      </span>
                      <span>LOOT {crate.ownerName.toUpperCase()}&apos;S CRATE</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-zinc-400">🎒 SURVIVOR CRATE ({crate.ownerName})</span>
                  )}
                </div>

                {/* Circular / Bar Progress when holding [E] */}
                {isNear && isLooting && (
                  <div className="w-28 bg-zinc-900/90 border border-amber-500 rounded-full h-2 overflow-hidden shadow-lg">
                    <div
                      className="bg-amber-400 h-full transition-all duration-75"
                      style={{ width: `${Math.round(lootProgress * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </Html>
          </group>
        );
      })}
    </>
  );
}
