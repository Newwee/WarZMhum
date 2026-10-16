'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { WeaponType } from '@/types/game';

interface WeaponModelProps {
  weaponType: WeaponType;
  isADS: boolean;
  isShooting: boolean;
  isReloading?: boolean;
  isSprinting?: boolean;
  recoil: number;
  bobOffset: number;
  attackProgress?: number; // 0..1 for melee slash / punch animation
  punchSide?: 'LEFT' | 'RIGHT';
}

export function WeaponModel({
  weaponType,
  isADS,
  isShooting,
  isReloading = false,
  isSprinting = false,
  recoil,
  bobOffset,
  attackProgress = 0,
  punchSide = 'RIGHT',
}: WeaponModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const slideRef = useRef<THREE.Group>(null);
  const magRef = useRef<THREE.Group>(null);
  const pumpRef = useRef<THREE.Group>(null);
  const boltRef = useRef<THREE.Group>(null);
  const leftFistRef = useRef<THREE.Group>(null);
  const rightFistRef = useRef<THREE.Group>(null);
  const knifeRef = useRef<THREE.Group>(null);

  // Target local offsets relative to camera:
  const targetPos = useMemo(() => {
    if (weaponType === 'PISTOL') {
      return isADS
        ? new THREE.Vector3(0, -0.135, -0.32)
        : new THREE.Vector3(0.22, -0.22, -0.42);
    } else if (weaponType === 'RIFLE') {
      return isADS
        ? new THREE.Vector3(0, -0.145, -0.36)
        : new THREE.Vector3(0.25, -0.24, -0.48);
    } else if (weaponType === 'SNIPER') {
      return isADS
        ? new THREE.Vector3(0, -0.12, -0.28) // Deep optic sightline
        : new THREE.Vector3(0.24, -0.23, -0.52);
    } else if (weaponType === 'SHOTGUN') {
      return isADS
        ? new THREE.Vector3(0, -0.15, -0.38)
        : new THREE.Vector3(0.26, -0.24, -0.46);
    } else if (weaponType === 'KNIFE') {
      return new THREE.Vector3(0.18, -0.2, -0.35);
    } else if (weaponType === 'ICEWALL') {
      return new THREE.Vector3(0.18, -0.22, -0.38);
    } else if (weaponType === 'MEDKIT') {
      return new THREE.Vector3(0.16, -0.2, -0.36);
    } else {
      // UNARMED (Fists)
      return new THREE.Vector3(0, -0.22, -0.35);
    }
  }, [isADS, weaponType]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // 1. Smooth ADS & Position Transition
    const lerpSpeed = isADS ? 22 : 14;
    let desiredX = targetPos.x;
    let desiredY = targetPos.y;
    let desiredZ = targetPos.z;

    // Sprinting tactical carry (Low-Ready / Tilted across chest)
    if (isSprinting && !isADS) {
      desiredX += 0.05;
      desiredY -= 0.06;
      desiredZ += 0.04;
    }

    // Walking / Sprinting Bobbing
    const bobFactor = isSprinting ? 0.035 : 0.018;
    const sideBob = Math.cos(bobOffset) * (isSprinting ? 0.02 : 0.008);
    desiredY += isADS ? 0 : Math.sin(bobOffset * 2) * bobFactor;
    desiredX += isADS ? 0 : sideBob;
    desiredZ += recoil * 0.45;

    // Reloading tilt / drop motion
    if (isReloading) {
      desiredY -= 0.07;
      desiredZ += 0.05;
    }

    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, desiredX, delta * lerpSpeed);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, desiredY, delta * lerpSpeed);
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, desiredZ, delta * 24);

    // 2. Rotations (Pitch, Yaw, Roll)
    let targetPitch = -recoil * (weaponType === 'PISTOL' ? 1.4 : weaponType === 'SNIPER' ? 1.8 : weaponType === 'SHOTGUN' ? 1.6 : 0.9);
    let targetYaw = 0;
    let targetRoll = 0;

    // Sprinting stance angle
    if (isSprinting && !isADS) {
      targetPitch -= 0.35;
      targetYaw += 0.35;
      targetRoll -= 0.2;
    }

    // Reloading procedural tilt (tilted left and up towards chest)
    if (isReloading) {
      targetPitch -= 0.25;
      targetYaw -= 0.3;
      targetRoll += 0.45;
    }

    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetPitch, delta * 26);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetYaw, delta * 18);
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetRoll, delta * 18);

    // 3. Magazine drop & insert animation during reload
    if (magRef.current) {
      if (isReloading) {
        // Mag slides down out of receiver then snaps back in
        const time = state.clock.getElapsedTime() * 4;
        const magCycle = Math.sin(time);
        magRef.current.position.y = Math.min(0, -Math.abs(magCycle) * 0.18);
      } else {
        magRef.current.position.y = THREE.MathUtils.lerp(magRef.current.position.y, 0, delta * 20);
      }
    }

    // 4. Slide / Bolt / Pump mechanics
    if (slideRef.current) {
      slideRef.current.position.z = THREE.MathUtils.lerp(slideRef.current.position.z, recoil * 0.45, delta * 32);
    }
    if (pumpRef.current) {
      // Pump shotgun slide rack
      pumpRef.current.position.z = THREE.MathUtils.lerp(pumpRef.current.position.z, recoil > 0.05 ? 0.08 : 0, delta * 25);
    }
    if (boltRef.current) {
      // Sniper bolt pull
      boltRef.current.position.z = THREE.MathUtils.lerp(boltRef.current.position.z, recoil > 0.05 ? 0.06 : 0, delta * 15);
    }

    // 5. Bare Fists Punch Animation (Alternating Left Jab / Right Cross)
    if (leftFistRef.current && rightFistRef.current) {
      if (attackProgress > 0) {
        if (punchSide === 'LEFT') {
          leftFistRef.current.position.z = -attackProgress * 0.38;
          leftFistRef.current.position.x = -0.06 + attackProgress * 0.04;
          leftFistRef.current.position.y = 0.04;
        } else {
          rightFistRef.current.position.z = -attackProgress * 0.42;
          rightFistRef.current.position.x = 0.06 - attackProgress * 0.04;
          rightFistRef.current.position.y = 0.04;
        }
      } else {
        leftFistRef.current.position.z = THREE.MathUtils.lerp(leftFistRef.current.position.z, 0, delta * 20);
        leftFistRef.current.position.x = THREE.MathUtils.lerp(leftFistRef.current.position.x, -0.14, delta * 20);
        rightFistRef.current.position.z = THREE.MathUtils.lerp(rightFistRef.current.position.z, 0, delta * 20);
        rightFistRef.current.position.x = THREE.MathUtils.lerp(rightFistRef.current.position.x, 0.14, delta * 20);
      }
    }

    // 6. Tactical Knife Slash Arc Animation
    if (knifeRef.current) {
      if (attackProgress > 0) {
        // Slash across screen from right to left
        knifeRef.current.rotation.y = THREE.MathUtils.lerp(-0.6, 1.1, attackProgress);
        knifeRef.current.rotation.z = THREE.MathUtils.lerp(0.5, -0.6, attackProgress);
        knifeRef.current.position.x = THREE.MathUtils.lerp(0.12, -0.22, attackProgress);
        knifeRef.current.position.z = THREE.MathUtils.lerp(0, -0.18, attackProgress);
      } else {
        knifeRef.current.rotation.y = THREE.MathUtils.lerp(knifeRef.current.rotation.y, 0, delta * 20);
        knifeRef.current.rotation.z = THREE.MathUtils.lerp(knifeRef.current.rotation.z, 0, delta * 20);
        knifeRef.current.position.x = THREE.MathUtils.lerp(knifeRef.current.position.x, 0, delta * 20);
        knifeRef.current.position.z = THREE.MathUtils.lerp(knifeRef.current.position.z, 0, delta * 20);
      }
    }
  });

  return (
    <group ref={groupRef} position={[targetPos.x, targetPos.y, targetPos.z]}>
      {/* 1. .45 THUNDER PISTOL */}
      {weaponType === 'PISTOL' && (
        <group scale={[1.15, 1.15, 1.15]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.045, 0.08, 0.22]} />
            <meshStandardMaterial color="#22252a" roughness={0.3} metalness={0.85} />
          </mesh>
          <mesh position={[0, -0.09, 0.06]} rotation={[0.3, 0, 0]}>
            <boxGeometry args={[0.04, 0.12, 0.05]} />
            <meshStandardMaterial color="#3d2817" roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.05, 0.02]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.02, 0.004, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#1a1c20" metalness={0.9} />
          </mesh>
          <group ref={slideRef} position={[0, 0.045, -0.02]}>
            <mesh>
              <boxGeometry args={[0.044, 0.045, 0.26]} />
              <meshStandardMaterial color="#181a1d" roughness={0.25} metalness={0.9} />
            </mesh>
            <mesh position={[0, 0.026, -0.12]}>
              <boxGeometry args={[0.005, 0.009, 0.008]} />
              <meshBasicMaterial color="#10b981" />
            </mesh>
            <mesh position={[-0.012, 0.026, 0.11]}>
              <boxGeometry args={[0.004, 0.008, 0.006]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0.012, 0.026, 0.11]}>
              <boxGeometry args={[0.004, 0.008, 0.006]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>
          <mesh position={[0, 0.035, -0.16]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.016, 0.016, 0.12, 12]} />
            <meshStandardMaterial color="#111315" roughness={0.2} metalness={0.95} />
          </mesh>

          {/* Magazine that drops out on reload */}
          <group ref={magRef} position={[0, -0.08, 0.06]} rotation={[0.3, 0, 0]}>
            <mesh>
              <boxGeometry args={[0.032, 0.11, 0.038]} />
              <meshStandardMaterial color="#101114" metalness={0.9} />
            </mesh>
          </group>

          {/* Hands */}
          <group position={[0.02, -0.1, 0.08]}>
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.055, 12, 12]} />
              <meshStandardMaterial color="#c89678" roughness={0.6} />
            </mesh>
            <mesh position={[0.04, -0.14, 0.14]} rotation={[-0.5, 0.2, -0.2]}>
              <cylinderGeometry args={[0.055, 0.065, 0.26, 12]} />
              <meshStandardMaterial color="#2d3732" roughness={0.8} />
            </mesh>
          </group>

          {isShooting && (
            <group position={[0, 0.035, -0.26]}>
              <mesh>
                <sphereGeometry args={[0.08, 8, 8]} />
                <meshBasicMaterial color="#ffaa00" />
              </mesh>
              <pointLight color="#ff9900" intensity={5} distance={7} />
            </group>
          )}
        </group>
      )}

      {/* 2. M4A1 FULL-AUTO ASSAULT RIFLE */}
      {weaponType === 'RIFLE' && (
        <group scale={[0.95, 0.95, 0.95]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.055, 0.09, 0.42]} />
            <meshStandardMaterial color="#25282c" roughness={0.4} metalness={0.8} />
          </mesh>
          <mesh position={[0, 0.01, -0.28]}>
            <boxGeometry args={[0.05, 0.075, 0.24]} />
            <meshStandardMaterial color="#1c1e21" roughness={0.5} metalness={0.7} />
          </mesh>
          <mesh position={[0, 0.015, -0.46]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.014, 0.014, 0.22, 12]} />
            <meshStandardMaterial color="#0f1113" roughness={0.2} metalness={0.95} />
          </mesh>

          {/* Ejectable Banana Mag */}
          <group ref={magRef} position={[0, -0.12, -0.05]} rotation={[-0.2, 0, 0]}>
            <mesh>
              <boxGeometry args={[0.038, 0.16, 0.07]} />
              <meshStandardMaterial color="#181a1c" roughness={0.6} metalness={0.6} />
            </mesh>
          </group>

          <mesh position={[0, -0.1, 0.12]} rotation={[0.4, 0, 0]}>
            <boxGeometry args={[0.038, 0.12, 0.05]} />
            <meshStandardMaterial color="#141517" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.01, 0.28]}>
            <boxGeometry args={[0.045, 0.1, 0.2]} />
            <meshStandardMaterial color="#202326" roughness={0.6} metalness={0.5} />
          </mesh>
          <mesh position={[0, 0.055, -0.38]}>
            <boxGeometry args={[0.006, 0.02, 0.01]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          <mesh position={[0, 0.06, 0.16]}>
            <boxGeometry args={[0.03, 0.018, 0.015]} />
            <meshStandardMaterial color="#1a1c1e" />
          </mesh>

          {/* Arms */}
          <mesh position={[0.08, -0.14, 0.2]} rotation={[-0.4, 0.2, -0.1]}>
            <cylinderGeometry args={[0.06, 0.07, 0.28, 12]} />
            <meshStandardMaterial color="#2d3732" roughness={0.8} />
          </mesh>
          <mesh position={[-0.08, -0.08, -0.22]} rotation={[0.5, -0.3, 0.2]}>
            <cylinderGeometry args={[0.055, 0.065, 0.26, 12]} />
            <meshStandardMaterial color="#2d3732" roughness={0.8} />
          </mesh>

          {isShooting && (
            <group position={[0, 0.015, -0.58]}>
              <mesh>
                <sphereGeometry args={[0.09, 8, 8]} />
                <meshBasicMaterial color="#ffbb22" />
              </mesh>
              <pointLight color="#ff9900" intensity={6} distance={8} />
            </group>
          )}
        </group>
      )}

      {/* 3. AWM HEAVY TACTICAL SNIPER RIFLE */}
      {weaponType === 'SNIPER' && (
        <group scale={[0.9, 0.9, 0.9]}>
          {/* Sniper Chassis / Body */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.06, 0.09, 0.55]} />
            <meshStandardMaterial color="#293327" roughness={0.7} metalness={0.4} />
          </mesh>
          {/* Long Precision Heavy Fluted Barrel */}
          <mesh position={[0, 0.02, -0.6]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.016, 0.02, 0.72, 14]} />
            <meshStandardMaterial color="#111315" roughness={0.2} metalness={0.95} />
          </mesh>
          {/* Muzzle Brake */}
          <mesh position={[0, 0.02, -0.98]}>
            <boxGeometry args={[0.036, 0.036, 0.07]} />
            <meshStandardMaterial color="#1a1c1f" metalness={0.9} />
          </mesh>

          {/* High-Power Telescopic Optical Scope */}
          <group position={[0, 0.1, -0.05]}>
            {/* Scope Tube */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.024, 0.026, 0.28, 16]} />
              <meshStandardMaterial color="#0f1113" metalness={0.9} roughness={0.2} />
            </mesh>
            {/* Front Objective Lens */}
            <mesh position={[0, 0, -0.14]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.032, 0.024, 0.06, 16]} />
              <meshStandardMaterial color="#0284c7" emissive="#0369a1" emissiveIntensity={0.6} metalness={0.9} />
            </mesh>
            {/* Rear Ocular Lens */}
            <mesh position={[0, 0, 0.14]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.028, 0.025, 0.05, 16]} />
              <meshStandardMaterial color="#0284c7" emissive="#0369a1" emissiveIntensity={0.6} />
            </mesh>
            {/* Scope Mount Rings */}
            <mesh position={[0, -0.04, -0.06]}>
              <boxGeometry args={[0.03, 0.04, 0.03]} />
              <meshStandardMaterial color="#1c1e21" />
            </mesh>
            <mesh position={[0, -0.04, 0.06]}>
              <boxGeometry args={[0.03, 0.04, 0.03]} />
              <meshStandardMaterial color="#1c1e21" />
            </mesh>
          </group>

          {/* Bolt Handle */}
          <group ref={boltRef} position={[0.04, 0.03, 0.06]}>
            <mesh rotation={[0, 0, Math.PI / 3]}>
              <cylinderGeometry args={[0.006, 0.006, 0.06, 8]} />
              <meshStandardMaterial color="#1a1c1f" metalness={0.9} />
            </mesh>
            <mesh position={[0.03, 0.02, 0]}>
              <sphereGeometry args={[0.014, 8, 8]} />
              <meshStandardMaterial color="#0f1113" />
            </mesh>
          </group>

          {/* Box Mag (5 Rnds) */}
          <group ref={magRef} position={[0, -0.09, -0.04]}>
            <mesh>
              <boxGeometry args={[0.036, 0.12, 0.08]} />
              <meshStandardMaterial color="#141618" roughness={0.6} metalness={0.7} />
            </mesh>
          </group>

          {/* Ergonomic Sniper Stock with Adjustable Cheek Rest */}
          <mesh position={[0, 0, 0.38]}>
            <boxGeometry args={[0.048, 0.11, 0.28]} />
            <meshStandardMaterial color="#293327" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.06, 0.36]}>
            <boxGeometry args={[0.04, 0.03, 0.14]} />
            <meshStandardMaterial color="#141517" />
          </mesh>

          {/* Folded Bipod Under Barrel */}
          <mesh position={[0, -0.04, -0.42]} rotation={[0.2, 0, 0]}>
            <boxGeometry args={[0.04, 0.02, 0.16]} />
            <meshStandardMaterial color="#181a1d" metalness={0.8} />
          </mesh>

          {/* Arms */}
          <mesh position={[0.08, -0.15, 0.22]} rotation={[-0.4, 0.2, -0.1]}>
            <cylinderGeometry args={[0.06, 0.07, 0.28, 12]} />
            <meshStandardMaterial color="#2d3732" roughness={0.8} />
          </mesh>
          <mesh position={[-0.08, -0.09, -0.26]} rotation={[0.5, -0.3, 0.2]}>
            <cylinderGeometry args={[0.055, 0.065, 0.26, 12]} />
            <meshStandardMaterial color="#2d3732" roughness={0.8} />
          </mesh>

          {isShooting && (
            <group position={[0, 0.02, -1.05]}>
              <mesh>
                <sphereGeometry args={[0.13, 10, 10]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
              <pointLight color="#ff8800" intensity={8} distance={12} />
            </group>
          )}
        </group>
      )}

      {/* 4. MOSSBERG 590 TACTICAL SHOTGUN */}
      {weaponType === 'SHOTGUN' && (
        <group scale={[0.95, 0.95, 0.95]}>
          {/* Main Receiver */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.055, 0.085, 0.36]} />
            <meshStandardMaterial color="#1c1f22" roughness={0.3} metalness={0.85} />
          </mesh>
          {/* 12-Gauge Heavy Shotgun Barrel */}
          <mesh position={[0, 0.03, -0.46]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.6, 14]} />
            <meshStandardMaterial color="#111315" roughness={0.2} metalness={0.95} />
          </mesh>
          {/* Magazine Tube Under Barrel */}
          <mesh position={[0, -0.01, -0.42]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.016, 0.016, 0.54, 12]} />
            <meshStandardMaterial color="#181a1c" roughness={0.4} metalness={0.8} />
          </mesh>
          {/* Perforated Heat Shield */}
          <mesh position={[0, 0.038, -0.35]}>
            <boxGeometry args={[0.046, 0.04, 0.34]} />
            <meshStandardMaterial color="#141618" metalness={0.9} />
          </mesh>

          {/* Pump-Action Forend Slide */}
          <group ref={pumpRef} position={[0, -0.01, -0.36]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.025, 0.025, 0.16, 12]} />
              <meshStandardMaterial color="#2d2218" roughness={0.8} />
            </mesh>
          </group>

          {/* Pistol Grip & Stock */}
          <mesh position={[0, -0.08, 0.12]} rotation={[0.4, 0, 0]}>
            <boxGeometry args={[0.038, 0.11, 0.05]} />
            <meshStandardMaterial color="#18191c" />
          </mesh>
          <mesh position={[0, -0.02, 0.28]}>
            <boxGeometry args={[0.045, 0.11, 0.24]} />
            <meshStandardMaterial color="#24282c" roughness={0.6} />
          </mesh>

          {/* Ghost Ring Sight */}
          <mesh position={[0, 0.055, -0.74]}>
            <boxGeometry args={[0.006, 0.018, 0.01]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>

          {/* Arms */}
          <mesh position={[0.08, -0.14, 0.2]} rotation={[-0.4, 0.2, -0.1]}>
            <cylinderGeometry args={[0.06, 0.07, 0.28, 12]} />
            <meshStandardMaterial color="#2d3732" roughness={0.8} />
          </mesh>
          <mesh position={[-0.08, -0.08, -0.34]} rotation={[0.5, -0.3, 0.2]}>
            <cylinderGeometry args={[0.055, 0.065, 0.26, 12]} />
            <meshStandardMaterial color="#2d3732" roughness={0.8} />
          </mesh>

          {isShooting && (
            <group position={[0, 0.03, -0.78]}>
              <mesh>
                <sphereGeometry args={[0.14, 10, 10]} />
                <meshBasicMaterial color="#ff7700" />
              </mesh>
              <pointLight color="#ff8800" intensity={9} distance={10} />
            </group>
          )}
        </group>
      )}

      {/* 5. TACTICAL COMBAT KNIFE */}
      {weaponType === 'KNIFE' && (
        <group ref={knifeRef} scale={[1.1, 1.1, 1.1]}>
          {/* Grip Handle */}
          <mesh position={[0, -0.05, 0.05]} rotation={[-0.4, 0, 0]}>
            <boxGeometry args={[0.032, 0.13, 0.038]} />
            <meshStandardMaterial color="#181a1c" roughness={0.9} />
          </mesh>
          {/* Crossguard */}
          <mesh position={[0, 0.01, 0.02]} rotation={[-0.4, 0, 0]}>
            <boxGeometry args={[0.045, 0.012, 0.065]} />
            <meshStandardMaterial color="#2d3035" metalness={0.9} />
          </mesh>
          {/* Combat Tanto Serrated Steel Blade */}
          <mesh position={[0, 0.12, -0.03]} rotation={[-0.4, 0, 0]}>
            <boxGeometry args={[0.006, 0.22, 0.048]} />
            <meshStandardMaterial color="#555a60" roughness={0.2} metalness={0.95} />
          </mesh>
          {/* Blade Cutting Edge Razor Line */}
          <mesh position={[0, 0.12, -0.054]} rotation={[-0.4, 0, 0]}>
            <boxGeometry args={[0.002, 0.21, 0.004]} />
            <meshBasicMaterial color="#e2e8f0" />
          </mesh>

          {/* Right Hand Holding Knife */}
          <group position={[0.02, -0.05, 0.06]}>
            <mesh>
              <sphereGeometry args={[0.052, 12, 12]} />
              <meshStandardMaterial color="#c89678" roughness={0.6} />
            </mesh>
            <mesh position={[0.03, -0.14, 0.12]} rotation={[-0.5, 0.2, -0.2]}>
              <cylinderGeometry args={[0.055, 0.065, 0.26, 12]} />
              <meshStandardMaterial color="#2d3732" roughness={0.8} />
            </mesh>
          </group>
        </group>
      )}

      {/* 6. ICEWALL DEPLOYER */}
      {weaponType === 'ICEWALL' && (
        <group scale={[1, 1, 1]}>
          <mesh position={[0, -0.02, 0]} rotation={[0.4, 0, 0]}>
            <boxGeometry args={[0.16, 0.1, 0.03]} />
            <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.8} />
          </mesh>
          <mesh position={[0, 0.04, -0.02]}>
            <octahedronGeometry args={[0.04, 0]} />
            <meshStandardMaterial
              color="#38bdf8"
              emissive="#0284c7"
              emissiveIntensity={0.8}
              roughness={0.1}
              transparent
              opacity={0.9}
            />
          </mesh>
          <pointLight position={[0, 0.04, -0.02]} color="#38bdf8" intensity={2} distance={3} />
          <mesh position={[0.08, -0.06, 0.04]} rotation={[-0.3, 0.2, -0.2]}>
            <sphereGeometry args={[0.045, 10, 10]} />
            <meshStandardMaterial color="#c89678" roughness={0.6} />
          </mesh>
          <mesh position={[-0.08, -0.06, 0.04]} rotation={[-0.3, -0.2, 0.2]}>
            <sphereGeometry args={[0.045, 10, 10]} />
            <meshStandardMaterial color="#c89678" roughness={0.6} />
          </mesh>
        </group>
      )}

      {/* 7. MILITARY MEDKIT */}
      {weaponType === 'MEDKIT' && (
        <group scale={[1, 1, 1]}>
          <mesh position={[0, -0.03, 0]} rotation={[0.3, -0.2, 0]}>
            <boxGeometry args={[0.14, 0.11, 0.06]} />
            <meshStandardMaterial color="#14532d" roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.03, 0.032]} rotation={[0.3, -0.2, 0]}>
            <boxGeometry args={[0.05, 0.015, 0.005]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          <mesh position={[0, -0.03, 0.032]} rotation={[0.3, -0.2, 0]}>
            <boxGeometry args={[0.015, 0.05, 0.005]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          <mesh position={[0.07, -0.07, 0.05]}>
            <sphereGeometry args={[0.045, 10, 10]} />
            <meshStandardMaterial color="#c89678" roughness={0.6} />
          </mesh>
        </group>
      )}

      {/* 8. UNARMED (Bare Fists with Boxer Punch Combo Animation) */}
      {weaponType === 'UNARMED' && (
        <group scale={[1, 1, 1]}>
          {/* Left Fist */}
          <group ref={leftFistRef} position={[-0.14, -0.08, 0.08]}>
            {/* Gloved Hand */}
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.052, 12, 12]} />
              <meshStandardMaterial color="#2b2d30" roughness={0.7} />
            </mesh>
            {/* Glove Knuckle Guard */}
            <mesh position={[0, 0.01, -0.03]}>
              <boxGeometry args={[0.055, 0.02, 0.02]} />
              <meshStandardMaterial color="#111315" roughness={0.4} metalness={0.8} />
            </mesh>
            {/* Forearm */}
            <mesh position={[-0.03, -0.12, 0.12]} rotation={[-0.4, -0.2, 0.2]}>
              <cylinderGeometry args={[0.05, 0.06, 0.24, 10]} />
              <meshStandardMaterial color="#2d3732" roughness={0.8} />
            </mesh>
          </group>

          {/* Right Fist */}
          <group ref={rightFistRef} position={[0.14, -0.08, 0.08]}>
            {/* Gloved Hand */}
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.052, 12, 12]} />
              <meshStandardMaterial color="#2b2d30" roughness={0.7} />
            </mesh>
            {/* Glove Knuckle Guard */}
            <mesh position={[0, 0.01, -0.03]}>
              <boxGeometry args={[0.055, 0.02, 0.02]} />
              <meshStandardMaterial color="#111315" roughness={0.4} metalness={0.8} />
            </mesh>
            {/* Forearm */}
            <mesh position={[0.03, -0.12, 0.12]} rotation={[-0.4, 0.2, -0.2]}>
              <cylinderGeometry args={[0.05, 0.06, 0.24, 10]} />
              <meshStandardMaterial color="#2d3732" roughness={0.8} />
            </mesh>
          </group>
        </group>
      )}
    </group>
  );
}
