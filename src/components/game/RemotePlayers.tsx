'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { PlayerNetState } from '@/types/game';
import { SurvivorAvatar } from './SurvivorAvatar';

interface RemotePlayersProps {
  players: Record<string, PlayerNetState>;
  currentUserId: string;
}

function RemotePlayerMesh({ player }: { player: PlayerNetState }) {
  const groupRef = useRef<THREE.Group>(null);
  const targetPos = useRef(new THREE.Vector3(...player.transform.position));
  const targetRot = useRef(player.transform.rotation[1]);

  targetPos.current.set(player.transform.position[0], 0, player.transform.position[2]);
  targetRot.current = player.transform.rotation[1];

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.position.lerp(targetPos.current, Math.min(delta * 14, 1));
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetRot.current,
      Math.min(delta * 14, 1)
    );
  });

  return (
    <group ref={groupRef} position={[player.transform.position[0], 0, player.transform.position[2]]}>
      {/* Overhead Nametag & Health Bar */}
      <Html position={[0, 2.35, 0]} center distanceFactor={16}>
        <div className="flex flex-col items-center pointer-events-none select-none">
          <div className="px-2.5 py-0.5 rounded bg-black/85 border border-emerald-500/60 text-[11px] font-mono font-black text-emerald-400 whitespace-nowrap shadow-lg">
            {player.name}
          </div>
          <div className="w-16 h-1.5 bg-black/90 rounded-full mt-1 border border-zinc-700 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-200"
              style={{ width: `${Math.max(0, Math.min(100, player.health))}%` }}
            />
          </div>
        </div>
      </Html>

      {/* Survivor Character with Tactical Backpack & Helmet (WarZ Image 2) */}
      <SurvivorAvatar
        currentWeapon={(player.transform.currentWeapon as any) || 'RIFLE'}
        isShooting={player.transform.isShooting}
        isMoving={player.transform.isMoving}
      />
    </group>
  );
}

export function RemotePlayers({ players, currentUserId }: RemotePlayersProps) {
  const remoteEntries = Object.entries(players).filter(([id]) => id !== currentUserId);

  return (
    <>
      {remoteEntries.map(([id, player]) => (
        <RemotePlayerMesh key={id} player={player} />
      ))}
    </>
  );
}
