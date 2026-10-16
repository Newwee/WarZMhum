'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RealtimeManager } from '@/lib/network/realtime-manager';
import { sounds } from '@/lib/audio/sound-effects';
import { ShootEvent, WeaponType, PlayerInventory, IceWallObject, PlayerNetState, KillFeedItem } from '@/types/game';
import { WeaponModel } from './WeaponModel';
import { SurvivorAvatar } from './SurvivorAvatar';
import { BulletTracer, BloodPool } from './ImpactEffects';

interface FirstPersonPlayerProps {
  playerId: string;
  playerName: string;
  health: number;
  stamina: number;
  ammo: number;
  maxAmmo: number;
  isReloading: boolean;
  currentWeapon: WeaponType;
  perspective: 'FPS' | 'TPS';
  inventory: PlayerInventory;
  onHealthChange: (hp: number) => void;
  onStaminaChange: (stamina: number) => void;
  onAmmoChange: (ammo: number) => void;
  onReloadStart: () => void;
  onReloadEnd: () => void;
  onShoot: (event: ShootEvent) => void;
  onHitMarker: (isHeadshot: boolean) => void;
  onHitZombie: (zombieId: string, damage: number, isHeadshot: boolean) => void;
  onWeaponChange: (weapon: WeaponType) => void;
  onPerspectiveChange: (p: 'FPS' | 'TPS') => void;
  onSpawnTracer: (tracer: BulletTracer) => void;
  onSpawnBloodPool: (pool: BloodPool) => void;
  realtimeManager: RealtimeManager | null;
  remotePlayers: Record<string, PlayerNetState>;
  zombiesRef: React.MutableRefObject<any[]>;
  iceWallsRef: React.MutableRefObject<IceWallObject[]>;
  onPlaceIceWall: (pos: [number, number, number], yaw: number) => void;
  onDamageIceWall: (id: string, damage: number) => void;
  onUseMedkit: () => void;
  onToggleInventory?: () => void;
  onConsumeReserveAmmo?: (weapon: 'RIFLE' | 'PISTOL' | 'SNIPER' | 'SHOTGUN', amount: number) => void;
  onHoldEChange?: (isHolding: boolean) => void;
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
  isADS: boolean;
  setIsADS: (ads: boolean) => void;
  playerPosRef: React.MutableRefObject<[number, number, number]>;
  setPreviewPos: (pos: [number, number, number]) => void;
  setPreviewYaw: (yaw: number) => void;
}

export function FirstPersonPlayer({
  playerId,
  playerName,
  health,
  stamina,
  ammo,
  maxAmmo,
  isReloading,
  currentWeapon,
  perspective,
  inventory,
  onHealthChange,
  onStaminaChange,
  onAmmoChange,
  onReloadStart,
  onReloadEnd,
  onShoot,
  onHitMarker,
  onHitZombie,
  onWeaponChange,
  onPerspectiveChange,
  onSpawnTracer,
  onSpawnBloodPool,
  realtimeManager,
  remotePlayers,
  zombiesRef,
  iceWallsRef,
  onPlaceIceWall,
  onDamageIceWall,
  onUseMedkit,
  onToggleInventory,
  onConsumeReserveAmmo,
  onHoldEChange,
  isLocked,
  setIsLocked,
  isADS,
  setIsADS,
  playerPosRef,
  setPreviewPos,
  setPreviewYaw,
}: FirstPersonPlayerProps) {
  const { camera, gl } = useThree();

  // Live remote players ref
  const remotePlayersRef = useRef(remotePlayers);
  remotePlayersRef.current = remotePlayers;

  // Position and physics
  const pos = useRef(new THREE.Vector3(0, 1.7, 5));
  const velocity = useRef(new THREE.Vector3());
  const moveKeys = useRef({ forward: false, backward: false, left: false, right: false, sprint: false });
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const yaw = useRef(0);
  const pitch = useRef(0);
  const killedRemoteIds = useRef<Set<string>>(new Set());
  const isGrounded = useRef(true);

  // Recoil, camera kick, and fire loops
  const recoilVal = useRef(0);
  const cameraKick = useRef(0);
  const isShootingRef = useRef(false);
  const bobbingTimer = useRef(0);
  const isMouseDownRef = useRef(false);
  const lastShotTimeRef = useRef(0);

  // Action Animations: Punch combo & Knife slash progress
  const [attackProgress, setAttackProgress] = useState(0);
  const [punchSide, setPunchSide] = useState<'LEFT' | 'RIGHT'>('RIGHT');
  const [isSprintingState, setIsSprintingState] = useState(false);
  const deathSoundPlayed = useRef(false);
  const prevHealthRef = useRef(health);

  // Reset player transform & physics when respawning from death
  useEffect(() => {
    if (prevHealthRef.current <= 0 && health > 0) {
      pos.current.set(0, 1.7, 5);
      velocity.current.set(0, 0, 0);
      euler.current.set(0, 0, 0, 'YXZ');
      yaw.current = 0;
      pitch.current = 0;
      deathSoundPlayed.current = false;
    }
    prevHealthRef.current = health;
  }, [health]);

  // Reload Logic for all gun types
  const handleReload = useCallback(() => {
    if (isReloading) return;
    const isRifle = currentWeapon === 'RIFLE';
    const isPistol = currentWeapon === 'PISTOL';
    const isSniper = currentWeapon === 'SNIPER';
    const isShotgun = currentWeapon === 'SHOTGUN';
    if (!isRifle && !isPistol && !isSniper && !isShotgun) return;

    const needed = maxAmmo - ammo;
    if (needed <= 0) return;

    let reserve = 0;
    if (isRifle) reserve = inventory.rifleAmmoReserve || 0;
    else if (isPistol) reserve = inventory.pistolAmmoReserve || 0;
    else if (isSniper) reserve = inventory.sniperAmmoReserve || 0;
    else if (isShotgun) reserve = inventory.shotgunAmmoReserve || 0;

    if (reserve <= 0) {
      sounds.playEmptyClick();
      return;
    }

    const toLoad = Math.min(needed, reserve);

    onReloadStart();
    sounds.playReload();
    const duration = isSniper ? 2000 : isShotgun ? 1800 : isRifle ? 1500 : 1300;
    setTimeout(() => {
      onConsumeReserveAmmo?.(currentWeapon as any, toLoad);
      onAmmoChange(ammo + toLoad);
      onReloadEnd();
    }, duration);
  }, [
    isReloading,
    currentWeapon,
    maxAmmo,
    ammo,
    inventory.rifleAmmoReserve,
    inventory.pistolAmmoReserve,
    inventory.sniperAmmoReserve,
    inventory.shotgunAmmoReserve,
    onReloadStart,
    onReloadEnd,
    onConsumeReserveAmmo,
    onAmmoChange,
  ]);

  // Raycast bullet execution helper for all firearms
  const executeBulletRaycast = useCallback(
    (spread: number, baseDamage: number, headMultiplier: number, weaponName: string) => {
      const rayOrigin = camera.position.clone();
      const forwardDir = new THREE.Vector3();
      camera.getWorldDirection(forwardDir);

      forwardDir.x += (Math.random() - 0.5) * spread;
      forwardDir.y += (Math.random() - 0.5) * spread;
      forwardDir.normalize();

      let hitZombieId: string | undefined;
      let hitIceWallId: string | undefined;
      let hitRemotePlayerId: string | undefined;
      let hitRemotePlayerName: string | undefined;
      let hitRemotePlayerHp = 0;
      let isHeadshot = false;
      let hitDamage = baseDamage;
      let hitPos = rayOrigin.clone().add(forwardDir.clone().multiplyScalar(80));
      let closestDist = 80;

      // 1. Check IceWall absorption
      const iceWalls = iceWallsRef?.current || [];
      for (const wall of iceWalls) {
        if (wall.health <= 0) continue;
        const [wX, wY, wZ] = wall.position;
        const toWall = new THREE.Vector3(wX - rayOrigin.x, wY - rayOrigin.y, wZ - rayOrigin.z);
        const proj = toWall.dot(forwardDir);

        if (proj > 0.4 && proj < closestDist) {
          const rayPoint = rayOrigin.clone().add(forwardDir.clone().multiplyScalar(proj));
          const localX = (rayPoint.x - wX) * Math.cos(-wall.rotation) - (rayPoint.z - wZ) * Math.sin(-wall.rotation);
          const localZ = (rayPoint.x - wX) * Math.sin(-wall.rotation) + (rayPoint.z - wZ) * Math.cos(-wall.rotation);
          const localY = rayPoint.y - wY;

          if (Math.abs(localX) <= 2.2 && Math.abs(localY) <= 1.4 && Math.abs(localZ) <= 0.6) {
            closestDist = proj;
            hitIceWallId = wall.id;
            hitPos = rayPoint;
          }
        }
      }

      // 2. Check Remote Players
      for (const remotePlayer of Object.values(remotePlayersRef.current || {})) {
        if (remotePlayer.id === playerId || remotePlayer.health <= 0 || remotePlayer.isDead || killedRemoteIds.current.has(remotePlayer.id)) continue;
        const [pX, pY, pZ] = remotePlayer.transform.position;
        const toPlayer = new THREE.Vector3(pX - rayOrigin.x, pY - rayOrigin.y, pZ - rayOrigin.z);
        const proj = toPlayer.dot(forwardDir);

        if (proj > 0.4 && proj < closestDist) {
          const rayPoint = rayOrigin.clone().add(forwardDir.clone().multiplyScalar(proj));
          const distToCenter = Math.hypot(rayPoint.x - pX, rayPoint.z - pZ);

          if (distToCenter <= 0.65 && rayPoint.y >= pY - 0.95 && rayPoint.y <= pY + 0.95) {
            closestDist = proj;
            hitRemotePlayerId = remotePlayer.id;
            hitRemotePlayerName = remotePlayer.name;
            hitRemotePlayerHp = remotePlayer.health;
            hitZombieId = undefined;
            hitIceWallId = undefined;
            hitPos = rayPoint;

            if (rayPoint.y >= pY + 0.35) {
              isHeadshot = true;
              hitDamage = Math.round(baseDamage * headMultiplier);
            } else {
              isHeadshot = false;
              hitDamage = baseDamage;
            }
          }
        }
      }

      // 3. Check Zombies
      const zombies = zombiesRef.current || [];
      for (const zombie of zombies) {
        if (zombie.health <= 0) continue;
        const [zX, , zZ] = zombie.position;
        const zRadius = zombie.type === 'TANK' ? 1.4 : 1.0;
        const toZombie = new THREE.Vector3(zX - rayOrigin.x, 1.0 - rayOrigin.y, zZ - rayOrigin.z);
        const proj = toZombie.dot(forwardDir);

        if (proj > 0.5 && proj < closestDist) {
          const rayPoint = rayOrigin.clone().add(forwardDir.clone().multiplyScalar(proj));
          const horizDist = Math.hypot(rayPoint.x - zX, rayPoint.z - zZ);

          if (horizDist < zRadius && rayPoint.y >= -0.2 && rayPoint.y <= 2.3) {
            closestDist = proj;
            hitZombieId = zombie.id;
            hitRemotePlayerId = undefined;
            hitIceWallId = undefined;
            hitPos = rayPoint;

            if (rayPoint.y >= 1.45 && horizDist < 0.5) {
              isHeadshot = true;
              hitDamage = Math.round(baseDamage * headMultiplier);
            } else {
              isHeadshot = false;
              hitDamage = baseDamage;
            }
          }
        }
      }

      // Spawn Bullet Tracer
      const gunMuzzlePos = camera.position.clone().add(new THREE.Vector3(0.2, -0.15, -0.5).applyQuaternion(camera.quaternion));
      onSpawnTracer({
        id: `tracer_${Date.now()}_${Math.random()}`,
        start: [gunMuzzlePos.x, gunMuzzlePos.y, gunMuzzlePos.z],
        end: [hitPos.x, hitPos.y, hitPos.z],
        life: 1.0,
      });

      // Apply Hit Results
      if (hitIceWallId) {
        onDamageIceWall(hitIceWallId, hitDamage);
        sounds.playIceWallPlace();
      } else if (hitRemotePlayerId && hitRemotePlayerName) {
        if (isHeadshot) sounds.playHeadshot();
        else sounds.playZombieHit();
        onHitMarker(isHeadshot);

        onSpawnBloodPool({
          id: `blood_${Date.now()}_${Math.random()}`,
          x: hitPos.x,
          z: hitPos.z,
          radius: isHeadshot ? 1.3 : 0.8,
          rotation: Math.random() * Math.PI * 2,
        });

        realtimeManager?.sendPlayerDamaged(hitRemotePlayerId, hitDamage, playerName, weaponName, isHeadshot);

        if (hitRemotePlayerHp <= hitDamage && !killedRemoteIds.current.has(hitRemotePlayerId)) {
          killedRemoteIds.current.add(hitRemotePlayerId);
          const rTarget = remotePlayersRef.current[hitRemotePlayerId];
          if (rTarget) {
            rTarget.health = 0;
            rTarget.isDead = true;
          }
          realtimeManager?.sendKillFeed({
            id: `kf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            killerName: playerName,
            victimName: hitRemotePlayerName,
            weapon: weaponName,
            isHeadshot,
            isPvP: true,
            timestamp: Date.now(),
          });
        }
      } else if (hitZombieId) {
        if (isHeadshot) sounds.playHeadshot();
        else sounds.playZombieHit();
        onHitMarker(isHeadshot);
        onHitZombie(hitZombieId, hitDamage, isHeadshot);

        onSpawnBloodPool({
          id: `blood_${Date.now()}_${Math.random()}`,
          x: hitPos.x,
          z: hitPos.z,
          radius: isHeadshot ? 1.4 : 0.9,
          rotation: Math.random() * Math.PI * 2,
        });
      }
    },
    [
      camera,
      iceWallsRef,
      playerId,
      playerName,
      zombiesRef,
      onSpawnTracer,
      onDamageIceWall,
      onHitMarker,
      onSpawnBloodPool,
      realtimeManager,
      onHitZombie,
    ]
  );

  // Shoot / Attack Master Handler
  const handleShoot = useCallback(() => {
    if (health <= 0 || isReloading) return;

    // 1. ICEWALL
    if (currentWeapon === 'ICEWALL') {
      if (inventory.iceWalls <= 0) return;
      const yaw = euler.current.y;
      const spawnDist = 3.2;
      const wallX = pos.current.x - Math.sin(yaw) * spawnDist;
      const wallZ = pos.current.z - Math.cos(yaw) * spawnDist;
      onPlaceIceWall([wallX, 1.3, wallZ], yaw);
      return;
    }

    // 2. MEDKIT
    if (currentWeapon === 'MEDKIT') {
      onUseMedkit();
      return;
    }

    // 3. TACTICAL KNIFE (Melee Slash)
    if (currentWeapon === 'KNIFE') {
      sounds.playKnifeSlash();
      recoilVal.current = 0.12;
      cameraKick.current = 0.03;
      setAttackProgress(1);
      setTimeout(() => setAttackProgress(0), 200);

      // Check melee hit against players & zombies
      let hitSomeone = false;
      for (const remotePlayer of Object.values(remotePlayersRef.current || {})) {
        if (remotePlayer.id === playerId || remotePlayer.health <= 0) continue;
        const [rX, , rZ] = remotePlayer.transform.position;
        const dist = Math.hypot(rX - pos.current.x, rZ - pos.current.z);
        if (dist <= 2.6) {
          sounds.playZombieHit();
          onHitMarker(true);
          realtimeManager?.sendPlayerDamaged(remotePlayer.id, 75, playerName, 'TACTICAL KNIFE', false);
          hitSomeone = true;
          break;
        }
      }
      if (!hitSomeone) {
        const zombies = zombiesRef.current || [];
        for (const zombie of zombies) {
          if (zombie.health <= 0) continue;
          const dist = Math.hypot(zombie.position[0] - pos.current.x, zombie.position[2] - pos.current.z);
          if (dist <= 2.6) {
            onHitZombie(zombie.id, 75, true);
            sounds.playZombieHit();
            onHitMarker(true);
            break;
          }
        }
      }
      return;
    }

    // 4. UNARMED (Dual Fists Punch Combo)
    if (currentWeapon === 'UNARMED') {
      sounds.playPunchSwing();
      const side = punchSide === 'RIGHT' ? 'LEFT' : 'RIGHT';
      setPunchSide(side);
      setAttackProgress(1);
      setTimeout(() => setAttackProgress(0), 160);
      recoilVal.current = 0.08;
      cameraKick.current = 0.02;

      // Check punch hit against players & zombies
      let punchHit = false;
      for (const remotePlayer of Object.values(remotePlayersRef.current || {})) {
        if (remotePlayer.id === playerId || remotePlayer.health <= 0) continue;
        const [rX, , rZ] = remotePlayer.transform.position;
        const dist = Math.hypot(rX - pos.current.x, rZ - pos.current.z);
        if (dist <= 2.2) {
          sounds.playPunchHit();
          onHitMarker(false);
          realtimeManager?.sendPlayerDamaged(remotePlayer.id, 30, playerName, 'FISTS', false);
          punchHit = true;
          break;
        }
      }
      if (!punchHit) {
        const zombies = zombiesRef.current || [];
        for (const zombie of zombies) {
          if (zombie.health <= 0) continue;
          const dist = Math.hypot(zombie.position[0] - pos.current.x, zombie.position[2] - pos.current.z);
          if (dist <= 2.2) {
            onHitZombie(zombie.id, 30, false);
            sounds.playPunchHit();
            onHitMarker(false);
            break;
          }
        }
      }
      return;
    }

    // 5. FIREARMS (M4A1, PISTOL, SNIPER, SHOTGUN)
    if (ammo <= 0) {
      handleReload();
      return;
    }

    onAmmoChange(ammo - 1);
    isShootingRef.current = true;
    setTimeout(() => {
      isShootingRef.current = false;
    }, 70);

    if (currentWeapon === 'SNIPER') {
      sounds.playSniper();
      recoilVal.current = 0.26;
      cameraKick.current = 0.09;
      executeBulletRaycast(isADS ? 0.0008 : 0.04, 140, 2.7, 'AWM SNIPER');
    } else if (currentWeapon === 'SHOTGUN') {
      sounds.playShotgun();
      recoilVal.current = 0.22;
      cameraKick.current = 0.07;
      // Fire 8 buckshot pellets in spread cone
      for (let p = 0; p < 8; p++) {
        executeBulletRaycast(isADS ? 0.025 : 0.065, 22, 2.0, 'MOSSBERG 590');
      }
    } else if (currentWeapon === 'PISTOL') {
      sounds.playPistol();
      recoilVal.current = 0.14;
      cameraKick.current = 0.05;
      executeBulletRaycast(isADS ? 0.006 : 0.025, 50, 2.4, '.45 PISTOL');
    } else {
      // M4A1 RIFLE
      sounds.playRifle();
      recoilVal.current = 0.09;
      cameraKick.current = 0.035;
      executeBulletRaycast(isADS ? 0.004 : 0.02, 35, 2.4, 'M4A1');
    }
  }, [
    health,
    isReloading,
    currentWeapon,
    inventory.iceWalls,
    punchSide,
    ammo,
    isADS,
    handleReload,
    onPlaceIceWall,
    onUseMedkit,
    playerId,
    playerName,
    zombiesRef,
    onHitMarker,
    realtimeManager,
    onHitZombie,
    onAmmoChange,
    executeBulletRaycast,
  ]);

  // Controls & Listeners
  useEffect(() => {
    const canvas = gl.domElement;

    const onPointerLockChange = () => {
      setIsLocked(document.pointerLockElement === canvas);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== canvas) return;
      if (health <= 0) return;

      // Standard PC FPS Mouse Sensitivity (Smooth, predictable 1:1 raw mouse input)
      const sens = isADS
        ? (currentWeapon === 'SNIPER' ? 0.0009 : 0.0016)
        : 0.0024;

      yaw.current -= (e.movementX || 0) * sens;
      pitch.current -= (e.movementY || 0) * sens;

      // Strict vertical clamping [-89°, +89°] (1.52 rad) - prevents camera flipping or inversion
      const maxPitch = 1.52;
      pitch.current = Math.max(-maxPitch, Math.min(maxPitch, pitch.current));

      euler.current.x = pitch.current;
      euler.current.y = yaw.current;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyW') moveKeys.current.forward = true;
      if (e.code === 'KeyS') moveKeys.current.backward = true;
      if (e.code === 'KeyA') moveKeys.current.left = true;
      if (e.code === 'KeyD') moveKeys.current.right = true;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') moveKeys.current.sprint = true;

      // Jump
      if (e.code === 'Space' && isGrounded.current && health > 0) {
        velocity.current.y = 5.5;
        isGrounded.current = false;
      }

      // [R] Reload
      if (e.code === 'KeyR') {
        handleReload();
      }

      // [1] Switch to Primary (Sniper / Shotgun / Rifle)
      if (e.code === 'Digit1') {
        if (inventory.hasSniper) {
          onWeaponChange('SNIPER');
          sounds.playSwitchWeapon();
        } else if (inventory.hasShotgun) {
          onWeaponChange('SHOTGUN');
          sounds.playSwitchWeapon();
        } else if (inventory.hasRifle) {
          onWeaponChange('RIFLE');
          sounds.playSwitchWeapon();
        }
      }

      // [2] Switch to Secondary (Pistol / Knife)
      if (e.code === 'Digit2') {
        if (inventory.hasPistol) {
          onWeaponChange('PISTOL');
          sounds.playSwitchWeapon();
        } else if (inventory.hasKnife) {
          onWeaponChange('KNIFE');
          sounds.playSwitchWeapon();
        }
      }

      // [3] Switch to IceWall
      if (e.code === 'Digit3') {
        if (inventory.iceWalls > 0) {
          onWeaponChange('ICEWALL');
          sounds.playSwitchWeapon();
        }
      }

      // [4] Use Medkit
      if (e.code === 'Digit4') {
        if (inventory.medkits > 0) {
          onUseMedkit();
        }
      }

      // [5] Melee (Knife or Fists)
      if (e.code === 'Digit5') {
        if (inventory.hasKnife) {
          onWeaponChange('KNIFE');
          sounds.playSwitchWeapon();
        } else {
          onWeaponChange('UNARMED');
          sounds.playSwitchWeapon();
        }
      }

      // [Tab] or [I] Toggle Inventory
      if (e.code === 'Tab' || e.code === 'KeyI') {
        e.preventDefault();
        onToggleInventory?.();
      }

      // [V] Switch Perspective (FPS / TPS)
      if (e.code === 'KeyV') {
        onPerspectiveChange(perspective === 'FPS' ? 'TPS' : 'FPS');
      }

      // [E] Hold to Loot
      if (e.code === 'KeyE') {
        onHoldEChange?.(true);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyW') moveKeys.current.forward = false;
      if (e.code === 'KeyS') moveKeys.current.backward = false;
      if (e.code === 'KeyA') moveKeys.current.left = false;
      if (e.code === 'KeyD') moveKeys.current.right = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') moveKeys.current.sprint = false;
      if (e.code === 'KeyE') onHoldEChange?.(false);
    };

    const onMouseDown = (e: MouseEvent) => {
      if (document.pointerLockElement !== canvas) {
        canvas.requestPointerLock();
        return;
      }
      if (e.button === 0) {
        isMouseDownRef.current = true;
        handleShoot();
      } else if (e.button === 2) {
        if (currentWeapon === 'RIFLE' || currentWeapon === 'PISTOL' || currentWeapon === 'SNIPER' || currentWeapon === 'SHOTGUN') {
          setIsADS(true);
        }
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        isMouseDownRef.current = false;
      }
      if (e.button === 2) {
        setIsADS(false);
      }
    };

    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    document.addEventListener('pointerlockchange', onPointerLockChange);
    document.addEventListener('mousemove', onMouseMove);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('contextmenu', onContextMenu);

    return () => {
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      document.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('contextmenu', onContextMenu);
    };
  }, [
    gl.domElement,
    health,
    isADS,
    currentWeapon,
    inventory,
    handleReload,
    handleShoot,
    onWeaponChange,
    onUseMedkit,
    onToggleInventory,
    onPerspectiveChange,
    perspective,
    onHoldEChange,
    setIsLocked,
    setIsADS,
  ]);

  // Main Game Loop per frame
  useFrame((_, delta) => {
    // Clear killedRemoteIds for any remote player that respawned with health > 0
    if (remotePlayersRef.current) {
      for (const [rId, rPlayer] of Object.entries(remotePlayersRef.current)) {
        if (rPlayer.health > 0 && killedRemoteIds.current.has(rId)) {
          killedRemoteIds.current.delete(rId);
        }
      }
    }

    // 1. FULL-AUTO CONTINUOUS FIRING
    if (isMouseDownRef.current && currentWeapon === 'RIFLE' && !isReloading && ammo > 0 && health > 0) {
      const now = Date.now();
      if (now - lastShotTimeRef.current >= 105) {
        lastShotTimeRef.current = now;
        handleShoot();
      }
    }

    // 2. DEATH CAMERA COLLAPSE ANIMATION
    if (health <= 0) {
      if (!deathSoundPlayed.current) {
        deathSoundPlayed.current = true;
        sounds.playDeathCollapse();
        if (typeof document !== 'undefined' && document.pointerLockElement) {
          document.exitPointerLock();
        }
      }
      // Camera collapses down to ground and tilts sideways
      pos.current.y = THREE.MathUtils.lerp(pos.current.y, 0.35, delta * 5);
      euler.current.z = THREE.MathUtils.lerp(euler.current.z, 0.45, delta * 3);
      camera.position.copy(pos.current);
      camera.quaternion.setFromEuler(new THREE.Euler(0.15, yaw.current, euler.current.z, 'YXZ'));
      return;
    } else {
      deathSoundPlayed.current = false;
      euler.current.z = THREE.MathUtils.lerp(euler.current.z, 0, delta * 10);
    }

    // 3. Movement Physics & Sprinting
    const isMoving =
      moveKeys.current.forward ||
      moveKeys.current.backward ||
      moveKeys.current.left ||
      moveKeys.current.right;
    const isSprinting = isMoving && moveKeys.current.sprint && stamina > 5 && !isADS;
    setIsSprintingState(isSprinting);

    let speed = isSprinting ? 9.2 : 5.4;
    if (isADS) speed = currentWeapon === 'SNIPER' ? 2.0 : 3.0;

    // Drain / Regen Stamina
    if (isSprinting) {
      onStaminaChange(Math.max(0, stamina - delta * 22));
    } else {
      onStaminaChange(Math.min(100, stamina + delta * 14));
    }

    const moveVector = new THREE.Vector3();
    if (moveKeys.current.forward) moveVector.z -= 1;
    if (moveKeys.current.backward) moveVector.z += 1;
    if (moveKeys.current.left) moveVector.x -= 1;
    if (moveKeys.current.right) moveVector.x += 1;
    moveVector.normalize();

    // Rotate movement by player yaw
    moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current);
    velocity.current.x = moveVector.x * speed;
    velocity.current.z = moveVector.z * speed;

    // Gravity
    velocity.current.y -= 18 * delta;
    pos.current.y += velocity.current.y * delta;
    if (pos.current.y <= 1.7) {
      pos.current.y = 1.7;
      velocity.current.y = 0;
      isGrounded.current = true;
    }

    pos.current.x += velocity.current.x * delta;
    pos.current.z += velocity.current.z * delta;

    // Map Boundaries
    pos.current.x = Math.max(-140, Math.min(140, pos.current.x));
    pos.current.z = Math.max(-140, Math.min(140, pos.current.z));

    playerPosRef.current = [pos.current.x, pos.current.y, pos.current.z];

    // Bobbing timer
    if (isMoving && isGrounded.current) {
      bobbingTimer.current += delta * (isSprinting ? 14 : 9);
    }

    // Smooth Recoil Recovery
    recoilVal.current = THREE.MathUtils.lerp(recoilVal.current, 0, delta * 15);
    cameraKick.current = THREE.MathUtils.lerp(cameraKick.current, 0, delta * 12);

    // Apply Camera Transform using standard FPS Euler YXZ -> Quaternion
    const effectivePitch = pitch.current + cameraKick.current;
    const effectiveYaw = yaw.current;
    const effectiveRoll = euler.current.z;

    camera.quaternion.setFromEuler(new THREE.Euler(effectivePitch, effectiveYaw, effectiveRoll, 'YXZ'));

    if (perspective === 'FPS') {
      camera.position.copy(pos.current);
    } else {
      // TPS Camera (Third-Person behind shoulder)
      const tpsOffset = new THREE.Vector3(0.5, 0.4, 2.6);
      tpsOffset.applyEuler(new THREE.Euler(effectivePitch, effectiveYaw, 0, 'YXZ'));
      camera.position.copy(pos.current).add(tpsOffset);
    }

    // 4. Dynamic Camera FOV Zoom for ADS & Sprint
    if ('fov' in camera) {
      const pCam = camera as THREE.PerspectiveCamera;
      if (isADS && currentWeapon === 'SNIPER') {
        pCam.fov = THREE.MathUtils.lerp(pCam.fov, 22, delta * 18); // 4x Optical Zoom!
        pCam.updateProjectionMatrix();
      } else if (isADS) {
        pCam.fov = THREE.MathUtils.lerp(pCam.fov, 55, delta * 18);
        pCam.updateProjectionMatrix();
      } else {
        pCam.fov = THREE.MathUtils.lerp(pCam.fov, isSprinting ? 80 : 75, delta * 10);
        pCam.updateProjectionMatrix();
      }
    }

    // Update IceWall Hologram preview if held
    if (currentWeapon === 'ICEWALL') {
      const spawnDist = 3.2;
      const wallX = pos.current.x - Math.sin(yaw.current) * spawnDist;
      const wallZ = pos.current.z - Math.cos(yaw.current) * spawnDist;
      setPreviewPos([wallX, 1.3, wallZ]);
      setPreviewYaw(yaw.current);
    }

    // Broadcast network transform to teammates
    realtimeManager?.sendPosition({
      id: playerId,
      name: playerName,
      transform: {
        position: [pos.current.x, pos.current.y, pos.current.z],
        rotation: [effectivePitch, effectiveYaw, effectiveRoll],
        isMoving,
        isShooting: isShootingRef.current,
        currentWeapon,
        isSprinting,
        isReloading,
        isPunching: currentWeapon === 'UNARMED' && attackProgress > 0,
        isSlashing: currentWeapon === 'KNIFE' && attackProgress > 0,
      },
      health,
      maxHealth: 100,
      isDead: health <= 0,
      score: 0,
      kills: 0,
    });
  });

  return (
    <>
      {/* FPS 3D Weapon Model (Only visible while alive) */}
      {health > 0 && perspective === 'FPS' && (
        <group position={pos.current.toArray()} rotation={[pitch.current + cameraKick.current, yaw.current, 0, 'YXZ']}>
          <WeaponModel
            weaponType={currentWeapon}
            isADS={isADS}
            isShooting={isShootingRef.current}
            isReloading={isReloading}
            isSprinting={isSprintingState}
            recoil={recoilVal.current}
            bobOffset={bobbingTimer.current}
            attackProgress={attackProgress}
            punchSide={punchSide}
          />
        </group>
      )}

      {/* TPS 3D Player Mesh or Dead Body Corpse on the ground */}
      {(health <= 0 || perspective === 'TPS') && (
        <group position={[pos.current.x, health <= 0 ? 0 : pos.current.y - 1.7, pos.current.z]} rotation={[0, yaw.current, 0]}>
          <SurvivorAvatar
            currentWeapon={currentWeapon}
            isShooting={isShootingRef.current}
            isMoving={
              health > 0 &&
              (moveKeys.current.forward ||
                moveKeys.current.backward ||
                moveKeys.current.left ||
                moveKeys.current.right)
            }
            isSprinting={isSprintingState}
            isReloading={isReloading}
            isPunching={currentWeapon === 'UNARMED' && attackProgress > 0}
            isSlashing={currentWeapon === 'KNIFE' && attackProgress > 0}
            isDead={health <= 0}
          />
        </group>
      )}
    </>
  );
}
