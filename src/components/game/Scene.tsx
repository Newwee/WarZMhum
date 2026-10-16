'use client';

import React, { useMemo } from 'react';

export function Scene() {
  // Generate random atmospheric barricades and obstacles
  const obstacles = useMemo(() => {
    const list: Array<{ x: number; z: number; w: number; h: number; d: number; color: string; rotation: number }> = [];
    const colors = ['#272e2b', '#1a221f', '#3b433f', '#181b19'];
    
    // Perimeter barricades
    for (let i = -35; i <= 35; i += 7) {
      list.push({ x: i, z: -40, w: 6.5, h: 3, d: 1, color: '#1c2420', rotation: 0 });
      list.push({ x: i, z: 40, w: 6.5, h: 3, d: 1, color: '#1c2420', rotation: 0 });
      list.push({ x: -40, z: i, w: 1, h: 3, d: 6.5, color: '#1c2420', rotation: 0 });
      list.push({ x: 40, z: i, w: 1, h: 3, d: 6.5, color: '#1c2420', rotation: 0 });
    }

    // Abandoned military crates and ruined barricades inside the zone
    const placements = [
      { x: -12, z: -10, w: 4, h: 2.2, d: 2, rot: 0.3 },
      { x: -14, z: -8, w: 3, h: 1.8, d: 3, rot: -0.2 },
      { x: 15, z: -15, w: 6, h: 2.8, d: 2.5, rot: 0.7 },
      { x: 10, z: 12, w: 5, h: 2.4, d: 2, rot: -0.5 },
      { x: -8, z: 18, w: 4.5, h: 2.6, d: 2.5, rot: 0.1 },
      { x: -20, z: 5, w: 7, h: 3.2, d: 3, rot: 1.2 },
      { x: 22, z: 8, w: 4, h: 2, d: 4, rot: -0.8 },
      { x: 0, z: 25, w: 8, h: 2.5, d: 1.5, rot: 0 },
    ];

    placements.forEach((p, idx) => {
      list.push({
        x: p.x,
        z: p.z,
        w: p.w,
        h: p.h,
        d: p.d,
        color: colors[idx % colors.length],
        rotation: p.rot,
      });
    });

    return list;
  }, []);

  return (
    <>
      {/* Fog and Lighting */}
      <color attach="background" args={['#080c0a']} />
      <fog attach="fog" args={['#080c0a', 8, 50]} />
      
      {/* Dim ambient light for survival tension */}
      <ambientLight intensity={0.25} />
      
      {/* Cold directional moonlight */}
      <directionalLight
        position={[25, 40, 20]}
        intensity={0.65}
        color="#a5b4fc"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* Atmospheric flickering outpost lamps */}
      <pointLight position={[-10, 5, -10]} intensity={1.8} color="#f59e0b" distance={18} decay={2} />
      <pointLight position={[15, 5, 12]} intensity={1.5} color="#10b981" distance={16} decay={2} />

      {/* Main Ground with grit texture */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[90, 90]} />
        <meshStandardMaterial color="#111815" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Grid overlay for tactical radar aesthetic */}
      <gridHelper args={[90, 45, '#1e3a2f', '#0d1f17']} position={[0, 0.02, 0]} />

      {/* Outpost Barricades and Containers */}
      {obstacles.map((obs, i) => (
        <mesh
          key={i}
          position={[obs.x, obs.h / 2, obs.z]}
          rotation={[0, obs.rotation, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[obs.w, obs.h, obs.d]} />
          <meshStandardMaterial color={obs.color} roughness={0.8} />
        </mesh>
      ))}

      {/* Central Outpost Shelter Pillars */}
      <mesh position={[0, 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 4, 3]} />
        <meshStandardMaterial color="#2d3732" roughness={0.7} />
      </mesh>
    </>
  );
}
