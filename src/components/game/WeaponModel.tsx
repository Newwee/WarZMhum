'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { WeaponType } from '@/types/game';

interface WeaponModelProps {
  weaponType: WeaponType;
  isADS: boolean;
  isShooting: boolean;
  recoil: number;
  bobOffset: number;
}

export function WeaponModel({ weaponType, isADS, isShooting, recoil, bobOffset }: WeaponModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const slideRef = useRef<THREE.Group>(null);
  const muzzleFlashRef = useRef<THREE.PointLight>(null);

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
    } else if (weaponType === 'ICEWALL') {
      return new THREE.Vector3(0.18, -0.22, -0.38);
    } else if (weaponType === 'MEDKIT') {
      return new THREE.Vector3(0.16, -0.2, -0.36);
    } else {
      // UNARMED (Fists)
      return new THREE.Vector3(0, -0.24, -0.35);
    }
  }, [isADS, weaponType]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Smooth ADS transition
    const lerpSpeed = isADS ? 20 : 14;
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetPos.x, delta * lerpSpeed);
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      targetPos.y + (isADS ? 0 : Math.sin(bobOffset) * 0.02),
      delta * lerpSpeed
    );
    groupRef.current.position.z = THREE.MathUtils.lerp(
      groupRef.current.position.z,
      targetPos.z + recoil * 0.5,
      delta * 24
    );

    // Recoil upward pitch
    const targetPitch = recoil * (weaponType === 'PISTOL' ? 1.4 : 0.9);
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -targetPitch, delta * 26);

    // Slide kickback on pistol
    if (slideRef.current) {
      slideRef.current.position.z = THREE.MathUtils.lerp(slideRef.current.position.z, recoil * 0.45, delta * 32);
    }
  });

  return (
    <group ref={groupRef} position={[targetPos.x, targetPos.y, targetPos.z]}>
      {/* 1. .45 THUNDER PISTOL / REVOLVER (Matching WarZ Image 1) */}
      {weaponType === 'PISTOL' && (
        <group scale={[1.15, 1.15, 1.15]}>
          {/* Gun Frame & Receiver */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.045, 0.08, 0.22]} />
            <meshStandardMaterial color="#22252a" roughness={0.3} metalness={0.85} />
          </mesh>

          {/* Grip / Handle */}
          <mesh position={[0, -0.09, 0.06]} rotation={[0.3, 0, 0]}>
            <boxGeometry args={[0.04, 0.12, 0.05]} />
            <meshStandardMaterial color="#3d2817" roughness={0.7} />
          </mesh>

          {/* Trigger & Guard */}
          <mesh position={[0, -0.05, 0.02]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.02, 0.004, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#1a1c20" metalness={0.9} />
          </mesh>

          {/* Slide with Ejection Port */}
          <group ref={slideRef} position={[0, 0.045, -0.02]}>
            <mesh>
              <boxGeometry args={[0.044, 0.045, 0.26]} />
              <meshStandardMaterial color="#181a1d" roughness={0.25} metalness={0.9} />
            </mesh>
            {/* Front & Rear Iron Sights */}
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

          {/* Heavy Barrel */}
          <mesh position={[0, 0.035, -0.16]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.016, 0.016, 0.12, 12]} />
            <meshStandardMaterial color="#111315" roughness={0.2} metalness={0.95} />
          </mesh>

          {/* Survivor Hands holding gun (WarZ style - Image 1) */}
          <group position={[0.02, -0.1, 0.08]}>
            {/* Right Hand */}
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.055, 12, 12]} />
              <meshStandardMaterial color="#c89678" roughness={0.6} />
            </mesh>
            {/* Forearm Sleeve */}
            <mesh position={[0.04, -0.14, 0.14]} rotation={[-0.5, 0.2, -0.2]}>
              <cylinderGeometry args={[0.055, 0.065, 0.26, 12]} />
              <meshStandardMaterial color="#2d3732" roughness={0.8} />
            </mesh>
          </group>

          {/* Muzzle Flash */}
          {isShooting && (
            <group position={[0, 0.035, -0.26]}>
              <mesh>
                <sphereGeometry args={[0.08, 8, 8]} />
                <meshBasicMaterial color="#ffaa00" />
              </mesh>
              <pointLight ref={muzzleFlashRef} color="#ff9900" intensity={5} distance={7} />
            </group>
          )}
        </group>
      )}

      {/* 2. M4A1 ASSAULT RIFLE */}
      {weaponType === 'RIFLE' && (
        <group scale={[0.95, 0.95, 0.95]}>
          {/* Main Receiver */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.055, 0.09, 0.42]} />
            <meshStandardMaterial color="#25282c" roughness={0.4} metalness={0.8} />
          </mesh>

          {/* Tactical Handguard / Rail */}
          <mesh position={[0, 0.01, -0.28]}>
            <boxGeometry args={[0.05, 0.075, 0.24]} />
            <meshStandardMaterial color="#1c1e21" roughness={0.5} metalness={0.7} />
          </mesh>

          {/* Long Barrel & Flash Hider */}
          <mesh position={[0, 0.015, -0.46]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.014, 0.014, 0.22, 12]} />
            <meshStandardMaterial color="#0f1113" roughness={0.2} metalness={0.95} />
          </mesh>

          {/* Banana Magazine (30 Rounds) */}
          <mesh position={[0, -0.12, -0.05]} rotation={[-0.2, 0, 0]}>
            <boxGeometry args={[0.038, 0.16, 0.07]} />
            <meshStandardMaterial color="#181a1c" roughness={0.6} metalness={0.6} />
          </mesh>

          {/* Pistol Grip */}
          <mesh position={[0, -0.1, 0.12]} rotation={[0.4, 0, 0]}>
            <boxGeometry args={[0.038, 0.12, 0.05]} />
            <meshStandardMaterial color="#141517" roughness={0.8} />
          </mesh>

          {/* Tactical Stock */}
          <mesh position={[0, 0.01, 0.28]}>
            <boxGeometry args={[0.045, 0.1, 0.2]} />
            <meshStandardMaterial color="#202326" roughness={0.6} metalness={0.5} />
          </mesh>

          {/* Iron Sights */}
          <mesh position={[0, 0.055, -0.38]}>
            <boxGeometry args={[0.006, 0.02, 0.01]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          <mesh position={[0, 0.06, 0.16]}>
            <boxGeometry args={[0.03, 0.018, 0.015]} />
            <meshStandardMaterial color="#1a1c1e" />
          </mesh>

          {/* Survivor Arms */}
          <group>
            {/* Right Arm */}
            <mesh position={[0.08, -0.14, 0.2]} rotation={[-0.4, 0.2, -0.1]}>
              <cylinderGeometry args={[0.06, 0.07, 0.28, 12]} />
              <meshStandardMaterial color="#2d3732" roughness={0.8} />
            </mesh>
            {/* Left Arm on Handguard */}
            <mesh position={[-0.08, -0.08, -0.22]} rotation={[0.5, -0.3, 0.2]}>
              <cylinderGeometry args={[0.055, 0.065, 0.26, 12]} />
              <meshStandardMaterial color="#2d3732" roughness={0.8} />
            </mesh>
          </group>

          {/* Muzzle Flash */}
          {isShooting && (
            <group position={[0, 0.015, -0.58]}>
              <mesh>
                <sphereGeometry args={[0.09, 8, 8]} />
                <meshBasicMaterial color="#ffbb22" />
              </mesh>
              <pointLight ref={muzzleFlashRef} color="#ff9900" intensity={6} distance={8} />
            </group>
          )}
        </group>
      )}

      {/* 3. ICEWALL DEPLOYER (Crystalline tactical beacon device) */}
      {weaponType === 'ICEWALL' && (
        <group scale={[1, 1, 1]} position={[0, 0, 0]}>
          {/* Tactical Tablet / Controller Body */}
          <mesh position={[0, -0.02, 0]} rotation={[0.4, 0, 0]}>
            <boxGeometry args={[0.16, 0.1, 0.03]} />
            <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.8} />
          </mesh>

          {/* Glowing Ice Crystal Core */}
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

          {/* Survivor Hands holding deployer */}
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

      {/* 4. MILITARY MEDKIT (Auto-injector / Trauma kit) */}
      {weaponType === 'MEDKIT' && (
        <group scale={[1, 1, 1]}>
          {/* Medkit Case */}
          <mesh position={[0, -0.03, 0]} rotation={[0.3, -0.2, 0]}>
            <boxGeometry args={[0.14, 0.11, 0.06]} />
            <meshStandardMaterial color="#14532d" roughness={0.5} />
          </mesh>
          {/* Red Cross Symbol */}
          <mesh position={[0, -0.03, 0.032]} rotation={[0.3, -0.2, 0]}>
            <boxGeometry args={[0.05, 0.015, 0.005]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          <mesh position={[0, -0.03, 0.032]} rotation={[0.3, -0.2, 0]}>
            <boxGeometry args={[0.015, 0.05, 0.005]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          {/* Hands holding kit */}
          <mesh position={[0.07, -0.07, 0.05]}>
            <sphereGeometry args={[0.045, 10, 10]} />
            <meshStandardMaterial color="#c89678" roughness={0.6} />
          </mesh>
        </group>
      )}

      {/* 5. UNARMED (Bare survivor fists held in guard stance) */}
      {weaponType === 'UNARMED' && (
        <group scale={[1, 1, 1]}>
          {/* Left Fist */}
          <group position={[-0.14, -0.08, 0.08]}>
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.05, 12, 12]} />
              <meshStandardMaterial color="#c89678" roughness={0.6} />
            </mesh>
            <mesh position={[-0.03, -0.12, 0.12]} rotation={[-0.4, -0.2, 0.2]}>
              <cylinderGeometry args={[0.05, 0.06, 0.24, 10]} />
              <meshStandardMaterial color="#2d3732" roughness={0.8} />
            </mesh>
          </group>

          {/* Right Fist */}
          <group position={[0.14, -0.08, 0.08]}>
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.05, 12, 12]} />
              <meshStandardMaterial color="#c89678" roughness={0.6} />
            </mesh>
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
