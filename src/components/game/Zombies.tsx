'use client';

import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { ZombieNetState, ZombieType, PlayerNetState, WaveState, IceWallObject } from '@/types/game';
import { RealtimeManager } from '@/lib/network/realtime-manager';
import { sounds } from '@/lib/audio/sound-effects';

interface ZombiesProps {
  zombies: ZombieNetState[];
  setZombies: React.Dispatch<React.SetStateAction<ZombieNetState[]>>;
  zombiesRef: React.MutableRefObject<ZombieNetState[]>;
  isHost: boolean;
  localPlayerId: string;
  localPlayerPosRef: React.MutableRefObject<[number, number, number]>;
  localPlayerHealth: number;
  onDamagePlayer: (damage: number) => void;
  onKillZombie: (zombieId: string, zombieType: ZombieType) => void;
  remotePlayers: Record<string, PlayerNetState>;
  realtimeManager: RealtimeManager | null;
  iceWallsRef?: React.MutableRefObject<IceWallObject[]>;
  onDamageIceWall?: (id: string, damage: number) => void;
}

export function Zombies({
  zombies,
  setZombies,
  zombiesRef,
  isHost,
  localPlayerId,
  localPlayerPosRef,
  localPlayerHealth,
  onDamagePlayer,
  onKillZombie,
  remotePlayers,
  realtimeManager,
  iceWallsRef,
  onDamageIceWall,
}: ZombiesProps) {
  const lastSyncTime = useRef(0);
  const lastAttackTime = useRef<Record<string, number>>({});
  const lastMoanTime = useRef(0);
  const lastStateSync = useRef(0);
  const wanderData = useRef<Record<string, { angle: number; timer: number; isMoving: boolean }>>({});

  // Detection range based on zombie type
  const getDetectionRange = (type: ZombieType): number => {
    switch (type) {
      case 'TANK':
        return 24; // Tanks sense players from 24m
      case 'RUNNER':
        return 20; // Runners hear and smell from 20m
      default:
        return 16; // Standard Walkers detect at 16m
    }
  };

  // Continuous Open-World Zombie Population (Constant 25 zombies roaming around)
  useEffect(() => {
    if (!isHost) return;

    if (zombiesRef.current.length === 0) {
      const initialCount = 35;
      const initialZombies: ZombieNetState[] = [];

      for (let i = 0; i < initialCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 25 + Math.random() * 95;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        let type: ZombieType = 'WALKER';
        let health = 60;
        let speed = 2.4;

        const rand = Math.random();
        if (rand > 0.72) {
          type = 'RUNNER';
          health = 40;
          speed = 4.4;
        } else if (rand < 0.15) {
          type = 'TANK';
          health = 220;
          speed = 1.6;
        }

        initialZombies.push({
          id: `zombie_${i}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          type,
          position: [x, 0, z],
          rotation: Math.random() * Math.PI * 2,
          health,
          maxHealth: health,
          speed,
          state: 'IDLE',
        });
      }

      zombiesRef.current = initialZombies;
      setZombies(initialZombies);
    }
  }, [isHost, zombiesRef, setZombies]);

  // Host Authoritative AI Update Loop
  useFrame((_, delta) => {
    if (!isHost) return;
    const currentZombies = zombiesRef.current;
    if (!currentZombies || currentZombies.length === 0) return;

    const allSurvivors: Array<{ id: string; pos: [number, number, number]; health: number }> = [];
    if (localPlayerHealth > 0) {
      allSurvivors.push({ id: localPlayerId, pos: localPlayerPosRef.current, health: localPlayerHealth });
    }
    Object.values(remotePlayers).forEach((p) => {
      if (p.health > 0) {
        allSurvivors.push({ id: p.id, pos: p.transform.position, health: p.health });
      }
    });

    if (allSurvivors.length === 0) return; // All survivors dead

    const now = Date.now();

    // Random zombie atmospheric moan
    if (now - lastMoanTime.current > 7000 && Math.random() < 0.04) {
      lastMoanTime.current = now;
      sounds.playZombieMoan();
    }

    const nextZombies: ZombieNetState[] = [];

    for (const zombie of currentZombies) {
      if (zombie.health <= 0) continue; // Instantly discard dead zombies

      const detectionRange = getDetectionRange(zombie.type);
      const isDamaged = zombie.health < zombie.maxHealth;

      // Find closest survivor
      let closestDist = Infinity;
      let targetPos: [number, number, number] = localPlayerPosRef.current;
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

      // Check whether zombie should chase:
      // 1. Player is within detection range (16m - 24m)
      // 2. OR zombie was damaged (shot by a player)
      // 3. OR zombie is actively in 'CHASING' or 'ATTACKING' and player hasn't escaped far away yet (<= detectionRange + 4)
      const isWithinAggro = closestDist <= detectionRange;
      const isAlreadyChasing = (zombie.state === 'CHASING' || zombie.state === 'ATTACKING') && closestDist <= (detectionRange + 4);
      const shouldChase = isDamaged || isWithinAggro || isAlreadyChasing;

      if (shouldChase) {
        // Direction to survivor
        const dirX = targetPos[0] - zombie.position[0];
        const dirZ = targetPos[2] - zombie.position[2];
        const angle = Math.atan2(dirX, dirZ);

        // Check if blocked by an active IceWall
        const iceWalls = iceWallsRef?.current || [];
        let isBlockedByIceWall = false;
        for (const wall of iceWalls) {
          if (wall.health <= 0) continue;
          const distToWall = Math.hypot(wall.position[0] - zombie.position[0], wall.position[2] - zombie.position[2]);
          if (distToWall < 2.4) {
            isBlockedByIceWall = true;
            // Zombie attacks the IceWall to break through
            const lastAtk = lastAttackTime.current[zombie.id] || 0;
            if (now - lastAtk > 1300) {
              lastAttackTime.current[zombie.id] = now;
              const wallDmg = zombie.type === 'TANK' ? 45 : 20;
              onDamageIceWall?.(wall.id, wallDmg);
            }
            break;
          }
        }

        // Attack survivor if close enough (< 1.6 units) and not blocked by wall
        if (closestDist < 1.6 && !isBlockedByIceWall) {
          const lastAtk = lastAttackTime.current[zombie.id] || 0;
          if (now - lastAtk > 1200) {
            lastAttackTime.current[zombie.id] = now;
            const damage = zombie.type === 'TANK' ? 30 : 15;
            if (targetId === localPlayerId) {
              const curPos = localPlayerPosRef.current;
              const realDist = Math.hypot(curPos[0] - zombie.position[0], curPos[2] - zombie.position[2]);
              if (realDist <= 1.8) {
                onDamagePlayer(damage);
                sounds.playPlayerHurt();
              }
            } else {
              realtimeManager?.sendPlayerDamaged(targetId, damage);
            }
          }
          nextZombies.push({
            ...zombie,
            rotation: angle,
            state: 'ATTACKING' as const,
            targetPlayerId: targetId,
          });
          continue;
        }

        // If blocked by IceWall, stop and attack wall
        if (isBlockedByIceWall) {
          nextZombies.push({
            ...zombie,
            rotation: angle,
            state: 'ATTACKING' as const,
          });
          continue;
        }

        // Sprint towards survivor at full speed
        const step = zombie.speed * delta;
        const newX = zombie.position[0] + Math.sin(angle) * step;
        const newZ = zombie.position[2] + Math.cos(angle) * step;

        nextZombies.push({
          ...zombie,
          position: [newX, 0, newZ] as [number, number, number],
          rotation: angle,
          state: 'CHASING' as const,
          targetPlayerId: targetId,
        });
      } else {
        // Player is OUTSIDE range: Idle standing or slow wandering
        if (!wanderData.current[zombie.id]) {
          wanderData.current[zombie.id] = {
            angle: zombie.rotation || Math.random() * Math.PI * 2,
            timer: 2 + Math.random() * 4,
            isMoving: Math.random() > 0.45,
          };
        }

        const wd = wanderData.current[zombie.id];
        wd.timer -= delta;
        if (wd.timer <= 0) {
          wd.angle += (Math.random() - 0.5) * 1.8;
          wd.timer = 3 + Math.random() * 5;
          wd.isMoving = Math.random() > 0.4;
        }

        if (wd.isMoving) {
          const wanderSpeed = 0.65;
          const step = wanderSpeed * delta;
          const newX = Math.max(-138, Math.min(138, zombie.position[0] + Math.sin(wd.angle) * step));
          const newZ = Math.max(-138, Math.min(138, zombie.position[2] + Math.cos(wd.angle) * step));

          nextZombies.push({
            ...zombie,
            position: [newX, 0, newZ] as [number, number, number],
            rotation: wd.angle,
            state: 'WANDERING' as const,
            targetPlayerId: undefined,
          });
        } else {
          nextZombies.push({
            ...zombie,
            state: 'IDLE' as const,
            targetPlayerId: undefined,
          });
        }
      }
    }

    zombiesRef.current = nextZombies;

    // Synchronize to React state at ~25 FPS or on count changes
    if (now - lastStateSync.current > 40 || nextZombies.length !== zombies.length) {
      lastStateSync.current = now;
      setZombies([...nextZombies]);
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

        const isChasingOrAttacking = zombie.state === 'CHASING' || zombie.state === 'ATTACKING';
        const armPitch = isChasingOrAttacking ? Math.PI / 2.2 : Math.PI / 5.5;

        return (
          <group
            key={zombie.id}
            position={[zombie.position[0], 0, zombie.position[2]]}
            rotation={[0, zombie.rotation, 0]}
            scale={[scale, scale, scale]}
          >
            {/* Health Bar above zombie (visible when damaged or in aggro) */}
            <Html position={[0, 2.2, 0]} center distanceFactor={16}>
              <div className="w-12 h-1 bg-black/80 rounded border border-zinc-800 overflow-hidden pointer-events-none">
                <div
                  className={`h-full ${
                    isTank ? 'bg-purple-500' : isRunner ? 'bg-amber-500' : 'bg-red-600'
                  } transition-all`}
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
              <meshBasicMaterial color={isChasingOrAttacking ? '#ff0000' : '#882222'} />
            </mesh>
            <mesh position={[-0.08, 1.85, 0.2]}>
              <sphereGeometry args={[0.03, 8, 8]} />
              <meshBasicMaterial color={isChasingOrAttacking ? '#ff0000' : '#882222'} />
            </mesh>

            {/* Torso with blood stains */}
            <mesh position={[0, 1.2, 0]} castShadow>
              <boxGeometry args={[0.55, 0.75, 0.3]} />
              <meshStandardMaterial color="#1a201c" roughness={0.8} />
            </mesh>

            {/* Arms - Reach forward only when chasing/attacking, otherwise hang low */}
            <mesh position={[0.25, 1.35, isChasingOrAttacking ? 0.35 : 0.1]} rotation={[armPitch, 0, -0.2]}>
              <cylinderGeometry args={[0.08, 0.08, 0.65, 8]} />
              <meshStandardMaterial color={skinColor} roughness={0.9} />
            </mesh>
            <mesh position={[-0.25, 1.35, isChasingOrAttacking ? 0.35 : 0.1]} rotation={[armPitch, 0, 0.2]}>
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
