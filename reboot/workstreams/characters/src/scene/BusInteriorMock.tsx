import { useMemo } from "react"

function Seat({ x, z }: { x: number; z: number }) {
  return <group position={[x, 0, z]}>
    <mesh position={[0, 0.44, 0]} castShadow receiveShadow><boxGeometry args={[0.56, 0.12, 0.58]} /><meshStandardMaterial color="#39414a" roughness={0.9} /></mesh>
    <mesh position={[0, 0.86, 0.25]} castShadow><boxGeometry args={[0.56, 0.82, 0.11]} /><meshStandardMaterial color="#48515d" roughness={0.88} /></mesh>
    <mesh position={[-0.22, 0.18, 0.16]}><boxGeometry args={[0.06, 0.48, 0.06]} /><meshStandardMaterial color="#1b2025" /></mesh>
    <mesh position={[0.22, 0.18, 0.16]}><boxGeometry args={[0.06, 0.48, 0.06]} /><meshStandardMaterial color="#1b2025" /></mesh>
  </group>
}

export function BusInteriorMock() {
  const seats = useMemo(() => [-1.45, -0.35, 0.75].flatMap((z) => [[-0.7, z], [0.7, z]] as const), [])
  return <group>
    <mesh position={[0, -0.08, 0]} receiveShadow><boxGeometry args={[2.45, 0.16, 7.2]} /><meshStandardMaterial color="#262a2d" roughness={0.92} /></mesh>
    <mesh position={[-1.22, 1.15, 0]} receiveShadow><boxGeometry args={[0.06, 2.3, 7.2]} /><meshStandardMaterial color="#dad8cf" roughness={0.95} /></mesh>
    <mesh position={[0, 1.15, -3.55]}><boxGeometry args={[2.45, 2.3, 0.08]} /><meshStandardMaterial color="#dad8cf" /></mesh>
    <mesh position={[0, 2.24, 0]}><boxGeometry args={[2.45, 0.08, 7.2]} /><meshStandardMaterial color="#ece8dc" /></mesh>
    {seats.map(([x, z]) => <Seat key={`${x}-${z}`} x={x} z={z} />)}
    <mesh position={[0.98, 1.42, 0.1]}><cylinderGeometry args={[0.035, 0.035, 5.9, 10]} /><meshStandardMaterial color="#d49c27" metalness={0.3} roughness={0.45} /></mesh>
    <mesh position={[0, 1.78, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.035, 0.035, 2.12, 10]} /><meshStandardMaterial color="#d49c27" /></mesh>
    <mesh position={[1.16, 0.92, 2.65]}><boxGeometry args={[0.1, 1.8, 1.15]} /><meshPhysicalMaterial color="#70a7b0" transparent opacity={0.18} roughness={0.25} /></mesh>
    <mesh position={[0, 0.03, 3.15]}><boxGeometry args={[2.3, 0.08, 0.7]} /><meshStandardMaterial color="#34393e" /></mesh>
    <mesh position={[-0.62, 0.45, 2.9]}><boxGeometry args={[0.62, 0.1, 0.5]} /><meshStandardMaterial color="#282e34" /></mesh>
    <mesh position={[-0.58, 0.8, 1.96]}><boxGeometry args={[0.62, 0.65, 0.08]} /><meshStandardMaterial color="#303740" /></mesh>
    <mesh position={[-0.58, 0.52, 1.72]}><boxGeometry args={[0.62, 0.1, 0.52]} /><meshStandardMaterial color="#303740" /></mesh>
  </group>
}
