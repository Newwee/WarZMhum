'use client';

import React from 'react';

interface SurvivorAvatarProps {
  currentWeapon: 'RIFLE' | 'PISTOL';
  isShooting: boolean;
  isMoving: boolean;
}

export function SurvivorAvatar({ currentWeapon, isShooting, isMoving }: SurvivorAvatarProps) {
  return (
    <group position={[0, 0, 0]}>
      {/* Head */}
      <mesh position={[0, 1.82, 0]} castShadow>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#d4a373" roughness={0.6} />
      </mesh>

      {/* Military Combat Helmet (WarZ Style - Image 2) */}
      <mesh position={[0, 1.93, 0]}>
        <sphereGeometry args={[0.22, 16, 16, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
        <meshStandardMaterial color="#8a7c5c" roughness={0.7} />
      </mesh>
      {/* Helmet Strap */}
      <mesh position={[0, 1.75, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.18, 0.015, 8, 16]} />
        <meshStandardMaterial color="#2d2d2d" />
      </mesh>

      {/* Torso & Survivor Hoodie / Jacket */}
      <mesh position={[0, 1.25, 0]} castShadow>
        <boxGeometry args={[0.55, 0.75, 0.35]} />
        <meshStandardMaterial color="#6b6e70" roughness={0.8} />
      </mesh>

      {/* Tactical Survivor Backpack (WarZ Style - Image 2 & 3) */}
      <group position={[0, 1.3, -0.22]}>
        <mesh castShadow>
          <boxGeometry args={[0.42, 0.55, 0.22]} />
          <meshStandardMaterial color="#8d8768" roughness={0.85} />
        </mesh>
        {/* Backpack Pocket */}
        <mesh position={[0, -0.08, -0.06]}>
          <boxGeometry args={[0.34, 0.28, 0.1]} />
          <meshStandardMaterial color="#757053" roughness={0.9} />
        </mesh>
        {/* Bedroll / Straps on top */}
        <mesh position={[0, 0.32, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.07, 0.44, 12]} />
          <meshStandardMaterial color="#3d4035" roughness={0.8} />
        </mesh>
      </group>

      {/* Arms Holding Gun */}
      <group position={[0.28, 1.25, 0.15]} rotation={[Math.PI / 3, 0, -0.2]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.075, 0.085, 0.55, 12]} />
          <meshStandardMaterial color="#6b6e70" roughness={0.8} />
        </mesh>
      </group>
      <group position={[-0.24, 1.2, 0.25]} rotation={[Math.PI / 2.5, 0, 0.35]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.075, 0.08, 0.5, 12]} />
          <meshStandardMaterial color="#6b6e70" roughness={0.8} />
        </mesh>
      </group>

      {/* Gun in Hands */}
      <group position={[0.18, 1.2, 0.45]}>
        {currentWeapon === 'PISTOL' ? (
          <mesh>
            <boxGeometry args={[0.05, 0.09, 0.24]} />
            <meshStandardMaterial color="#1f2327" metalness={0.9} />
          </mesh>
        ) : (
          <mesh>
            <boxGeometry args={[0.06, 0.1, 0.55]} />
            <meshStandardMaterial color="#1f2327" metalness={0.9} />
          </mesh>
        )}
        {isShooting && (
          <pointLight position={[0, 0, 0.4]} color="#ff9900" intensity={4} distance={5} />
        )}
      </group>

      {/* Tactical Track Pants with Side Stripe (WarZ Image 2) */}
      <mesh position={[-0.15, 0.45, 0]} castShadow>
        <boxGeometry args={[0.2, 0.85, 0.22]} />
        <meshStandardMaterial color="#1a1c1e" roughness={0.8} />
      </mesh>
      <mesh position={[0.15, 0.45, 0]} castShadow>
        <boxGeometry args={[0.2, 0.85, 0.22]} />
        <meshStandardMaterial color="#1a1c1e" roughness={0.8} />
      </mesh>
      {/* White Stripes on Pants */}
      <mesh position={[-0.26, 0.45, 0]}>
        <boxGeometry args={[0.01, 0.8, 0.04]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.26, 0.45, 0]}>
        <boxGeometry args={[0.01, 0.8, 0.04]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Combat Boots */}
      <mesh position={[-0.15, 0.05, 0.04]}>
        <boxGeometry args={[0.22, 0.12, 0.28]} />
        <meshStandardMaterial color="#111" roughness={0.9} />
      </mesh>
      <mesh position={[0.15, 0.05, 0.04]}>
        <boxGeometry args={[0.22, 0.12, 0.28]} />
        <meshStandardMaterial color="#111" roughness={0.9} />
      </mesh>
    </group>
  );
}
