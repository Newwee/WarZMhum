'use client';

import React from 'react';
import { Html } from '@react-three/drei';
import { IceWallObject } from '@/types/game';

interface IceWallProps {
  iceWalls: IceWallObject[];
  previewActive: boolean;
  previewPos: [number, number, number];
  previewYaw: number;
}

export function IceWallManager({
  iceWalls,
  previewActive,
  previewPos,
  previewYaw,
}: IceWallProps) {
  return (
    <>
      {/* Active Ice Walls placed in the world */}
      {iceWalls.map((wall) => {
        const hpPct = Math.max(0, (wall.health / wall.maxHealth) * 100);

        return (
          <group
            key={wall.id}
            position={[wall.position[0], wall.position[1], wall.position[2]]}
            rotation={[0, wall.rotation, 0]}
          >
            {/* Health Bar floating above IceWall */}
            <Html position={[0, 1.65, 0]} center distanceFactor={14}>
              <div className="w-20 px-1 py-0.5 bg-black/85 rounded border border-cyan-500/50 backdrop-blur-xs flex flex-col items-center pointer-events-none shadow-lg">
                <span className="text-[9px] font-mono font-bold text-cyan-300">ICE WALL {Math.round(wall.health)}HP</span>
                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden mt-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 transition-all duration-150"
                    style={{ width: `${hpPct}%` }}
                  />
                </div>
              </div>
            </Html>

            {/* Main Bulletproof Ice Barrier */}
            <mesh castShadow receiveShadow position={[0, 0, 0]}>
              <boxGeometry args={[4.2, 2.6, 0.45]} />
              <meshStandardMaterial
                color="#7dd3fc"
                roughness={0.2}
                metalness={0.15}
                transparent
                opacity={0.88}
                emissive="#0284c7"
                emissiveIntensity={0.4}
              />
            </mesh>

            {/* Frost crystal columns on sides */}
            <mesh position={[-2.1, 0, 0]}>
              <boxGeometry args={[0.3, 2.75, 0.55]} />
              <meshStandardMaterial
                color="#bae6fd"
                roughness={0.1}
                transparent
                opacity={0.92}
                emissive="#38bdf8"
                emissiveIntensity={0.6}
              />
            </mesh>
            <mesh position={[2.1, 0, 0]}>
              <boxGeometry args={[0.3, 2.75, 0.55]} />
              <meshStandardMaterial
                color="#bae6fd"
                roughness={0.1}
                transparent
                opacity={0.92}
                emissive="#38bdf8"
                emissiveIntensity={0.6}
              />
            </mesh>

            {/* Crystal spikes along top edge */}
            {[-1.5, -0.75, 0, 0.75, 1.5].map((xOffset, i) => (
              <mesh key={i} position={[xOffset, 1.45, 0]} rotation={[0, 0, (i % 2 === 0 ? 0.08 : -0.08)]}>
                <coneGeometry args={[0.22, 0.6, 5]} />
                <meshStandardMaterial
                  color="#e0f2fe"
                  roughness={0.1}
                  transparent
                  opacity={0.9}
                  emissive="#0284c7"
                  emissiveIntensity={0.5}
                />
              </mesh>
            ))}

            {/* Ground frost glow ring */}
            <mesh position={[0, -1.28, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[4.8, 1.8]} />
              <meshBasicMaterial
                color="#38bdf8"
                transparent
                opacity={0.25}
              />
            </mesh>
          </group>
        );
      })}

      {/* Hologram Placement Preview */}
      {previewActive && (
        <group position={previewPos} rotation={[0, previewYaw, 0]}>
          <Html position={[0, 1.8, 0]} center distanceFactor={12}>
            <div className="px-3 py-1 bg-cyan-950/90 border border-cyan-400 text-cyan-300 font-mono text-xs font-black rounded-lg shadow-[0_0_15px_#38bdf8] animate-pulse pointer-events-none whitespace-nowrap">
              [LEFT CLICK] DEPLOY ICE WALL
            </div>
          </Html>

          {/* Hologram Box */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[4.2, 2.6, 0.45]} />
            <meshStandardMaterial
              color="#38bdf8"
              roughness={0.2}
              transparent
              opacity={0.42}
              wireframe={false}
              emissive="#0284c7"
              emissiveIntensity={0.7}
            />
          </mesh>

          {/* Wireframe border glow */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[4.25, 2.65, 0.48]} />
            <meshBasicMaterial
              color="#e0f2fe"
              wireframe
              transparent
              opacity={0.6}
            />
          </mesh>
        </group>
      )}
    </>
  );
}
