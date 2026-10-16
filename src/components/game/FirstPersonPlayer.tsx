'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RealtimeManager } from '@/lib/network/realtime-manager';
import { sounds } from '@/lib/audio/sound-effects';
import { ShootEvent } from '@/types/game';

interface FirstPersonPlayerProps {
  playerId: string;
  playerName: string;
  health: number;
  ammo: number;
  maxAmmo: number;
  isReloading: boolean;
  onHealthChange: (hp: number) => void;
  onAmmoChange: (ammo: number) => void;
  onReloadStart: () => void;
  onReloadEnd: () => void;
  onShoot: (event: ShootEvent) => void;
  onHitMarker: (isHeadshot: boolean) => void;
  realtimeManager: RealtimeManager | null;
  zombiesRef: React.MutableRefObject<any[]>;
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
}

export function FirstPersonPlayer({
  playerId,
  playerName,
  health,
  ammo,
  maxAmmo,
  isReloading,
  onHealthChange,
  onAmmoChange,
  onReloadStart,
  onReloadEnd,
  onShoot,
  onHitMarker,
  realtimeManager,
  zombiesRef,
  isLocked,
  setIsLocked,
}: FirstPersonPlayerProps) {
  const { camera, gl } = useThree();

  // Position and velocity state
  const pos = useRef(new THREE.Vector3(0, 1.7, 5));
  const velocity = useRef(new THREE.Vector3());
  const moveKeys = useRef({ forward: false, backward: false, left: false, right: false, sprint: false });

  // Camera angles (yaw, pitch)
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const isGrounded = useRef(true);

  // Weapon sway & recoil refs
  const gunRef = useRef<THREE.Group>(null);
  const recoilOffset = useRef(0);
  const muzzleFlash = useRef(false);

  // Bobbing state
  const bobbingTimer = useRef(0);

  // Setup pointer lock and mouse movement listeners
  useEffect(() => {
    const canvas = gl.domElement;

    const onPointerLockChange = () => {
      setIsLocked(document.pointerLockElement === canvas);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== canvas) return;

      const movementX = e.movementX || 0;
      const movementY = e.movementY || 0;

      // Sensitivity
      euler.current.y -= movementX * 0.0022;
      euler.current.x -= movementY * 0.0022;

      // Clamp vertical pitch (-85 to +85 degrees)
      euler.current.x = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, euler.current.x));

      camera.quaternion.setFromEuler(euler.current);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyW') moveKeys.current.forward = true;
      if (e.code === 'KeyS') moveKeys.current.backward = true;
      if (e.code === 'KeyA') moveKeys.current.left = true;
      if (e.code === 'KeyD') moveKeys.current.right = true;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') moveKeys.current.sprint = true;

      // Space to Jump
      if (e.code === 'Space' && isGrounded.current) {
        velocity.current.y = 5.5;
        isGrounded.current = false;
      }

      // R to Reload
      if (e.code === 'KeyR' && ammo < maxAmmo && !isReloading) {
        handleReload();
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
        handleShoot();
      }
    };

    document.addEventListener('pointerlockchange', onPointerLockChange);
    document.addEventListener('mousemove', onMouseMove);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('mousedown', onMouseDown);

    return () => {
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      document.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('mousedown', onMouseDown);
    };
  }, [gl.domElement, ammo, maxAmmo, isReloading]);

  const handleReload = () => {
    onReloadStart();
    sounds.playReload();
    setTimeout(() => {
      onAmmoChange(maxAmmo);
      onReloadEnd();
    }, 1400);
  };

  const handleShoot = () => {
    if (health <= 0) return;
    if (isReloading) return;
    if (ammo <= 0) {
      sounds.playReload();
      handleReload();
      return;
    }

    // Deduct ammo & recoil
    onAmmoChange(ammo - 1);
    sounds.playGunshot();
    recoilOffset.current = 0.08;
    muzzleFlash.current = true;
    setTimeout(() => {
      muzzleFlash.current = false;
    }, 50);

    // Raycast forward from camera
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

    const forwardDir = new THREE.Vector3();
    camera.getWorldDirection(forwardDir);

    let hitZombieId: string | undefined;
    let hitDamage = 35;
    let isHeadshot = false;

    // Check collision against active zombies
    const zombies = zombiesRef.current || [];
    let closestDist = 60; // Max weapon range

    for (const zombie of zombies) {
      if (zombie.health <= 0) continue;
      const zPos = new THREE.Vector3(zombie.position[0], zombie.position[1] + 1.0, zombie.position[2]);
      
      // Calculate distance to ray
      const toZombie = zPos.clone().sub(pos.current);
      const proj = toZombie.dot(forwardDir);
      
      if (proj > 0 && proj < closestDist) {
        const perpDist = toZombie.clone().sub(forwardDir.clone().multiplyScalar(proj)).length();
        if (perpDist < 0.9) {
          closestDist = proj;
          hitZombieId = zombie.id;
          // Headshot check if looking slightly above waist
          if (perpDist < 0.35) {
            isHeadshot = true;
            hitDamage = 75;
          }
        }
      }
    }

    if (hitZombieId) {
      sounds.playZombieHit();
      onHitMarker(isHeadshot);
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

    // Smooth movement calculation
    const speed = moveKeys.current.sprint ? 7.5 : 4.5;
    const inputDir = new THREE.Vector3();

    if (moveKeys.current.forward) inputDir.z -= 1;
    if (moveKeys.current.backward) inputDir.z += 1;
    if (moveKeys.current.left) inputDir.x -= 1;
    if (moveKeys.current.right) inputDir.x += 1;

    inputDir.normalize();

    // Move relative to player's horizontal camera yaw
    const yaw = euler.current.y;
    const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));

    const moveVector = forward.multiplyScalar(-inputDir.z).add(right.multiplyScalar(inputDir.x));
    moveVector.multiplyScalar(speed * delta);

    pos.current.x += moveVector.x;
    pos.current.z += moveVector.z;

    // Simple gravity & ground collision
    if (!isGrounded.current) {
      velocity.current.y -= 15 * delta;
      pos.current.y += velocity.current.y * delta;
      if (pos.current.y <= 1.7) {
        pos.current.y = 1.7;
        velocity.current.y = 0;
        isGrounded.current = true;
      }
    }

    // World boundary clamping (-38 to +38)
    pos.current.x = Math.max(-38, Math.min(38, pos.current.x));
    pos.current.z = Math.max(-38, Math.min(38, pos.current.z));

    // Head bobbing when walking
    const isMoving = inputDir.lengthSq() > 0 && isGrounded.current;
    let bobOffset = 0;
    if (isMoving) {
      bobbingTimer.current += delta * (moveKeys.current.sprint ? 14 : 9);
      bobOffset = Math.sin(bobbingTimer.current) * 0.05;
    }

    camera.position.set(pos.current.x, pos.current.y + bobOffset, pos.current.z);

    // Weapon sway & recoil animation
    if (gunRef.current) {
      recoilOffset.current = THREE.MathUtils.lerp(recoilOffset.current, 0, delta * 12);
      gunRef.current.position.set(0.25, -0.22 + bobOffset * 0.5, -0.5 + recoilOffset.current);
      gunRef.current.rotation.set(-recoilOffset.current * 1.5, 0, 0);
    }

    // Broadcast position to teammates at 10 Hz
    realtimeManager?.sendPosition({
      id: playerId,
      name: playerName,
      transform: {
        position: [pos.current.x, pos.current.y, pos.current.z],
        rotation: [euler.current.x, euler.current.y, 0],
        isMoving,
        isShooting: muzzleFlash.current,
        currentWeapon: 'AR-15',
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
      {/* First-person weapon attached to camera view */}
      <group ref={gunRef}>
        {/* Rifle Body */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.06, 0.09, 0.55]} />
          <meshStandardMaterial color="#2b2d2f" roughness={0.4} metalness={0.8} />
        </mesh>
        {/* Barrel */}
        <mesh position={[0, 0.02, -0.35]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.35, 8]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.9} />
        </mesh>
        {/* Muzzle Flash Light */}
        {muzzleFlash.current && (
          <pointLight position={[0, 0.02, -0.55]} color="#ff9900" intensity={3} distance={5} />
        )}
      </group>
    </>
  );
}
