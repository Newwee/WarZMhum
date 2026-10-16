'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RealtimeManager } from '@/lib/network/realtime-manager';
import { sounds } from '@/lib/audio/sound-effects';
import { ShootEvent, WeaponType, PlayerInventory, IceWallObject } from '@/types/game';
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
  zombiesRef: React.MutableRefObject<any[]>;
  iceWallsRef: React.MutableRefObject<IceWallObject[]>;
  onPlaceIceWall: (pos: [number, number, number], yaw: number) => void;
  onDamageIceWall: (id: string, damage: number) => void;
  onUseMedkit: () => void;
  onToggleShop: () => void;
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
  zombiesRef,
  iceWallsRef,
  onPlaceIceWall,
  onDamageIceWall,
  onUseMedkit,
  onToggleShop,
  isLocked,
  setIsLocked,
  isADS,
  setIsADS,
  playerPosRef,
  setPreviewPos,
  setPreviewYaw,
}: FirstPersonPlayerProps) {
  const { camera, gl } = useThree();

  // Position and physics
  const pos = useRef(new THREE.Vector3(0, 1.7, 5));
  const velocity = useRef(new THREE.Vector3());
  const moveKeys = useRef({ forward: false, backward: false, left: false, right: false, sprint: false });
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const isGrounded = useRef(true);

  // Gun holder attached to camera
  const gunHolderRef = useRef<THREE.Group>(null);

  // Recoil & camera kick
  const recoilVal = useRef(0);
  const cameraKick = useRef(0);
  const isShootingRef = useRef(false);
  const bobbingTimer = useRef(0);

  // Keyboard controls & Mouse lock listeners
  useEffect(() => {
    const canvas = gl.domElement;

    const onPointerLockChange = () => {
      setIsLocked(document.pointerLockElement === canvas);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== canvas) return;
      const sens = isADS ? 0.0012 : 0.0022; // Slower sensitivity when aiming down sights
      euler.current.y -= (e.movementX || 0) * sens;
      euler.current.x -= (e.movementY || 0) * sens;
      euler.current.x = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, euler.current.x));
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyW') moveKeys.current.forward = true;
      if (e.code === 'KeyS') moveKeys.current.backward = true;
      if (e.code === 'KeyA') moveKeys.current.left = true;
      if (e.code === 'KeyD') moveKeys.current.right = true;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') moveKeys.current.sprint = true;

      // [Space] Jump
      if (e.code === 'Space' && isGrounded.current) {
        velocity.current.y = 5.5;
        isGrounded.current = false;
      }

      // [R] Reload
      if (e.code === 'KeyR' && (currentWeapon === 'RIFLE' || currentWeapon === 'PISTOL') && ammo < maxAmmo && !isReloading) {
        handleReload();
      }

      // [1] Switch to M4A1 Rifle (if owned)
      if (e.code === 'Digit1') {
        if (inventory.hasRifle) {
          onWeaponChange('RIFLE');
          sounds.playSwitchWeapon();
        }
      }

      // [2] Switch to .45 Thunder Pistol (if owned)
      if (e.code === 'Digit2') {
        if (inventory.hasPistol) {
          onWeaponChange('PISTOL');
          sounds.playSwitchWeapon();
        }
      }

      // [3] Switch to IceWall Deployer (if in inventory)
      if (e.code === 'Digit3') {
        if (inventory.iceWalls > 0) {
          onWeaponChange('ICEWALL');
          sounds.playSwitchWeapon();
        }
      }

      // [4] Use Military Medkit (if in inventory)
      if (e.code === 'Digit4') {
        if (inventory.medkits > 0) {
          onUseMedkit();
        }
      }

      // [5] Switch to Unarmed (Bare hands)
      if (e.code === 'Digit5') {
        onWeaponChange('UNARMED');
        sounds.playSwitchWeapon();
      }

      // [B] Open / Close Shop & Armory
      if (e.code === 'KeyB') {
        onToggleShop();
      }

      // [V] Switch Perspective (FPS / TPS)
      if (e.code === 'KeyV') {
        onPerspectiveChange(perspective === 'FPS' ? 'TPS' : 'FPS');
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyW') moveKeys.current.forward = false;
      if (e.code === 'KeyS') moveKeys.current.backward = false;
      if (e.code === 'KeyA') moveKeys.current.left = false;
      if (e.code === 'KeyD') moveKeys.current.right = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') moveKeys.current.sprint = false;
    };

    const onMouseDown = (e: MouseEvent) => {
      if (document.pointerLockElement !== canvas) {
        canvas.requestPointerLock();
        return;
      }
      if (e.button === 0) {
        // Left Click: Shoot / Place / Punch
        handleShoot();
      } else if (e.button === 2) {
        // Right Click: Aim Down Sights (ADS)
        if (currentWeapon === 'RIFLE' || currentWeapon === 'PISTOL') {
          setIsADS(true);
        }
      }
    };

    const onMouseUp = (e: MouseEvent) => {
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
    ammo,
    maxAmmo,
    isReloading,
    currentWeapon,
    isADS,
    perspective,
    inventory,
    onUseMedkit,
    onToggleShop,
    onWeaponChange,
    onPerspectiveChange,
  ]);

  const handleReload = () => {
    onReloadStart();
    sounds.playReload();
    setTimeout(() => {
      onAmmoChange(maxAmmo);
      onReloadEnd();
    }, 1300);
  };

  const handleShoot = () => {
    if (health <= 0 || isReloading) return;

    // 1. ICEWALL: Deploy ice wall on left click
    if (currentWeapon === 'ICEWALL') {
      if (inventory.iceWalls <= 0) return;
      const yaw = euler.current.y;
      const spawnDist = 3.2;
      const wallX = pos.current.x - Math.sin(yaw) * spawnDist;
      const wallZ = pos.current.z - Math.cos(yaw) * spawnDist;
      onPlaceIceWall([wallX, 1.3, wallZ], yaw);
      return;
    }

    // 2. MEDKIT: Heal on left click
    if (currentWeapon === 'MEDKIT') {
      onUseMedkit();
      return;
    }

    // 3. UNARMED: Melee punch swing
    if (currentWeapon === 'UNARMED') {
      recoilVal.current = 0.08;
      cameraKick.current = 0.02;
      isShootingRef.current = true;
      setTimeout(() => {
        isShootingRef.current = false;
      }, 100);

      const zombies = zombiesRef.current || [];
      for (const zombie of zombies) {
        if (zombie.health <= 0) continue;
        const dist = Math.hypot(zombie.position[0] - pos.current.x, zombie.position[2] - pos.current.z);
        if (dist <= 2.2) {
          zombie.health = Math.max(0, zombie.health - 30);
          zombie.state = 'CHASING';
          if (zombie.health <= 0) {
            zombiesRef.current = zombiesRef.current.filter((z) => z.id !== zombie.id);
          }
          onHitZombie(zombie.id, 30, false);
          sounds.playZombieHit();
          onHitMarker(false);
          realtimeManager?.sendZombieDamaged(zombie.id, 30, playerId);
          break;
        }
      }
      return;
    }

    // 4. FIREARMS: RIFLE or PISTOL
    if (ammo <= 0) {
      sounds.playReload();
      handleReload();
      return;
    }

    onAmmoChange(ammo - 1);

    // Audio by caliber
    if (currentWeapon === 'PISTOL') {
      sounds.playPistol();
      recoilVal.current = 0.14;
      cameraKick.current = 0.05;
    } else {
      sounds.playRifle();
      recoilVal.current = 0.09;
      cameraKick.current = 0.035;
    }

    isShootingRef.current = true;
    setTimeout(() => {
      isShootingRef.current = false;
    }, 60);

    // Camera Direction & Raycast from actual camera view
    const rayOrigin = camera.position.clone();
    const forwardDir = new THREE.Vector3();
    camera.getWorldDirection(forwardDir);

    // Bullet spread: tighter when ADS
    const spread = isADS ? 0.004 : 0.02;
    forwardDir.x += (Math.random() - 0.5) * spread;
    forwardDir.y += (Math.random() - 0.5) * spread;
    forwardDir.normalize();

    let hitZombieId: string | undefined;
    let hitIceWallId: string | undefined;
    let hitDamage = currentWeapon === 'PISTOL' ? 50 : 35;
    let isHeadshot = false;
    let hitPos = rayOrigin.clone().add(forwardDir.clone().multiplyScalar(75));
    let closestDist = 75;

    // A. Check bullet intersection against IceWalls (IceWalls block bullets completely!)
    const iceWalls = iceWallsRef?.current || [];
    for (const wall of iceWalls) {
      if (wall.health <= 0) continue;
      const wX = wall.position[0];
      const wY = wall.position[1];
      const wZ = wall.position[2];

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

    // B. Check collision against zombies if not blocked by closer IceWall
    const zombies = zombiesRef.current || [];
    for (const zombie of zombies) {
      if (zombie.health <= 0) continue;
      const zX = zombie.position[0];
      const zZ = zombie.position[2];
      const zRadius = zombie.type === 'TANK' ? 1.4 : 1.0;

      const toZombie = new THREE.Vector3(zX - rayOrigin.x, 1.0 - rayOrigin.y, zZ - rayOrigin.z);
      const proj = toZombie.dot(forwardDir);

      if (proj > 0.5 && proj < closestDist) {
        const rayPoint = rayOrigin.clone().add(forwardDir.clone().multiplyScalar(proj));
        const horizDist = Math.hypot(rayPoint.x - zX, rayPoint.z - zZ);

        if (horizDist < zRadius && rayPoint.y >= -0.2 && rayPoint.y <= 2.3) {
          closestDist = proj;
          hitZombieId = zombie.id;
          hitIceWallId = undefined; // Zombie is closer than wall
          hitPos = rayPoint;

          // Headshot if hit above shoulder line
          if (rayPoint.y >= 1.45 && horizDist < 0.5) {
            isHeadshot = true;
            hitDamage = currentWeapon === 'PISTOL' ? 120 : 85;
          } else {
            isHeadshot = false;
            hitDamage = currentWeapon === 'PISTOL' ? 50 : 35;
          }
        }
      }
    }

    // Spawn 3D Bullet Tracer from actual gun muzzle tip
    const muzzleOffset = isADS
      ? new THREE.Vector3(0, -0.13, -0.65)
      : new THREE.Vector3(currentWeapon === 'PISTOL' ? 0.22 : 0.25, -0.2, -0.72);
    const gunMuzzlePos = camera.position.clone().add(muzzleOffset.applyQuaternion(camera.quaternion));
    onSpawnTracer({
      id: `tracer_${Date.now()}_${Math.random()}`,
      start: [gunMuzzlePos.x, gunMuzzlePos.y, gunMuzzlePos.z],
      end: [hitPos.x, hitPos.y, hitPos.z],
      life: 1.0,
    });

    if (hitIceWallId) {
      // IceWall absorbed the bullet!
      onDamageIceWall(hitIceWallId, hitDamage);
      sounds.playIceWallPlace();
    } else if (hitZombieId) {
      // 1. Immediately mutate zombiesRef so health is locked down directly
      const targetZombie = zombies.find((z) => z.id === hitZombieId);
      if (targetZombie) {
        targetZombie.health = Math.max(0, targetZombie.health - hitDamage);
        targetZombie.state = 'CHASING';
        if (targetZombie.health <= 0) {
          zombiesRef.current = zombiesRef.current.filter((z) => z.id !== hitZombieId);
        }
      }

      // 2. Trigger React state & Kill handler
      onHitZombie(hitZombieId, hitDamage, isHeadshot);

      if (isHeadshot) {
        sounds.playHeadshot();
      } else {
        sounds.playZombieHit();
      }
      onHitMarker(isHeadshot);

      // Spawn blood pool on ground
      onSpawnBloodPool({
        id: `blood_${Date.now()}_${Math.random()}`,
        x: hitPos.x,
        z: hitPos.z,
        radius: isHeadshot ? 1.3 : 0.85,
        rotation: Math.random() * Math.PI * 2,
      });

      // 3. Broadcast damage to other players
      realtimeManager?.sendZombieDamaged(hitZombieId, hitDamage, playerId);
    }

    const shootEvent: ShootEvent = {
      shooterId: playerId,
      origin: [pos.current.x, pos.current.y, pos.current.z],
      direction: [forwardDir.x, forwardDir.y, forwardDir.z],
      timestamp: Date.now(),
      hitZombieId,
      damage: hitZombieId ? hitDamage : undefined,
      isHeadshot,
    };

    onShoot(shootEvent);
    realtimeManager?.sendShoot(shootEvent);
  };

  useFrame((_, delta) => {
    if (health <= 0) return;

    // Stamina & Sprinting System
    let isSprinting = moveKeys.current.sprint && stamina > 5;
    if (isSprinting) {
      onStaminaChange(Math.max(0, stamina - delta * 20));
    } else {
      onStaminaChange(Math.min(100, stamina + delta * 12));
    }

    const speed = isSprinting ? 7.8 : isADS ? 2.8 : 4.6;
    const inputDir = new THREE.Vector3();
    if (moveKeys.current.forward) inputDir.z -= 1;
    if (moveKeys.current.backward) inputDir.z += 1;
    if (moveKeys.current.left) inputDir.x -= 1;
    if (moveKeys.current.right) inputDir.x += 1;
    inputDir.normalize();

    const yaw = euler.current.y;
    const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    const moveVector = forward.multiplyScalar(-inputDir.z).add(right.multiplyScalar(inputDir.x));
    moveVector.multiplyScalar(speed * delta);

    pos.current.x += moveVector.x;
    pos.current.z += moveVector.z;

    // Gravity
    if (!isGrounded.current) {
      velocity.current.y -= 15 * delta;
      pos.current.y += velocity.current.y * delta;
      if (pos.current.y <= 1.7) {
        pos.current.y = 1.7;
        velocity.current.y = 0;
        isGrounded.current = true;
      }
    }

    pos.current.x = Math.max(-55, Math.min(55, pos.current.x));
    pos.current.z = Math.max(-55, Math.min(55, pos.current.z));

    // Head bobbing
    const isMoving = inputDir.lengthSq() > 0 && isGrounded.current;
    let bobOffset = 0;
    if (isMoving) {
      bobbingTimer.current += delta * (isSprinting ? 15 : 9);
      bobOffset = Math.sin(bobbingTimer.current) * 0.05;
    }

    // Recoil recovery
    recoilVal.current = THREE.MathUtils.lerp(recoilVal.current, 0, delta * 16);
    cameraKick.current = THREE.MathUtils.lerp(cameraKick.current, 0, delta * 14);

    // Camera angles
    const effectivePitch = euler.current.x - cameraKick.current;
    camera.quaternion.setFromEuler(new THREE.Euler(effectivePitch, euler.current.y, 0, 'YXZ'));

    // Camera FOV transition for ADS zoom
    const targetFov = isADS ? (currentWeapon === 'RIFLE' ? 52 : 62) : 75;
    (camera as THREE.PerspectiveCamera).fov = THREE.MathUtils.lerp(
      (camera as THREE.PerspectiveCamera).fov,
      targetFov,
      delta * 14
    );
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();

    // Perspective Positioning
    if (perspective === 'FPS') {
      camera.position.set(pos.current.x, pos.current.y + bobOffset, pos.current.z);
    } else {
      // Third Person Over-The-Shoulder (WarZ Image 2)
      const tpsOffset = new THREE.Vector3(0.65, 0.3, 2.4).applyEuler(new THREE.Euler(0, euler.current.y, 0));
      camera.position.set(pos.current.x + tpsOffset.x, pos.current.y + 0.3 + tpsOffset.y, pos.current.z + tpsOffset.z);
    }

    // Keep live player position ref updated for zombies so they never attack empty air
    playerPosRef.current = [pos.current.x, pos.current.y, pos.current.z];

    // Update IceWall placement preview hologram
    if (currentWeapon === 'ICEWALL') {
      const yaw = euler.current.y;
      setPreviewPos([pos.current.x - Math.sin(yaw) * 3.2, 1.3, pos.current.z - Math.cos(yaw) * 3.2]);
      setPreviewYaw(yaw);
    }

    // Lock gun directly to camera in first-person so it NEVER floats away in mid-air
    if (gunHolderRef.current) {
      gunHolderRef.current.position.copy(camera.position);
      gunHolderRef.current.quaternion.copy(camera.quaternion);
    }

    // Network position broadcast
    realtimeManager?.sendPosition({
      id: playerId,
      name: playerName,
      transform: {
        position: [pos.current.x, pos.current.y, pos.current.z],
        rotation: [euler.current.x, euler.current.y, 0],
        isMoving,
        isShooting: isShootingRef.current,
        currentWeapon,
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
      {/* FPS: Weapon Model locked to camera */}
      {perspective === 'FPS' && (
        <group ref={gunHolderRef}>
          <WeaponModel
            weaponType={currentWeapon}
            isADS={isADS}
            isShooting={isShootingRef.current}
            recoil={recoilVal.current}
            bobOffset={bobbingTimer.current}
          />
        </group>
      )}

      {/* TPS: Full Survivor Avatar with backpack and helmet */}
      {perspective === 'TPS' && (
        <group position={[pos.current.x, 0, pos.current.z]} rotation={[0, euler.current.y, 0]}>
          <SurvivorAvatar
            currentWeapon={currentWeapon}
            isShooting={isShootingRef.current}
            isMoving={moveKeys.current.forward || moveKeys.current.backward}
          />
        </group>
      )}
    </>
  );
}
