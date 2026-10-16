'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WeaponType } from '@/types/game';

interface SurvivorAvatarProps {
  currentWeapon: WeaponType;
  isShooting: boolean;
  isMoving: boolean;
  isSprinting?: boolean;
  isReloading?: boolean;
  isPunching?: boolean;
  isSlashing?: boolean;
  isDead?: boolean;
}

export function SurvivorAvatar({
  currentWeapon,
  isShooting,
  isMoving,
  isSprinting = false,
  isReloading = false,
  isPunching = false,
  isSlashing = false,
  isDead = false,
}: SurvivorAvatarProps) {
  const rootGroupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // 1. DEATH RAGDOLL COLLAPSE ANIMATION
    if (rootGroupRef.current) {
      if (isDead) {
        // Fall flat backward onto the ground with slump
        rootGroupRef.current.position.y = THREE.MathUtils.lerp(rootGroupRef.current.position.y, 0.16, delta * 8);
        rootGroupRef.current.position.z = THREE.MathUtils.lerp(rootGroupRef.current.position.z, -0.6, delta * 8);
        rootGroupRef.current.rotation.x = THREE.MathUtils.lerp(rootGroupRef.current.rotation.x, -Math.PI / 2 + 0.08, delta * 8);
        rootGroupRef.current.rotation.z = THREE.MathUtils.lerp(rootGroupRef.current.rotation.z, 0.2, delta * 8);
        return; // Halt limb walking cycles when dead
      } else {
        rootGroupRef.current.position.y = THREE.MathUtils.lerp(rootGroupRef.current.position.y, 0, delta * 12);
        rootGroupRef.current.position.z = THREE.MathUtils.lerp(rootGroupRef.current.position.z, 0, delta * 12);
        rootGroupRef.current.rotation.x = THREE.MathUtils.lerp(rootGroupRef.current.rotation.x, 0, delta * 12);
        rootGroupRef.current.rotation.z = THREE.MathUtils.lerp(rootGroupRef.current.rotation.z, 0, delta * 12);
      }
    }

    // 2. WALKING & SPRINTING LEG / BODY ANIMATIONS
    if (leftLegRef.current && rightLegRef.current && torsoRef.current) {
      if (isMoving) {
        const cycleSpeed = isSprinting ? 14 : 7;
        const strideAngle = isSprinting ? 0.65 : 0.4;

        leftLegRef.current.rotation.x = Math.sin(time * cycleSpeed) * strideAngle;
        rightLegRef.current.rotation.x = -Math.sin(time * cycleSpeed) * strideAngle;

        // Torso forward lean when sprinting
        const targetTorsoPitch = isSprinting ? 0.26 : 0.08;
        torsoRef.current.rotation.x = THREE.MathUtils.lerp(torsoRef.current.rotation.x, targetTorsoPitch, delta * 10);
      } else {
        leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, delta * 12);
        rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, delta * 12);
        torsoRef.current.rotation.x = THREE.MathUtils.lerp(torsoRef.current.rotation.x, 0, delta * 12);
      }
    }

    // 3. ARM ANIMATIONS (Aiming, Reloading, Punching, Knife Slashing)
    if (rightArmRef.current && leftArmRef.current) {
      let rPitch = Math.PI / 3;
      let rYaw = 0;
      let rRoll = -0.2;

      let lPitch = Math.PI / 2.5;
      let lYaw = 0;
      let lRoll = 0.35;

      if (isReloading) {
        // Arms lower towards chest/pouches
        rPitch = Math.PI / 5;
        lPitch = Math.PI / 6;
      } else if (isPunching) {
        // Violent right punch jab extension
        rPitch = Math.PI / 2.2;
        rYaw = -0.3;
        rRoll = 0;
      } else if (isSlashing) {
        // Knife slash swing sweep
        rPitch = Math.PI / 2.1;
        rYaw = Math.sin(time * 20) * 0.7;
      } else if (isMoving && isSprinting) {
        // Arm pump during sprint
        rPitch += Math.sin(time * 14) * 0.3;
        lPitch -= Math.sin(time * 14) * 0.3;
      }

      rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, rPitch, delta * 14);
      rightArmRef.current.rotation.y = THREE.MathUtils.lerp(rightArmRef.current.rotation.y, rYaw, delta * 14);
      rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, rRoll, delta * 14);

      leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, lPitch, delta * 14);
      leftArmRef.current.rotation.y = THREE.MathUtils.lerp(leftArmRef.current.rotation.y, lYaw, delta * 14);
      leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, lRoll, delta * 14);
    }
  });

  return (
    <group ref={rootGroupRef} position={[0, 0, 0]}>
      {/* Torso & Upper Body Group */}
      <group ref={torsoRef} position={[0, 1.25, 0]}>
        {/* Torso & Tactical Jacket */}
        <mesh castShadow>
          <boxGeometry args={[0.55, 0.75, 0.35]} />
          <meshStandardMaterial color="#474e49" roughness={0.8} />
        </mesh>

        {/* Head */}
        <mesh position={[0, 0.57, 0]} castShadow>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color="#d4a373" roughness={0.6} />
        </mesh>

        {/* Military Combat Helmet */}
        <mesh position={[0, 0.68, 0]}>
          <sphereGeometry args={[0.22, 16, 16, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
          <meshStandardMaterial color="#8a7c5c" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.18, 0.015, 8, 16]} />
          <meshStandardMaterial color="#2d2d2d" />
        </mesh>

        {/* Tactical Survivor Backpack */}
        <group position={[0, 0.05, -0.22]}>
          <mesh castShadow>
            <boxGeometry args={[0.42, 0.55, 0.22]} />
            <meshStandardMaterial color="#8d8768" roughness={0.85} />
          </mesh>
          <mesh position={[0, -0.08, -0.06]}>
            <boxGeometry args={[0.34, 0.28, 0.1]} />
            <meshStandardMaterial color="#757053" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.32, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.07, 0.07, 0.44, 12]} />
            <meshStandardMaterial color="#3d4035" roughness={0.8} />
          </mesh>
        </group>

        {/* Right Arm Holding Weapon */}
        <group ref={rightArmRef} position={[0.28, 0, 0.15]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.075, 0.085, 0.55, 12]} />
            <meshStandardMaterial color="#474e49" roughness={0.8} />
          </mesh>

          {/* Held Weapon Mesh */}
          {currentWeapon !== 'UNARMED' && (
            <group position={[0, -0.28, 0.25]}>
              {/* Pistol */}
              {currentWeapon === 'PISTOL' && (
                <mesh rotation={[-Math.PI / 4, 0, 0]}>
                  <boxGeometry args={[0.045, 0.08, 0.22]} />
                  <meshStandardMaterial color="#1f2327" metalness={0.9} />
                </mesh>
              )}

              {/* M4A1 Rifle */}
              {currentWeapon === 'RIFLE' && (
                <mesh rotation={[-Math.PI / 4, 0, 0]}>
                  <boxGeometry args={[0.055, 0.09, 0.55]} />
                  <meshStandardMaterial color="#1f2327" metalness={0.9} />
                </mesh>
              )}

              {/* AWM Sniper Rifle */}
              {currentWeapon === 'SNIPER' && (
                <group rotation={[-Math.PI / 4, 0, 0]}>
                  <mesh>
                    <boxGeometry args={[0.058, 0.09, 0.78]} />
                    <meshStandardMaterial color="#293327" roughness={0.6} metalness={0.5} />
                  </mesh>
                  {/* Optical Scope on Top */}
                  <mesh position={[0, 0.08, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.024, 0.024, 0.24, 10]} />
                    <meshStandardMaterial color="#111315" metalness={0.9} />
                  </mesh>
                </group>
              )}

              {/* Mossberg Shotgun */}
              {currentWeapon === 'SHOTGUN' && (
                <mesh rotation={[-Math.PI / 4, 0, 0]}>
                  <boxGeometry args={[0.055, 0.09, 0.62]} />
                  <meshStandardMaterial color="#2d2218" roughness={0.7} metalness={0.4} />
                </mesh>
              )}

              {/* Tactical Combat Knife */}
              {currentWeapon === 'KNIFE' && (
                <group rotation={[-Math.PI / 2, 0, 0]}>
                  <mesh position={[0, 0.08, 0]}>
                    <boxGeometry args={[0.008, 0.22, 0.045]} />
                    <meshStandardMaterial color="#718096" metalness={0.9} roughness={0.2} />
                  </mesh>
                  <mesh position={[0, -0.05, 0]}>
                    <boxGeometry args={[0.03, 0.12, 0.035]} />
                    <meshStandardMaterial color="#1a202c" />
                  </mesh>
                </group>
              )}

              {/* IceWall */}
              {currentWeapon === 'ICEWALL' && (
                <mesh>
                  <boxGeometry args={[0.15, 0.08, 0.02]} />
                  <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.6} />
                </mesh>
              )}

              {/* Medkit */}
              {currentWeapon === 'MEDKIT' && (
                <mesh>
                  <boxGeometry args={[0.14, 0.1, 0.06]} />
                  <meshStandardMaterial color="#14532d" />
                </mesh>
              )}

              {/* Muzzle Flash when shooting */}
              {isShooting && (currentWeapon === 'RIFLE' || currentWeapon === 'PISTOL' || currentWeapon === 'SNIPER' || currentWeapon === 'SHOTGUN') && (
                <pointLight position={[0, 0, 0.45]} color="#ff9900" intensity={5} distance={6} />
              )}
            </group>
          )}
        </group>

        {/* Left Arm on Forend */}
        <group ref={leftArmRef} position={[-0.24, -0.05, 0.25]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.075, 0.08, 0.5, 12]} />
            <meshStandardMaterial color="#474e49" roughness={0.8} />
          </mesh>
        </group>
      </group>

      {/* Left Leg */}
      <group ref={leftLegRef} position={[-0.15, 0.85, 0]}>
        <mesh position={[0, -0.4, 0]} castShadow>
          <boxGeometry args={[0.2, 0.85, 0.22]} />
          <meshStandardMaterial color="#1a1c1e" roughness={0.8} />
        </mesh>
        <mesh position={[-0.11, -0.4, 0]}>
          <boxGeometry args={[0.01, 0.8, 0.04]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, -0.8, 0.04]}>
          <boxGeometry args={[0.22, 0.12, 0.28]} />
          <meshStandardMaterial color="#111" roughness={0.9} />
        </mesh>
      </group>

      {/* Right Leg */}
      <group ref={rightLegRef} position={[0.15, 0.85, 0]}>
        <mesh position={[0, -0.4, 0]} castShadow>
          <boxGeometry args={[0.2, 0.85, 0.22]} />
          <meshStandardMaterial color="#1a1c1e" roughness={0.8} />
        </mesh>
        <mesh position={[0.11, -0.4, 0]}>
          <boxGeometry args={[0.01, 0.8, 0.04]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, -0.8, 0.04]}>
          <boxGeometry args={[0.22, 0.12, 0.28]} />
          <meshStandardMaterial color="#111" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}
