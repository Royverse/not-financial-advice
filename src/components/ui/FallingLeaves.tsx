"use client";

import React, { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useTheme } from "next-themes";

function Leaves({ count = 100 }) {
  const mesh = useRef<THREE.Group>(null!);
  const [particles] = useState(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100;
      const factor = 20 + Math.random() * 100;
      const speed = 0.01 + Math.random() / 200;
      const xFactor = -50 + Math.random() * 100;
      const yFactor = -50 + Math.random() * 100;
      const zFactor = -50 + Math.random() * 100;
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 });
    }
    return temp;
  });

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const { theme } = useTheme();

  useFrame((state) => {
    particles.forEach((particle, i) => {
      let { t, factor, speed, xFactor, yFactor, zFactor } = particle;
      t = particle.t += speed / 2;
      const a = Math.cos(t) + Math.sin(t * 1) / 10;
      const b = Math.sin(t) + Math.cos(t * 2) / 10;
      const s = Math.cos(t);

      dummy.position.set(
        (particle.mx / 10) * a + xFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10,
        (particle.my / 10) * b + yFactor + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10,
        (particle.my / 10) * b + zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10
      );
      dummy.scale.set(s, s, s);
      dummy.rotation.set(s * 5, s * 5, s * 5);
      dummy.updateMatrix();
      if (mesh.current.children[i]) {
        mesh.current.children[i].matrix.copy(dummy.matrix);
      }
    });
  });

  const leafColor = theme === "dark" ? "#586e75" : "#93a1a1";
  const leafOpacity = theme === "dark" ? 0.3 : 0.08;

  return (
    <group ref={mesh}>
      {particles.map((_, i) => (
        <mesh key={i} matrixAutoUpdate={false} visible={theme === "dark" || i < count / 4}>
          <planeGeometry args={[0.5, 0.7]} />
          <meshBasicMaterial color={leafColor} transparent opacity={leafOpacity} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

export default function FallingLeaves() {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none opacity-50">
      <Canvas camera={{ fov: 75, position: [0, 0, 30] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Leaves count={80} />
      </Canvas>
    </div>
  );
}
