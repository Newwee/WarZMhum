'use client';

import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { ZombieNetState, ZombieType, PlayerNetState, WaveState } from '@/types/game';
import { RealtimeManager } from '@/lib/network/realtime-manager';
import { sounds } from '@/lib/audio/sound-effects';

interface ZombiesProps {
  zombies: ZombieNetState[];
  setZombies: React.Dispatch<React.SetStateAction<ZombieNetState[]>>;
  zombiesRef: React.MutableRefObject<ZombieNetState[]>;
  isHost: boolean;
  localPlayerId: string;
  localPlayerPos: [number, number, number];
  localPlayerHealth: number;
  onDamagePlayer: (damage: number) => void;
  onKillZombie: (zombieId: string, zombieType: ZombieType) => void;
  remotePlayers: Record<string, PlayerNetState>;
  realtimeManager: RealtimeManager | null;
  currentWave: number;
  waveState: WaveState;
  setWaveState: React.Dispatch<React.SetStateAction<WaveState>>;
}

export function Zombies({
  zombies,
  setZombies,
  zombiesRef,
  isHost,
  localPlayerId,
  localPlayerPos,
  localPlayerHealth,
  onDamagePlayer,
  onKillZombie,
  remotePlayers,
  realtimeManager,
  currentWave,
  waveState,
  setWaveState,
}: ZombiesProps) {
  const lastSyncTime = useRef(0);
  const lastAttackTime = useRef<Record<string, number>>({});
  const lastMoanTime = useRef(0);

  // Sync ref with state
  useEffect(() => {
    zombiesRef.current = zombies;
  }, [zombies, zombiesRef]);

  // Host spawns wave when needed
  useEffect(() => {
    if (!isHost) return;

    if (zombies.length === 0 && waveState.isWaveActive) {
      // Calculate wave size: 5 + (wave * 4)
      const count = Math.min(30, 4 + currentWave * 4);
      const newZombies: ZombieNetState[] = [];

      for (let i = 0; i < count; i++) {
        // Spawn along perimeter (-36 to 36)
        const angle = Math.random() * Math.PI * 2;
        const radius = 32 + Math.random() * 6;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        // Determine zombie type
        let type: ZombieType = 'WALKER';
        let health = 60;
        let speed = 2.4;

        const rand = Math.random();
        if (currentWave >= 2 && rand > 0.75) {
          type = 'RUNNER';
          health = 40;
          speed = 4.6;
        } else if (currentWave >= 3 && rand < 0.2) {
          type = 'TANK';
          health = 220;
          speed = 1.6;
        }

        newZombies.push({
          id: `zombie_${currentWave}_${i}_${Date.now()}`,
          type,
          position: [x, 0, z],
          rotation: 0,
          health,
          maxHealth: health,
          speed,
          state: 'CHASING',
        });
      }

      setZombies(newZombies);
      setWaveState((prev) => ({
        ...prev,
        zombiesRemaining: count,
        totalZombiesInWave: count,
      }));
      sounds.playWaveAlarm();
    }
  }, [isHost, currentWave, waveState.isWaveActive, zombies.length, setZombies, setWaveState]);

  // Host Authoritative AI Update Loop
  useFrame((_, delta) => {
    if (!isHost) return;
    if (zombies.length === 0) return;

    const allSurvivors: Array<{ id: string; pos: [number, number, number]; health: number }> = [];
    if (localPlayerHealth > 0) {
      allSurvivors.push({ id: localPlayerId, pos: localPlayerPos, health: localPlayerHealth });
    }
    Object.values(remotePlayers).forEach((p) => {
      if (p.health > 0) {
        allSurvivors.push({ id: p.id, pos: p.transform.position, health: p.health });
      }
    });

    if (allSurvivors.length === 0) return; // All survivors dead

    let updated = false;
    const now = Date.now();

    // Random zombie atmospheric moan
    if (now - lastMoanTime.current > 6000 && Math.random() < 0.05) {
      lastMoanTime.current = now;
      sounds.playZombieMoan();
    }

    const nextZombies = zombies.map((zombie) => {
      if (zombie.health <= 0) return zombie;

      // Find closest survivor
      let closestDist = Infinity;
      let targetPos: [number, number, number] = localPlayerPos;
      let targetId = localPlayerId;

      for (const survivor of allSurvivors) {
        const dx = survivor.pos[0] - zombie.position[0];
        const dz = survivor.pos[2] - zombie.position[2];
        const dist = Math.hypot(dx, dz);
        if (dist < closestDist) {
          closestDist = dist;
          targetPos = survivor.pos;
          targetId = survivor.id;
        }
      }

      // Compute movement direction towards target
      const dirX = targetPos[0] - zombie.position[0];
      const dirZ = targetPos[2] - zombie.position[2];
      const angle = Math.atan2(dirX, dirZ);

      // Attack if close enough (< 1.6 units)
      if (closestDist < 1.6) {
        const lastAtk = lastAttackTime.current[zombie.id] || 0;
        if (now - lastAtk > 1200) {
          lastAttackTime.current[zombie.id] = now;
          const damage = zombie.type === 'TANK' ? 30 : 15;
          if (targetId === localPlayerId) {
            onDamagePlayer(damage);
          } else {
            realtimeManager?.sendPlayerDamaged(targetId, damage);
          }
          sounds.playPlayerHurt();
        }
        return {
          ...zombie,
          rotation: angle,
          state: 'ATTACKING' as const,
        };
      }

      // Move towards survivor
      const step = zombie.speed * delta;
      const newX = zombie.position[0] + Math.sin(angle) * step;
      const newZ = zombie.position[2] + Math.cos(angle) * step;

      updated = true;
      return {
        ...zombie,
        position: [newX, 0, newZ] as [number, number, number],
        rotation: angle,
        state: 'CHASING' as const,
        targetPlayerId: targetId,
      };
    });

    if (updated) {
      setZombies(nextZombies);
    }

    // Broadcast authoritative zombie sync at ~8 Hz (every 120ms)
    if (now - lastSyncTime.current > 120) {
      lastSyncTime.current = now;
      realtimeManager?.sendZombieSync(nextZombies);
    }
  });

  return (
    <>
      {zombies.map((zombie) => {
        if (zombie.health <= 0) return null;

        const isTank = zombie.type === 'TANK';
        const isRunner = zombie.type === 'RUNNER';
        const scale = isTank ? 1.4 : isRunner ? 0.9 : 1.0;
        const skinColor = isTank ? '#2d4739' : isRunner ? '#652323' : '#475549';

        return (
          <group
            key={zombie.id}
            position={[zombie.position[0], 0, zombie.position[2]]}
            rotation={[0, zombie.rotation, 0]}
            scale={[scale, scale, scale]}
          >
            {/* Health Bar above zombie */}
            <Html position={[0, 2.2, 0]} center distanceFactor={16}>
              <div className="w-12 h-1 bg-black/80 rounded border border-zinc-800 overflow-hidden pointer-events-none">
                <div
                  className={`h-full ${isTank ? 'bg-purple-500' : isRunner ? 'bg-amber-500' : 'bg-red-600'} transition-all`}
                  style={{ width: `${Math.max(0, (zombie.health / zombie.maxHealth) * 100)}%` }}
                />
              </div>
            </Html>

            {/* Zombie Head */}
            <mesh position={[0, 1.8, 0]} castShadow>
              <sphereGeometry args={[0.22, 12, 12]} />
              <meshStandardMaterial color={skinColor} roughness={0.9} />
            </mesh>

            {/* Glowing Eerie Eyes */}
            <mesh position={[0.08, 1.85, 0.2]}>
              <sphereGeometry args={[0.03, 8, 8]} />
              <meshBasicMaterial color="#ef4444" />
            </mesh>
            <mesh position={[-0.08, 1.85, 0.2]}>
              <sphereGeometry args={[0.03, 8, 8]} />
              <meshBasicMaterial color="#ef4444" />
            </mesh>

            {/* Torso with blood stains */}
            <mesh position={[0, 1.2, 0]} castShadow>
              <boxGeometry args={[0.55, 0.75, 0.3]} />
              <meshStandardMaterial color="#1a201c" roughness={0.8} />
            </mesh>

            {/* Reaching Arms (Zombie pose) */}
            <mesh position={[0.25, 1.35, 0.35]} rotation={[Math.PI / 2.2, 0, -0.2]}>
              <cylinderGeometry args={[0.08, 0.08, 0.65, 8]} />
              <meshStandardMaterial color={skinColor} roughness={0.9} />
            </mesh>
            <mesh position={[-0.25, 1.35, 0.35]} rotation={[Math.PI / 2.2, 0, 0.2]}>
              <cylinderGeometry args={[0.08, 0.08, 0.65, 8]} />
              <meshStandardMaterial color={skinColor} roughness={0.9} />
            </mesh>

            {/* Legs */}
            <mesh position={[-0.15, 0.45, 0]} castShadow>
              <boxGeometry args={[0.18, 0.85, 0.2]} />
              <meshStandardMaterial color="#161817" roughness={0.9} />
            </mesh>
            <mesh position={[0.15, 0.45, 0]} castShadow>
              <boxGeometry args={[0.18, 0.85, 0.2]} />
              <meshStandardMaterial color="#161817" roughness={0.9} />
            </mesh>
          </group>
        );
      })}
    </>
  );
}
