'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';

// Procedural Military Humvee (WarZ Image 2)
function Humvee({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={[1.2, 1.2, 1.2]}>
      {/* Humvee Main Body (Desert Tan #b5a478) */}
      <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.9, 4.4]} />
        <meshStandardMaterial color="#ab9a70" roughness={0.7} />
      </mesh>

      {/* Slanted Roof Cabin */}
      <mesh position={[0, 1.6, -0.2]} castShadow receiveShadow>
        <boxGeometry args={[1.9, 0.7, 2.6]} />
        <meshStandardMaterial color="#9e8d64" roughness={0.7} />
      </mesh>

      {/* Windshield */}
      <mesh position={[0, 1.55, 1.15]} rotation={[-0.35, 0, 0]}>
        <boxGeometry args={[1.8, 0.55, 0.05]} />
        <meshStandardMaterial color="#1f2421" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* Front Bull Bar / Grille */}
      <mesh position={[0, 0.8, 2.25]}>
        <boxGeometry args={[1.8, 0.6, 0.15]} />
        <meshStandardMaterial color="#1a1c1a" roughness={0.5} metalness={0.8} />
      </mesh>

      {/* Chunky Off-road Wheels */}
      {[
        [-1.15, 0.5, 1.4],
        [1.15, 0.5, 1.4],
        [-1.15, 0.5, -1.4],
        [1.15, 0.5, -1.4],
      ].map(([wx, wy, wz], i) => (
        <group key={i} position={[wx, wy, wz]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.5, 0.5, 0.42, 16]} />
            <meshStandardMaterial color="#181a18" roughness={0.9} />
          </mesh>
          <mesh>
            <cylinderGeometry args={[0.26, 0.26, 0.44, 8]} />
            <meshStandardMaterial color="#3a3d3a" metalness={0.6} />
          </mesh>
        </group>
      ))}

      {/* Roof Mounted Hatch / Turret Base */}
      <mesh position={[0, 2.05, -0.2]}>
        <cylinderGeometry args={[0.45, 0.45, 0.25, 16]} />
        <meshStandardMaterial color="#1f231f" metalness={0.7} />
      </mesh>
    </group>
  );
}

// Procedural Pine Tree (WarZ Image 1 & 3)
function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Trunk */}
      <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.25, 0.4, 5, 8]} />
        <meshStandardMaterial color="#402d1d" roughness={0.9} />
      </mesh>
      {/* Foliage Layers */}
      <mesh position={[0, 4.5, 0]} castShadow>
        <coneGeometry args={[2.2, 3.5, 7]} />
        <meshStandardMaterial color="#223b28" roughness={0.8} />
      </mesh>
      <mesh position={[0, 6.2, 0]} castShadow>
        <coneGeometry args={[1.7, 3, 7]} />
        <meshStandardMaterial color="#2d4a34" roughness={0.8} />
      </mesh>
      <mesh position={[0, 7.6, 0]} castShadow>
        <coneGeometry args={[1.2, 2.4, 7]} />
        <meshStandardMaterial color="#385940" roughness={0.8} />
      </mesh>
    </group>
  );
}

export function Scene() {
  // Trees scattered along wilderness perimeter
  const trees = useMemo(() => {
    const list: Array<{ x: number; z: number; scale: number }> = [];
    for (let i = 0; i < 28; i++) {
      const angle = (i / 28) * Math.PI * 2;
      const dist = 28 + (i % 5) * 4;
      list.push({
        x: Math.cos(angle) * dist + (Math.sin(i * 3) * 4),
        z: Math.sin(angle) * dist + (Math.cos(i * 2) * 4),
        scale: 0.8 + (i % 4) * 0.25,
      });
    }
    return list;
  }, []);

  return (
    <>
      {/* Golden Hour / Twilight Sky & Atmospheric Fog (WarZ Image 1) */}
      <color attach="background" args={['#1c1815']} />
      <fog attach="fog" args={['#241f1a', 15, 70]} />

      {/* Atmospheric ambient fill */}
      <ambientLight intensity={0.4} color="#f5d0a6" />

      {/* Low Golden Hour Sun (Image 1) */}
      <directionalLight
        position={[45, 28, -35]}
        intensity={1.2}
        color="#ffaa55"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />

      {/* Visible Sun Disk in Sky */}
      <mesh position={[120, 65, -90]}>
        <sphereGeometry args={[8, 16, 16]} />
        <meshBasicMaterial color="#ffe8aa" />
      </mesh>

      {/* Main Ground: Weathered Airfield Tarmac & Dirt (WarZ Image 2) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[160, 160]} />
        <meshStandardMaterial color="#2d2b27" roughness={0.85} metalness={0.15} />
      </mesh>

      {/* Tarmac Runway Markings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[18, 90]} />
        <meshStandardMaterial color="#35332f" roughness={0.8} />
      </mesh>
      {/* Yellow Centerline */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <planeGeometry args={[0.4, 70]} />
        <meshStandardMaterial color="#eab308" roughness={0.6} />
      </mesh>

      {/* Abandoned Military Humvees (Image 2) */}
      <Humvee position={[-8, 0, -6]} rotation={0.4} />
      <Humvee position={[14, 0, 12]} rotation={-1.8} />

      {/* Military Outpost Sandbags & Crates */}
      <group position={[4, 0, -4]}>
        <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
          <boxGeometry args={[4, 0.8, 0.8]} />
          <meshStandardMaterial color="#8a7c5c" roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 0.6, 0.7]} />
          <meshStandardMaterial color="#8a7c5c" roughness={0.9} />
        </mesh>
      </group>

      {/* Desert Trees & Shrubs */}
      {trees.map((t, idx) => (
        <Tree key={idx} position={[t.x, 0, t.z]} scale={t.scale} />
      ))}
    </>
  );
}
