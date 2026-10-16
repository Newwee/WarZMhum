'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './Scene';
import { FirstPersonPlayer } from './FirstPersonPlayer';
import { RemotePlayers } from './RemotePlayers';
import { Zombies } from './Zombies';
import { GameHUD } from './GameHUD';
import { GameOverModal } from './GameOverModal';
import { ImpactEffects, BloodPool, BulletTracer } from './ImpactEffects';
import { RealtimeManager } from '@/lib/network/realtime-manager';
import { PlayerNetState, ZombieNetState, ShootEvent, WaveState, MatchSummary, ZombieType } from '@/types/game';
import { sounds } from '@/lib/audio/sound-effects';

interface GameCanvasProps {
  roomCode: string;
  localPlayerId: string;
  localPlayerName: string;
  isHost: boolean;
  realtimeManager: RealtimeManager | null;
  onExitGame: () => void;
}

export function GameCanvas({
  roomCode,
  localPlayerId,
  localPlayerName,
  isHost,
  realtimeManager,
  onExitGame,
}: GameCanvasProps) {
  // Player vitals & weapon state
  const [health, setHealth] = useState(100);
  const [stamina, setStamina] = useState(100);
  const [currentWeapon, setCurrentWeapon] = useState<'RIFLE' | 'PISTOL'>('RIFLE');
  const [ammo, setAmmo] = useState(30);
  const [maxAmmo, setMaxAmmo] = useState(30);
  const [isReloading, setIsReloading] = useState(false);
  const [score, setScore] = useState(0);
  const [kills, setKills] = useState(0);

  // View & Control state
  const [perspective, setPerspective] = useState<'FPS' | 'TPS'>('FPS');
  const [isADS, setIsADS] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [damageVignette, setDamageVignette] = useState(false);
  const [hitMarker, setHitMarker] = useState<'body' | 'head' | null>(null);

  // FX: Blood Pools & Bullet Tracers
  const [bloodPools, setBloodPools] = useState<BloodPool[]>([]);
  const [tracers, setTracers] = useState<BulletTracer[]>([]);

  // Multiplayer & Zombies
  const [remotePlayers, setRemotePlayers] = useState<Record<string, PlayerNetState>>({});
  const [zombies, setZombies] = useState<ZombieNetState[]>([]);
  const zombiesRef = useRef<ZombieNetState[]>([]);

  // Waves & Match summary
  const [currentWave, setCurrentWave] = useState(1);
  const [waveState, setWaveState] = useState<WaveState>({
    wave: 1,
    zombiesRemaining: 6,
    totalZombiesInWave: 6,
    isWaveActive: true,
  });

  const [gameOver, setGameOver] = useState(false);
  const [matchSummary, setMatchSummary] = useState<MatchSummary | null>(null);
  const gameStartTime = useRef(Date.now());

  // Switch weapon logic
  const handleWeaponChange = (newWeapon: 'RIFLE' | 'PISTOL') => {
    setCurrentWeapon(newWeapon);
    if (newWeapon === 'PISTOL') {
      setMaxAmmo(6);
      setAmmo(6);
    } else {
      setMaxAmmo(30);
      setAmmo(30);
    }
  };

  // Add bullet tracer with auto-cleanup
  const handleSpawnTracer = useCallback((newTracer: BulletTracer) => {
    setTracers((prev) => [...prev.slice(-10), newTracer]);
    setTimeout(() => {
      setTracers((prev) => prev.filter((t) => t.id !== newTracer.id));
    }, 120);
  }, []);

  // Add blood pool decal with cap
  const handleSpawnBloodPool = useCallback((newPool: BloodPool) => {
    setBloodPools((prev) => [...prev.slice(-25), newPool]);
  }, []);

  // Damage Player handler
  const handleDamagePlayer = useCallback((damage: number) => {
    setHealth((prev) => {
      const nextHp = Math.max(0, prev - damage);
      setDamageVignette(true);
      setTimeout(() => setDamageVignette(false), 300);

      if (nextHp <= 0 && prev > 0) {
        sounds.playPlayerHurt();
      }
      return nextHp;
    });
  }, []);

  // Hit Marker trigger
  const handleHitMarker = useCallback((isHeadshot: boolean) => {
    setHitMarker(isHeadshot ? 'head' : 'body');
    setTimeout(() => setHitMarker(null), 140);
  }, []);

  // Kill zombie handler
  const handleKillZombie = useCallback(
    (zombieId: string, zombieType: ZombieType) => {
      const pts = zombieType === 'TANK' ? 350 : zombieType === 'RUNNER' ? 180 : 100;
      setScore((s) => s + pts);
      setKills((k) => k + 1);

      setZombies((prev) => {
        const filtered = prev.filter((z) => z.id !== zombieId);
        setWaveState((w) => {
          const remaining = filtered.length;
          if (remaining === 0 && isHost) {
            setTimeout(() => {
              setCurrentWave((cw) => cw + 1);
              setWaveState({
                wave: currentWave + 1,
                zombiesRemaining: 6 + (currentWave + 1) * 4,
                totalZombiesInWave: 6 + (currentWave + 1) * 4,
                isWaveActive: true,
              });
            }, 3500);
          }
          return { ...w, zombiesRemaining: remaining };
        });
        return filtered;
      });
    },
    [currentWave, isHost]
  );

  // Apply zombie damage immediately on local client
  const handleDamageZombieLocally = useCallback(
    (zombieId: string, damage: number, isHeadshot: boolean) => {
      setZombies((prev) =>
        prev.map((z) => {
          if (z.id === zombieId) {
            const newHp = Math.max(0, z.health - damage);
            if (newHp <= 0 && z.health > 0) {
              handleKillZombie(z.id, z.type);
            }
            return { ...z, health: newHp, state: 'CHASING' as const };
          }
          return z;
        })
      );
    },
    [handleKillZombie]
  );

  // Incoming network sync
  useEffect(() => {
    if (!realtimeManager) return;

    (realtimeManager as any).callbacks.onRemotePlayerUpdate = (player: PlayerNetState) => {
      setRemotePlayers((prev) => ({ ...prev, [player.id]: player }));
    };

    (realtimeManager as any).callbacks.onZombieSync = (syncedZombies: ZombieNetState[]) => {
      if (!isHost) {
        setZombies(syncedZombies);
        zombiesRef.current = syncedZombies;
        setWaveState((prev) => ({
          ...prev,
          zombiesRemaining: syncedZombies.filter((z) => z.health > 0).length,
        }));
      }
    };

    (realtimeManager as any).callbacks.onZombieDamaged = ({ zombieId, damage, attackerId }: any) => {
      setZombies((prev) =>
        prev.map((z) => {
          if (z.id === zombieId) {
            const newHp = Math.max(0, z.health - damage);
            if (newHp <= 0 && z.health > 0 && attackerId === localPlayerId) {
              handleKillZombie(z.id, z.type);
            }
            return { ...z, health: newHp };
          }
          return z;
        })
      );
    };

    (realtimeManager as any).callbacks.onPlayerDamaged = ({ playerId, damage }: any) => {
      if (playerId === localPlayerId) {
        handleDamagePlayer(damage);
      } else {
        setRemotePlayers((prev) => {
          const target = prev[playerId];
          if (!target) return prev;
          return {
            ...prev,
            [playerId]: { ...target, health: Math.max(0, target.health - damage) },
          };
        });
      }
    };

    (realtimeManager as any).callbacks.onGameOver = (summary: MatchSummary) => {
      setGameOver(true);
      setMatchSummary(summary);
      if (document.exitPointerLock) document.exitPointerLock();
    };
  }, [realtimeManager, isHost, localPlayerId, handleDamagePlayer, handleKillZombie]);

  // Game over check
  useEffect(() => {
    if (gameOver) return;

    const isLocalDead = health <= 0;
    const areAllRemoteDead = Object.values(remotePlayers).every((p) => p.health <= 0);

    if (isLocalDead && areAllRemoteDead) {
      const survivalTime = Math.floor((Date.now() - gameStartTime.current) / 1000);
      const summary: MatchSummary = {
        finalWave: currentWave,
        totalZombiesKilled: kills,
        survivalSeconds: survivalTime,
        completed: false,
        players: [
          {
            id: localPlayerId,
            name: localPlayerName,
            kills,
            score,
            shotsFired: 0,
            shotsHit: 0,
            damageDealt: 0,
            survivalSeconds: survivalTime,
          },
          ...Object.values(remotePlayers).map((p) => ({
            id: p.id,
            name: p.name,
            kills: p.kills,
            score: p.score,
            shotsFired: 0,
            shotsHit: 0,
            damageDealt: 0,
            survivalSeconds: survivalTime,
          })),
        ],
      };

      setGameOver(true);
      setMatchSummary(summary);
      realtimeManager?.sendGameOver(summary);
      if (document.exitPointerLock) document.exitPointerLock();
    }
  }, [health, remotePlayers, gameOver, currentWave, kills, score, localPlayerId, localPlayerName, realtimeManager]);

  const handleRestart = () => {
    setHealth(100);
    setStamina(100);
    setAmmo(maxAmmo);
    setScore(0);
    setKills(0);
    setCurrentWave(1);
    setZombies([]);
    setBloodPools([]);
    setTracers([]);
    setGameOver(false);
    setMatchSummary(null);
    gameStartTime.current = Date.now();
    realtimeManager?.sendStartGame();
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
      {/* 3D WebGL Canvas */}
      <Canvas
        shadows
        camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 1.7, 5] }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <Scene />

        {/* Local Player Controller */}
        <FirstPersonPlayer
          playerId={localPlayerId}
          playerName={localPlayerName}
          health={health}
          stamina={stamina}
          ammo={ammo}
          maxAmmo={maxAmmo}
          isReloading={isReloading}
          currentWeapon={currentWeapon}
          perspective={perspective}
          onHealthChange={setHealth}
          onStaminaChange={setStamina}
          onAmmoChange={setAmmo}
          onReloadStart={() => setIsReloading(true)}
          onReloadEnd={() => setIsReloading(false)}
          onShoot={() => {}}
          onHitMarker={handleHitMarker}
          onHitZombie={handleDamageZombieLocally}
          onWeaponChange={handleWeaponChange}
          onPerspectiveChange={setPerspective}
          onSpawnTracer={handleSpawnTracer}
          onSpawnBloodPool={handleSpawnBloodPool}
          realtimeManager={realtimeManager}
          zombiesRef={zombiesRef}
          isLocked={isLocked}
          setIsLocked={setIsLocked}
          isADS={isADS}
          setIsADS={setIsADS}
        />

        {/* Remote Teammate Avatars */}
        <RemotePlayers players={remotePlayers} currentUserId={localPlayerId} />

        {/* Synchronized Zombies */}
        <Zombies
          zombies={zombies}
          setZombies={setZombies}
          zombiesRef={zombiesRef}
          isHost={isHost}
          localPlayerId={localPlayerId}
          localPlayerPos={[0, 1.7, 5]}
          localPlayerHealth={health}
          onDamagePlayer={handleDamagePlayer}
          onKillZombie={handleKillZombie}
          remotePlayers={remotePlayers}
          realtimeManager={realtimeManager}
          currentWave={currentWave}
          waveState={waveState}
          setWaveState={setWaveState}
        />

        {/* Bullet Tracers and Blood Pools */}
        <ImpactEffects bloodPools={bloodPools} tracers={tracers} />
      </Canvas>

      {/* WarZ Tactical HUD */}
      {!gameOver && (
        <GameHUD
          health={health}
          maxHealth={100}
          stamina={stamina}
          ammo={ammo}
          maxAmmo={maxAmmo}
          isReloading={isReloading}
          score={score}
          kills={kills}
          waveState={waveState}
          remotePlayers={remotePlayers}
          hitMarker={hitMarker}
          isLocked={isLocked}
          onRequestLock={() => {
            const canvas = document.querySelector('canvas');
            canvas?.requestPointerLock();
          }}
          damageVignette={damageVignette}
          currentWeapon={currentWeapon}
          isADS={isADS}
          perspective={perspective}
        />
      )}

      {/* Game Over Modal */}
      {gameOver && matchSummary && (
        <GameOverModal
          summary={matchSummary}
          isHost={isHost}
          onRestart={handleRestart}
          onLeave={onExitGame}
        />
      )}
    </div>
  );
}
