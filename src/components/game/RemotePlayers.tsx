'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { PlayerNetState } from '@/types/game';

interface RemotePlayersProps {
  players: Record<string, PlayerNetState>;
  currentUserId: string;
}

function RemotePlayerMesh({ player }: { player: PlayerNetState }) {
  const groupRef = useRef<THREE.Group>(null);
  const targetPos = useRef(new THREE.Vector3(...player.transform.position));
  const targetRot = useRef(player.transform.rotation[1]);

  // Update target when props change
  targetPos.current.set(...player.transform.position);
  targetRot.current = player.transform.rotation[1];

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Smooth lerp position (10 Hz network interpolation)
    groupRef.current.position.lerp(targetPos.current, Math.min(delta * 12, 1));

    // Smooth rotation lerp
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetRot.current,
      Math.min(delta * 12, 1)
    );
  });

  return (
    <group ref={groupRef} position={player.transform.position}>
      {/* Nametag and Health HUD above head */}
      <Html position={[0, 2.3, 0]} center distanceFactor={15}>
        <div className="flex flex-col items-center pointer-events-none select-none">
          <div className="px-2 py-0.5 rounded bg-black/80 border border-emerald-500/50 text-[11px] font-mono font-bold text-emerald-400 whitespace-nowrap shadow-md">
            {player.name}
          </div>
          <div className="w-16 h-1.5 bg-black/80 rounded-full mt-1 border border-zinc-700 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-200"
              style={{ width: `${Math.max(0, Math.min(100, player.health))}%` }}
            />
          </div>
        </div>
      </Html>

      {/* Survivor 3D Model */}
      {/* Head */}
      <mesh position={[0, 1.85, 0]} castShadow>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#e0a986" roughness={0.6} />
      </mesh>
      {/* Tactical Cap / Helmet */}
      <mesh position={[0, 1.95, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.1, 16]} />
        <meshStandardMaterial color="#1e2925" roughness={0.7} />
      </mesh>

      {/* Torso / Tactical Vest */}
      <mesh position={[0, 1.25, 0]} castShadow>
        <boxGeometry args={[0.55, 0.75, 0.35]} />
        <meshStandardMaterial color="#2d3732" roughness={0.7} />
      </mesh>

      {/* Legs */}
      <mesh position={[-0.15, 0.45, 0]} castShadow>
        <boxGeometry args={[0.2, 0.85, 0.22]} />
        <meshStandardMaterial color="#1f2421" roughness={0.8} />
      </mesh>
      <mesh position={[0.15, 0.45, 0]} castShadow>
        <boxGeometry args={[0.2, 0.85, 0.22]} />
        <meshStandardMaterial color="#1f2421" roughness={0.8} />
      </mesh>

      {/* Weapon in Hands */}
      <group position={[0.25, 1.2, -0.3]}>
        <mesh>
          <boxGeometry args={[0.06, 0.08, 0.45]} />
          <meshStandardMaterial color="#111815" metalness={0.8} />
        </mesh>
        {player.transform.isShooting && (
          <pointLight position={[0, 0, -0.3]} color="#ffaa00" intensity={3} distance={4} />
        )}
      </group>
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
