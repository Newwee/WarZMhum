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
import { IceWallManager } from './IceWall';
import { ShopModal } from './ShopModal';
import { RealtimeManager } from '@/lib/network/realtime-manager';
import { PlayerNetState, ZombieNetState, ShootEvent, MatchSummary, ZombieType, PlayerInventory, WeaponType, IceWallObject, KillFeedItem } from '@/types/game';
import { sounds } from '@/lib/audio/sound-effects';

interface GameCanvasProps {
  roomCode: string;
  localPlayerId: string;
  localPlayerName: string;
  isHost: boolean;
  realtimeManager: RealtimeManager | null;
  onExitGame: () => void;
  initialInventory: PlayerInventory;
  onInventoryChange?: (inv: PlayerInventory) => void;
}

export function GameCanvas({
  roomCode,
  localPlayerId,
  localPlayerName,
  isHost,
  realtimeManager,
  onExitGame,
  initialInventory,
  onInventoryChange,
}: GameCanvasProps) {
  // Player vitals & inventory state (Initialized from Lobby loadout)
  const [health, setHealth] = useState(100);
  const [stamina, setStamina] = useState(100);
  const [inventory, setInventory] = useState<PlayerInventory>(initialInventory);
  const [killFeed, setKillFeed] = useState<KillFeedItem[]>([]);

  // Choose starting weapon based on purchased Lobby loadout
  const [currentWeapon, setCurrentWeapon] = useState<WeaponType>(() => {
    if (initialInventory?.hasRifle) return 'RIFLE';
    if (initialInventory?.hasPistol) return 'PISTOL';
    if (initialInventory && initialInventory.iceWalls > 0) return 'ICEWALL';
    if (initialInventory && initialInventory.medkits > 0) return 'MEDKIT';
    return 'UNARMED';
  });
  const [ammo, setAmmo] = useState(() => (initialInventory?.hasRifle ? 30 : initialInventory?.hasPistol ? 6 : 0));
  const [maxAmmo, setMaxAmmo] = useState(() => (initialInventory?.hasRifle ? 30 : initialInventory?.hasPistol ? 6 : 0));
  const [isReloading, setIsReloading] = useState(false);
  const [score, setScore] = useState(0);
  const [kills, setKills] = useState(0);

  // Visual FX
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [damageVignette, setDamageVignette] = useState(false);
  const [healVignette, setHealVignette] = useState(false);
  const [hitMarker, setHitMarker] = useState<'body' | 'head' | null>(null);

  // View & Control state
  const [perspective, setPerspective] = useState<'FPS' | 'TPS'>('FPS');
  const [isADS, setIsADS] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // FX: Blood Pools & Bullet Tracers
  const [bloodPools, setBloodPools] = useState<BloodPool[]>([]);
  const [tracers, setTracers] = useState<BulletTracer[]>([]);

  // IceWalls
  const [iceWalls, setIceWalls] = useState<IceWallObject[]>([]);
  const iceWallsRef = useRef<IceWallObject[]>([]);
  const [previewPos, setPreviewPos] = useState<[number, number, number]>([0, 1.3, 0]);
  const [previewYaw, setPreviewYaw] = useState<number>(0);

  // Multiplayer & Zombies
  const [remotePlayers, setRemotePlayers] = useState<Record<string, PlayerNetState>>({});
  const [zombies, setZombies] = useState<ZombieNetState[]>([]);
  const zombiesRef = useRef<ZombieNetState[]>([]);
  const localPlayerPosRef = useRef<[number, number, number]>([0, 1.7, 5]);

  // Match & game over state
  const [gameOver, setGameOver] = useState(false);
  const [matchSummary, setMatchSummary] = useState<MatchSummary | null>(null);
  const gameStartTime = useRef(Date.now());

  // Switch weapon logic
  const handleWeaponChange = (newWeapon: WeaponType) => {
    setCurrentWeapon(newWeapon);
    if (newWeapon === 'PISTOL') {
      setMaxAmmo(6);
      setAmmo(6);
    } else if (newWeapon === 'RIFLE') {
      setMaxAmmo(30);
      setAmmo(30);
    } else {
      setMaxAmmo(0);
      setAmmo(0);
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
        const deathItem: KillFeedItem = {
          id: `kf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          killerName: 'ZOMBIE',
          victimName: localPlayerName,
          weapon: 'CLAWS',
          isHeadshot: false,
          isPvP: false,
          timestamp: Date.now(),
        };
        setKillFeed((feed) => [...feed.slice(-6), deathItem]);
        realtimeManager?.sendKillFeed(deathItem);
      }
      return nextHp;
    });
  }, [localPlayerName, realtimeManager]);

  // Hit Marker trigger
  const handleHitMarker = useCallback((isHeadshot: boolean) => {
    setHitMarker(isHeadshot ? 'head' : 'body');
    setTimeout(() => setHitMarker(null), 140);
  }, []);

  // Kill zombie handler with Bounty Cash Rewards and KillFeed dispatch
  const handleKillZombie = useCallback(
    (zombieId: string, zombieType: ZombieType, isHeadshot: boolean = false) => {
      const pts = zombieType === 'TANK' ? 350 : zombieType === 'RUNNER' ? 180 : 100;
      const cashReward = zombieType === 'TANK' ? 600 : zombieType === 'RUNNER' ? 250 : 150;
      setScore((s) => s + pts);
      setKills((k) => k + 1);

      // Reward player with Bounty Cash
      setInventory((prev) => {
        const next = {
          ...prev,
          money: prev.money + cashReward,
        };
        onInventoryChange?.(next);
        return next;
      });

      // 1. Permanently prune dead zombie from Authoritative Ref
      zombiesRef.current = zombiesRef.current.filter((z) => z.id !== zombieId);
      setZombies([...zombiesRef.current]);

      // 2. Dispatch KillFeed notification
      const killItem: KillFeedItem = {
        id: `kf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        killerName: localPlayerName,
        victimName: `${zombieType} WALKER`,
        weapon: currentWeapon === 'RIFLE' ? 'M4A1' : currentWeapon === 'PISTOL' ? '.45 PISTOL' : 'FISTS',
        isHeadshot,
        isPvP: false,
        timestamp: Date.now(),
      };
      setKillFeed((feed) => [...feed.slice(-6), killItem]);
      realtimeManager?.sendKillFeed(killItem);
    },
    [localPlayerName, currentWeapon, realtimeManager, onInventoryChange]
  );

  // Apply zombie damage immediately on local client
  const handleDamageZombieLocally = useCallback(
    (zombieId: string, damage: number, isHeadshot: boolean) => {
      const target = zombiesRef.current.find((z) => z.id === zombieId);
      if (target) {
        target.health = Math.max(0, target.health - damage);
        target.state = 'CHASING';
        if (target.health <= 0) {
          handleKillZombie(target.id, target.type, isHeadshot);
          return;
        }
      }
      setZombies([...zombiesRef.current]);
    },
    [handleKillZombie]
  );

  // Buy Item from Shop
  const handleBuyItem = useCallback(
    (itemKey: 'RIFLE' | 'RIFLE_AMMO' | 'PISTOL' | 'PISTOL_AMMO' | 'ICEWALL' | 'MEDKIT', cost: number) => {
      setInventory((prev) => {
        if (prev.money < cost) return prev;
        const next = { ...prev, money: prev.money - cost };

        if (itemKey === 'RIFLE') {
          next.hasRifle = true;
          next.rifleAmmo = prev.rifleAmmo + 60;
          setCurrentWeapon('RIFLE');
          setMaxAmmo(30);
          setAmmo(30);
        } else if (itemKey === 'RIFLE_AMMO') {
          next.rifleAmmo = prev.rifleAmmo + 30;
        } else if (itemKey === 'PISTOL') {
          next.hasPistol = true;
          next.pistolAmmo = prev.pistolAmmo + 18;
          setCurrentWeapon('PISTOL');
          setMaxAmmo(6);
          setAmmo(6);
        } else if (itemKey === 'PISTOL_AMMO') {
          next.pistolAmmo = prev.pistolAmmo + 12;
        } else if (itemKey === 'ICEWALL') {
          next.iceWalls = prev.iceWalls + 1;
          if (currentWeapon === 'UNARMED') {
            setCurrentWeapon('ICEWALL');
          }
        } else if (itemKey === 'MEDKIT') {
          next.medkits = prev.medkits + 1;
        }
        return next;
      });
    },
    [currentWeapon]
  );

  // Place IceWall into 3D world
  const handlePlaceIceWall = useCallback(
    (pos: [number, number, number], yaw: number) => {
      if (inventory.iceWalls <= 0) return;

      setInventory((prev) => {
        const remaining = Math.max(0, prev.iceWalls - 1);
        if (remaining <= 0) {
          if (prev.hasRifle) setCurrentWeapon('RIFLE');
          else if (prev.hasPistol) setCurrentWeapon('PISTOL');
          else setCurrentWeapon('UNARMED');
        }
        return { ...prev, iceWalls: remaining };
      });

      const newWall: IceWallObject = {
        id: `wall_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        ownerId: localPlayerId,
        position: pos,
        rotation: yaw,
        health: 400,
        maxHealth: 400,
        createdAt: Date.now(),
        expiresAt: Date.now() + 25000,
      };

      iceWallsRef.current = [...iceWallsRef.current, newWall];
      setIceWalls([...iceWallsRef.current]);
      realtimeManager?.sendIceWallSpawn(newWall);
      sounds.playIceWallPlace();
    },
    [inventory.iceWalls, localPlayerId, realtimeManager]
  );

  // Damage or shatter IceWall
  const handleDamageIceWall = useCallback(
    (id: string, damage: number) => {
      const wall = iceWallsRef.current.find((w) => w.id === id);
      if (wall) {
        wall.health = Math.max(0, wall.health - damage);
        if (wall.health <= 0) {
          iceWallsRef.current = iceWallsRef.current.filter((w) => w.id !== id);
        }
        setIceWalls([...iceWallsRef.current]);
        realtimeManager?.sendIceWallDamage(id, damage);
      }
    },
    [realtimeManager]
  );

  // Use Medkit to recover health (War Z rapid +60 HP burst)
  const handleUseMedkit = useCallback(() => {
    if (inventory.medkits <= 0) return;
    if (health >= 100) return;

    setInventory((prev) => {
      const next = { ...prev, medkits: Math.max(0, prev.medkits - 1) };
      onInventoryChange?.(next);
      return next;
    });

    setHealth((prev) => Math.min(100, prev + 60));
    setHealVignette(true);
    setTimeout(() => setHealVignette(false), 300);
    sounds.playMedkitHeal();

    if (currentWeapon === 'MEDKIT' && inventory.medkits <= 1) {
      if (inventory.hasRifle) setCurrentWeapon('RIFLE');
      else if (inventory.hasPistol) setCurrentWeapon('PISTOL');
      else setCurrentWeapon('UNARMED');
    }
  }, [inventory.medkits, inventory.hasRifle, inventory.hasPistol, health, currentWeapon, onInventoryChange]);

  // Open / Close Shop
  const handleToggleShop = useCallback(() => {
    setIsShopOpen((prev) => {
      const next = !prev;
      if (next && document.exitPointerLock) {
        document.exitPointerLock();
      }
      return next;
    });
  }, []);

  // Quick Slot Select
  const handleSelectSlot = useCallback(
    (weapon: WeaponType) => {
      handleWeaponChange(weapon);
      sounds.playSwitchWeapon();
    },
    []
  );

  // IceWall Auto-Lifespan expiration cleanup
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const unexpired = iceWallsRef.current.filter((w) => w.expiresAt > now && w.health > 0);
      if (unexpired.length !== iceWallsRef.current.length) {
        iceWallsRef.current = unexpired;
        setIceWalls([...unexpired]);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
      }
    };

    (realtimeManager as any).callbacks.onKillFeed = (item: KillFeedItem) => {
      setKillFeed((prev) => [...prev.slice(-6), item]);
    };

    (realtimeManager as any).callbacks.onZombieDamaged = ({ zombieId, damage, attackerId }: any) => {
      const target = zombiesRef.current.find((z) => z.id === zombieId);
      if (target) {
        target.health = Math.max(0, target.health - damage);
        target.state = 'CHASING';
        if (target.health <= 0 && attackerId === localPlayerId) {
          handleKillZombie(target.id, target.type);
          return;
        }
      }
      setZombies([...zombiesRef.current]);
    };

    (realtimeManager as any).callbacks.onIceWallSpawn = (wall: IceWallObject) => {
      iceWallsRef.current = [...iceWallsRef.current, wall];
      setIceWalls([...iceWallsRef.current]);
    };

    (realtimeManager as any).callbacks.onIceWallDamage = ({ id, damage }: any) => {
      const wall = iceWallsRef.current.find((w) => w.id === id);
      if (wall) {
        wall.health = Math.max(0, wall.health - damage);
        if (wall.health <= 0) {
          iceWallsRef.current = iceWallsRef.current.filter((w) => w.id !== id);
        }
        setIceWalls([...iceWallsRef.current]);
      }
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
        finalWave: 1,
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
  }, [health, remotePlayers, gameOver, kills, score, localPlayerId, localPlayerName, realtimeManager]);

  const handleRestart = () => {
    setHealth(100);
    setStamina(100);
    setAmmo(maxAmmo);
    setScore(0);
    setKills(0);
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
          inventory={inventory}
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
          remotePlayers={remotePlayers}
          zombiesRef={zombiesRef}
          iceWallsRef={iceWallsRef}
          onPlaceIceWall={handlePlaceIceWall}
          onDamageIceWall={handleDamageIceWall}
          onUseMedkit={handleUseMedkit}
          onToggleShop={handleToggleShop}
          isLocked={isLocked}
          setIsLocked={setIsLocked}
          isADS={isADS}
          setIsADS={setIsADS}
          playerPosRef={localPlayerPosRef}
          setPreviewPos={setPreviewPos}
          setPreviewYaw={setPreviewYaw}
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
          localPlayerPosRef={localPlayerPosRef}
          localPlayerHealth={health}
          onDamagePlayer={handleDamagePlayer}
          onKillZombie={handleKillZombie}
          remotePlayers={remotePlayers}
          realtimeManager={realtimeManager}
          iceWallsRef={iceWallsRef}
          onDamageIceWall={handleDamageIceWall}
        />

        {/* 3D Bulletproof IceWalls & Hologram Placement Preview */}
        <IceWallManager
          iceWalls={iceWalls}
          previewActive={currentWeapon === 'ICEWALL'}
          previewPos={previewPos}
          previewYaw={previewYaw}
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
          killFeed={killFeed}
          remotePlayers={remotePlayers}
          hitMarker={hitMarker}
          isLocked={isLocked}
          onRequestLock={() => {
            const canvas = document.querySelector('canvas');
            canvas?.requestPointerLock();
          }}
          damageVignette={damageVignette}
          healVignette={healVignette}
          currentWeapon={currentWeapon}
          inventory={inventory}
          isADS={isADS}
          perspective={perspective}
          onSelectSlot={handleSelectSlot}
          onOpenShop={handleToggleShop}
          isShopOpen={isShopOpen}
        />
      )}

      {/* Armory & Supply Depot Shop Modal */}
      <ShopModal
        isOpen={isShopOpen}
        onClose={() => setIsShopOpen(false)}
        inventory={inventory}
        onBuyItem={handleBuyItem}
      />

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
