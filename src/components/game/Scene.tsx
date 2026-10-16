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

// Tactical Shipping Container
function Container({ position, rotation = 0, color = '#7f2420' }: { position: [number, number, number]; rotation?: number; color?: string }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 2.8, 6.2]} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0.35} />
      </mesh>
    </group>
  );
}

// Abandoned Airfield Hangar / Warehouse
function Warehouse({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Main Structure */}
      <mesh position={[0, 4.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[18, 9, 26]} />
        <meshStandardMaterial color="#292c2b" roughness={0.85} metalness={0.2} />
      </mesh>
      {/* Curved Corrugated Roof Top */}
      <mesh position={[0, 9.4, 0]} castShadow>
        <boxGeometry args={[18.6, 1.0, 26.6]} />
        <meshStandardMaterial color="#1e2120" roughness={0.7} />
      </mesh>
      {/* Large Open Doorway */}
      <mesh position={[0, 3, 13.1]}>
        <boxGeometry args={[6.5, 6, 0.2]} />
        <meshBasicMaterial color="#0a0c0b" />
      </mesh>
    </group>
  );
}

// High-Visibility Green Extraction Zone Flare & Landing Pad
function ExtractionZoneMarker({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Green Landing Ring on ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <ringGeometry args={[7.2, 8.0, 32]} />
        <meshBasicMaterial color="#10b981" />
      </mesh>
      {/* Inner Helipad H */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]}>
        <planeGeometry args={[1.2, 6.0]} />
        <meshBasicMaterial color="#10b981" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]}>
        <planeGeometry args={[4.5, 1.2]} />
        <meshBasicMaterial color="#10b981" />
      </mesh>
      {/* Rising Green Smoke / Beacon Pillar */}
      <mesh position={[0, 16, 0]}>
        <cylinderGeometry args={[0.35, 3.2, 32, 16]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.32} />
      </mesh>
      {/* Intense Glowing Green Point Light */}
      <pointLight position={[0, 3, 0]} color="#10b981" intensity={4} distance={35} />
    </group>
  );
}

export function Scene() {
  // Trees scattered across large wilderness (radius 40m - 138m)
  const trees = useMemo(() => {
    const list: Array<{ x: number; z: number; scale: number }> = [];
    for (let i = 0; i < 75; i++) {
      const angle = (i / 75) * Math.PI * 2;
      const dist = 45 + (i % 8) * 11;
      list.push({
        x: Math.cos(angle) * dist + (Math.sin(i * 3.7) * 8),
        z: Math.sin(angle) * dist + (Math.cos(i * 2.9) * 8),
        scale: 0.9 + (i % 4) * 0.3,
      });
    }
    return list;
  }, []);

  return (
    <>
      {/* Golden Hour / Twilight Sky & Expanded Atmospheric Fog */}
      <color attach="background" args={['#1c1815']} />
      <fog attach="fog" args={['#241f1a', 25, 180]} />

      {/* Atmospheric ambient fill */}
      <ambientLight intensity={0.42} color="#f5d0a6" />

      {/* Low Golden Hour Sun */}
      <directionalLight
        position={[80, 45, -60]}
        intensity={1.3}
        color="#ffaa55"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />

      {/* Sun Disk in Sky */}
      <mesh position={[180, 85, -140]}>
        <sphereGeometry args={[12, 16, 16]} />
        <meshBasicMaterial color="#ffe8aa" />
      </mesh>

      {/* 3x Enlarged Main Ground (320m x 320m) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[320, 320]} />
        <meshStandardMaterial color="#2d2b27" roughness={0.85} metalness={0.15} />
      </mesh>

      {/* Extended Tarmac Runway Markings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[26, 180]} />
        <meshStandardMaterial color="#35332f" roughness={0.8} />
      </mesh>
      {/* Yellow Centerline */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <planeGeometry args={[0.5, 160]} />
        <meshStandardMaterial color="#eab308" roughness={0.6} />
      </mesh>

      {/* Abandoned Military Humvees */}
      <Humvee position={[-12, 0, -8]} rotation={0.4} />
      <Humvee position={[24, 0, 18]} rotation={-1.8} />
      <Humvee position={[-38, 0, 42]} rotation={1.2} />
      <Humvee position={[55, 0, -45]} rotation={-0.7} />

      {/* Abandoned Warehouses */}
      <Warehouse position={[-50, 0, -35]} rotation={0.25} />
      <Warehouse position={[52, 0, 45]} rotation={-1.3} />

      {/* Tactical Shipping Containers (Tactical maze cover) */}
      <Container position={[-20, 0, 15]} rotation={0.1} color="#8a2724" />
      <Container position={[-20, 0, 22]} rotation={-0.2} color="#2b4c7e" />
      <Container position={[-20, 2.8, 18]} rotation={0.05} color="#45543d" />
      <Container position={[18, 0, -25]} rotation={1.6} color="#2b4c7e" />
      <Container position={[26, 0, -25]} rotation={1.5} color="#8a2724" />
      <Container position={[35, 0, 5]} rotation={0.8} color="#45543d" />

      {/* Military Outpost Sandbags & Fortifications */}
      <group position={[6, 0, -6]}>
        <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.5, 0.8, 0.8]} />
          <meshStandardMaterial color="#8a7c5c" roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.6, 0.6, 0.7]} />
          <meshStandardMaterial color="#8a7c5c" roughness={0.9} />
        </mesh>
      </group>

      {/* Extraction Zone Beacon (North-East: [95, 0, 95]) */}
      <ExtractionZoneMarker position={[95, 0, 95]} />

      {/* Pine Trees scattered around wilderness */}
      {trees.map((t, idx) => (
        <Tree key={idx} position={[t.x, 0, t.z]} scale={t.scale} />
      ))}
    </>
  );
}
