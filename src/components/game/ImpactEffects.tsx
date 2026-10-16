'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface BloodPool {
  id: string;
  x: number;
  z: number;
  radius: number;
  rotation: number;
}

export interface BulletTracer {
  id: string;
  start: [number, number, number];
  end: [number, number, number];
  life: number; // 0 to 1
}

interface ImpactEffectsProps {
  bloodPools: BloodPool[];
  tracers: BulletTracer[];
}

export function ImpactEffects({ bloodPools, tracers }: ImpactEffectsProps) {
  return (
    <>
      {/* 1. Blood Splatter Pools on Ground (WarZ Image 2) */}
      {bloodPools.map((pool) => (
        <group key={pool.id} position={[pool.x, 0.025, pool.z]} rotation={[-Math.PI / 2, 0, pool.rotation]}>
          {/* Main Blood Pool */}
          <mesh>
            <circleGeometry args={[pool.radius, 16]} />
            <meshStandardMaterial color="#660000" roughness={0.3} metalness={0.1} transparent opacity={0.88} />
          </mesh>
          {/* Outer Blood Drips */}
          <mesh position={[pool.radius * 0.4, pool.radius * 0.5, 0.001]}>
            <circleGeometry args={[pool.radius * 0.35, 12]} />
            <meshStandardMaterial color="#550000" roughness={0.3} transparent opacity={0.8} />
          </mesh>
          <mesh position={[-pool.radius * 0.5, -pool.radius * 0.3, 0.001]}>
            <circleGeometry args={[pool.radius * 0.4, 12]} />
            <meshStandardMaterial color="#550000" roughness={0.3} transparent opacity={0.8} />
          </mesh>
        </group>
      ))}

      {/* 2. Fast Bullet Tracers */}
      {tracers.map((tracer) => {
        const start = new THREE.Vector3(...tracer.start);
        const end = new THREE.Vector3(...tracer.end);
        const mid = start.clone().lerp(end, 0.5);
        const len = start.distanceTo(end);

        const dir = end.clone().sub(start).normalize();
        const orientation = new THREE.Quaternion();
        orientation.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

        return (
          <group key={tracer.id} position={mid} quaternion={orientation}>
            <mesh>
              <cylinderGeometry args={[0.012, 0.012, len, 6]} />
              <meshBasicMaterial color="#ffcc33" transparent opacity={tracer.life} />
            </mesh>
          </group>
        );
      })}
    </>
  );
}
