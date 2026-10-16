'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RealtimeManager } from '@/lib/network/realtime-manager';
import { sounds } from '@/lib/audio/sound-effects';
import { ShootEvent } from '@/types/game';
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
  currentWeapon: 'RIFLE' | 'PISTOL';
  perspective: 'FPS' | 'TPS';
  onHealthChange: (hp: number) => void;
  onStaminaChange: (stamina: number) => void;
  onAmmoChange: (ammo: number) => void;
  onReloadStart: () => void;
  onReloadEnd: () => void;
  onShoot: (event: ShootEvent) => void;
  onHitMarker: (isHeadshot: boolean) => void;
  onWeaponChange: (weapon: 'RIFLE' | 'PISTOL') => void;
  onPerspectiveChange: (p: 'FPS' | 'TPS') => void;
  onSpawnTracer: (tracer: BulletTracer) => void;
  onSpawnBloodPool: (pool: BloodPool) => void;
  realtimeManager: RealtimeManager | null;
  zombiesRef: React.MutableRefObject<any[]>;
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
  isADS: boolean;
  setIsADS: (ads: boolean) => void;
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
  onHealthChange,
  onStaminaChange,
  onAmmoChange,
  onReloadStart,
  onReloadEnd,
  onShoot,
  onHitMarker,
  onWeaponChange,
  onPerspectiveChange,
  onSpawnTracer,
  onSpawnBloodPool,
  realtimeManager,
  zombiesRef,
  isLocked,
  setIsLocked,
  isADS,
  setIsADS,
}: FirstPersonPlayerProps) {
  const { camera, gl } = useThree();

  // Position and physics
  const pos = useRef(new THREE.Vector3(0, 1.7, 5));
  const velocity = useRef(new THREE.Vector3());
  const moveKeys = useRef({ forward: false, backward: false, left: false, right: false, sprint: false });
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const isGrounded = useRef(true);

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
      if (e.code === 'KeyR' && ammo < maxAmmo && !isReloading) {
        handleReload();
      }

      // [1] Switch to M4A1 Rifle
      if (e.code === 'Digit1' && currentWeapon !== 'RIFLE' && !isReloading) {
        onWeaponChange('RIFLE');
        sounds.playSwitchWeapon();
      }

      // [2] Switch to .45 Thunder Pistol
      if (e.code === 'Digit2' && currentWeapon !== 'PISTOL' && !isReloading) {
        onWeaponChange('PISTOL');
        sounds.playSwitchWeapon();
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
        // Left Click: Shoot
        handleShoot();
      } else if (e.button === 2) {
        // Right Click: Aim Down Sights (ADS)
        setIsADS(true);
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
  }, [gl.domElement, ammo, maxAmmo, isReloading, currentWeapon, isADS, perspective]);

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

    // Camera Direction & Raycast
    const forwardDir = new THREE.Vector3();
    camera.getWorldDirection(forwardDir);

    // Bullet spread: tighter when ADS
    const spread = isADS ? 0.005 : 0.025;
    forwardDir.x += (Math.random() - 0.5) * spread;
    forwardDir.y += (Math.random() - 0.5) * spread;
    forwardDir.normalize();

    let hitZombieId: string | undefined;
    let hitDamage = currentWeapon === 'PISTOL' ? 45 : 32;
    let isHeadshot = false;
    let hitPos = pos.current.clone().add(forwardDir.clone().multiplyScalar(60));

    // Collision check against zombies
    const zombies = zombiesRef.current || [];
    let closestDist = 60;

    for (const zombie of zombies) {
      if (zombie.health <= 0) continue;
      const zPos = new THREE.Vector3(zombie.position[0], zombie.position[1] + 1.0, zombie.position[2]);
      const toZombie = zPos.clone().sub(pos.current);
      const proj = toZombie.dot(forwardDir);

      if (proj > 0 && proj < closestDist) {
        const perpDist = toZombie.clone().sub(forwardDir.clone().multiplyScalar(proj)).length();
        if (perpDist < 0.85) {
          closestDist = proj;
          hitZombieId = zombie.id;
          hitPos = pos.current.clone().add(forwardDir.clone().multiplyScalar(proj));

          // Headshot calculation
          if (perpDist < 0.35) {
            isHeadshot = true;
            hitDamage = currentWeapon === 'PISTOL' ? 110 : 80;
          }
        }
      }
    }

    // Spawn 3D Bullet Tracer
    const gunMuzzlePos = pos.current.clone().add(new THREE.Vector3(0.2, -0.2, 0).applyEuler(euler.current));
    onSpawnTracer({
      id: `tracer_${Date.now()}_${Math.random()}`,
      start: [gunMuzzlePos.x, gunMuzzlePos.y, gunMuzzlePos.z],
      end: [hitPos.x, hitPos.y, hitPos.z],
      life: 1.0,
    });

    if (hitZombieId) {
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
        radius: isHeadshot ? 1.2 : 0.8,
        rotation: Math.random() * Math.PI * 2,
      });

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
      {/* FPS: Weapon Model in front of camera */}
      {perspective === 'FPS' && (
        <WeaponModel
          weaponType={currentWeapon}
          isADS={isADS}
          isShooting={isShootingRef.current}
          recoil={recoilVal.current}
          bobOffset={bobbingTimer.current}
        />
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
