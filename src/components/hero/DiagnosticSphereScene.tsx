import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const CYAN = new THREE.Color("#0DB8D3");
const BLUE = new THREE.Color("#1B7FDC");
const DEEP = new THREE.Color("#065B98");

/** Evenly distributed points on a sphere (Fibonacci lattice). */
function useSpherePoints(count: number, radius: number) {
  return useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const golden = Math.PI * (3 - Math.sqrt(5));
    const mixed = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const ring = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = golden * i;
      const x = Math.cos(theta) * ring;
      const z = Math.sin(theta) * ring;

      positions[i * 3] = x * radius;
      positions[i * 3 + 1] = y * radius;
      positions[i * 3 + 2] = z * radius;

      // Density/weight gradient across the sphere, echoing a halftone sweep.
      const sweep = THREE.MathUtils.clamp((x + 1) / 2, 0, 1);
      mixed.copy(CYAN).lerp(BLUE, sweep).lerp(DEEP, sweep * sweep * 0.7);
      colors[i * 3] = mixed.r;
      colors[i * 3 + 1] = mixed.g;
      colors[i * 3 + 2] = mixed.b;

      sizes[i] = 1 - sweep * 0.75;
    }
    return { positions, colors, sizes };
  }, [count, radius]);
}

function PointShell({
  count,
  radius,
  pointSize,
  opacity,
}: {
  count: number;
  radius: number;
  pointSize: number;
  opacity: number;
}) {
  const { positions, colors } = useSpherePoints(count, radius);
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return g;
  }, [positions, colors]);

  return (
    <points geometry={geometry}>
      <pointsMaterial
        size={pointSize}
        vertexColors
        transparent
        opacity={opacity}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function Sphere({ reducedMotion }: { reducedMotion: boolean }) {
  const group = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const { viewport } = useThree();
  const scale = THREE.MathUtils.clamp(viewport.width / 8, 0.78, 1.3);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const g = group.current;
    if (!g) return;

    pointer.current.x = state.pointer.x;
    pointer.current.y = state.pointer.y;

    if (!reducedMotion) g.rotation.y += delta * 0.16;

    const targetX = pointer.current.y * 0.28;
    const targetZ = pointer.current.x * 0.12;
    const k = 1 - Math.exp(-2.4 * delta);
    g.rotation.x += (targetX - g.rotation.x) * k;
    g.rotation.z += (targetZ - g.rotation.z) * k;
  });

  return (
    <group ref={group} scale={scale}>
      <PointShell count={4200} radius={2.42} pointSize={0.085} opacity={1} />
      <PointShell count={1400} radius={2.05} pointSize={0.05} opacity={0.5} />

      {/* Core body — gives the dotted shell a solid silhouette. */}
      <mesh>
        <sphereGeometry args={[2.3, 48, 48]} />
        <meshStandardMaterial
          color="#071a29"
          roughness={0.6}
          metalness={0.2}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Latitude rings — a measured, instrument-like reading. */}
      {[0.9, 1.55, 2.05, 2.3].map((r, i) => (
        <mesh key={r} rotation-x={Math.PI / 2} position-y={[1.75, 1.1, 0.35, -0.6][i]}>
          <torusGeometry args={[r, 0.004, 8, 128]} />
          <meshBasicMaterial color="#0DB8D3" transparent opacity={0.35} />
        </mesh>
      ))}

      {/* Outer scan ring. */}
      <mesh rotation-x={Math.PI / 2.6} rotation-z={0.35}>
        <torusGeometry args={[2.75, 0.006, 8, 160]} />
        <meshBasicMaterial color="#1B7FDC" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

export default function DiagnosticSphereScene({
  reducedMotion = false,
}: {
  reducedMotion?: boolean;
}) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.3, 7.6], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 8, 6]} intensity={1.5} color="#9fe8f5" />
      <pointLight position={[-6, -3, 4]} intensity={22} color="#1B7FDC" distance={22} />
      <Sphere reducedMotion={reducedMotion} />
    </Canvas>
  );
}
