import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

function Palm({ x, z, s = 1 }: { x: number; z: number; s?: number }) {
  return <group position={[x, 0, z]} scale={s}>
    <mesh castShadow position={[0, 3.2, 0]}><cylinderGeometry args={[0.16, 0.28, 6.4, 8]} /><meshStandardMaterial color="#65513c" roughness={1} /></mesh>
    {[0,1,2,3,4,5].map((i) => <mesh key={i} castShadow position={[0, 6.25, 0]} rotation={[0, i * Math.PI / 3, 0.72]}><boxGeometry args={[0.34, 0.06, 3.5]} /><meshStandardMaterial color={i % 2 ? "#476f4e" : "#365e43"} roughness={1} /></mesh>)}
  </group>
}

function House({ x, z, flip = false, tone = 0 }: { x: number; z: number; flip?: boolean; tone?: number }) {
  const body = ["#b7aa92", "#c3b79e", "#9b9b8c", "#b5a48e"][tone % 4]
  return <group position={[x, 0, z]} rotation-y={flip ? Math.PI : 0}>
    <mesh castShadow receiveShadow position={[0, 1.65, 0]}><boxGeometry args={[6.3, 3.3, 5.0]} /><meshStandardMaterial color={body} roughness={0.94} /></mesh>
    <mesh castShadow position={[0, 3.55, 0]} rotation={[0, Math.PI / 4, 0]}><cylinderGeometry args={[3.65, 3.65, 1.05, 4]} /><meshStandardMaterial color="#754c3a" roughness={0.96} /></mesh>
    {[-1.6, 0, 1.6].map((wx) => <mesh key={wx} position={[wx, 1.95, flip ? 2.52 : -2.52]}><boxGeometry args={[0.92, 0.95, 0.08]} /><meshStandardMaterial color="#33444a" roughness={0.4} /></mesh>)}
  </group>
}

function Shop({ x, z, label, flip = false }: { x: number; z: number; label: string; flip?: boolean }) {
  return <group position={[x, 0, z]} rotation-y={flip ? Math.PI : 0}>
    <mesh castShadow position={[0, 1.5, 0]}><boxGeometry args={[6.0, 3, 4.2]} /><meshStandardMaterial color="#8f8879" roughness={0.96} /></mesh>
    <mesh position={[0, 1.35, flip ? 2.12 : -2.12]}><boxGeometry args={[4.3, 1.9, 0.08]} /><meshStandardMaterial color="#343938" /></mesh>
    <mesh castShadow position={[0, 2.7, flip ? 2.55 : -2.55]} rotation-x={flip ? 0.12 : -0.12}><boxGeometry args={[5.4, 0.14, 1.6]} /><meshStandardMaterial color="#5b7169" roughness={0.9} /></mesh>
    <group position={[0, 3.45, flip ? 2.22 : -2.22]}><mesh><boxGeometry args={[4.8, 0.75, 0.09]} /><meshStandardMaterial color="#6d4439" /></mesh><TextBars label={label} /></group>
  </group>
}

function TextBars({ label }: { label: string }) {
  const widths = label.length > 10 ? [3.7, 2.2] : [2.8, 1.5]
  return <>{widths.map((w, i) => <mesh key={i} position={[0, 0.12 - i * 0.28, -0.055]}><boxGeometry args={[w, 0.10, 0.02]} /><meshBasicMaterial color="#eadfbe" /></mesh>)}</>
}

function TeaShop() {
  return <group position={[-10.4, 0, 154]}>
    <mesh castShadow position={[0, 1.25, 0]}><boxGeometry args={[5.2, 2.5, 3.8]} /><meshStandardMaterial color="#6e685b" roughness={1} /></mesh>
    <mesh castShadow position={[0, 2.75, -0.45]} rotation-x={-0.1}><boxGeometry args={[6.1, 0.11, 4.3]} /><meshStandardMaterial color="#636c67" roughness={0.8} /></mesh>
    <mesh position={[0, 1.2, -1.92]}><boxGeometry args={[3.8, 1.65, 0.06]} /><meshStandardMaterial color="#343332" /></mesh>
    {[[-2.2,-2.6],[-0.7,-2.8],[1.6,-2.55]].map(([x,z],i)=><mesh key={i} position={[x,0.45,z]}><cylinderGeometry args={[0.28,0.34,0.9,10]} /><meshStandardMaterial color="#9a744e" /></mesh>)}
  </group>
}

function PaddyFields() {
  return <>{[-1,1].map((side) => <group key={side} position={[side * 23, -0.12, 420]}>
    <mesh receiveShadow><boxGeometry args={[27, 0.10, 150]} /><meshStandardMaterial color="#708c53" roughness={1} /></mesh>
    {[-9,-4.5,0,4.5,9].map((x) => <mesh key={x} position={[x,0.09,0]}><boxGeometry args={[0.16,0.14,145]} /><meshStandardMaterial color="#a1ac63" /></mesh>)}
  </group>)}</>
}

function UtilityPoles() {
  return <>{Array.from({ length: 11 }, (_, i) => {
    const z = 25 + i * 48
    const x = i % 2 ? -10.8 : 10.8
    return <group key={i} position={[x,0,z]}>
      <mesh castShadow position={[0,3.6,0]}><cylinderGeometry args={[0.10,0.15,7.2,8]} /><meshStandardMaterial color="#727772" roughness={0.9} /></mesh>
      <mesh position={[0,6.35,0]}><boxGeometry args={[2.0,0.12,0.15]} /><meshStandardMaterial color="#444a46" /></mesh>
    </group>
  })}</>
}

function RoadsidePeople() {
  const people = [
    [-8.0, 88, "#6d7c91"], [-9.2, 157, "#8b6d58"], [8.8, 266, "#60775f"], [10.1, 268, "#75647e"], [-8.9, 342, "#6e7980"],
  ] as const
  return <>{people.map(([x,z,color],i) => <group key={i} position={[x,0,z]}>
    <mesh castShadow position={[0,0.86,0]}><capsuleGeometry args={[0.18,0.72,5,8]} /><meshStandardMaterial color={color} /></mesh>
    <mesh castShadow position={[0,1.58,0]}><sphereGeometry args={[0.20,10,8]} /><meshStandardMaterial color="#8a634d" /></mesh>
  </group>)}</>
}


function MovingAuto({ lane = -2.35, start = 120, span = 710, speed = 9.5, phase = 0 }: { lane?: number; start?: number; span?: number; speed?: number; phase?: number }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.position.z = start + ((clock.elapsedTime * speed + phase) % span)
  })
  return <group ref={ref} position={[lane,0.46,start]}>
    <mesh castShadow position={[0,0.52,0]}><boxGeometry args={[1.48,0.96,2.75]} /><meshStandardMaterial color="#c5a01e" roughness={0.78} /></mesh>
    <mesh castShadow position={[0,1.08,-0.15]}><boxGeometry args={[1.25,0.48,1.35]} /><meshStandardMaterial color="#202729" roughness={0.42} /></mesh>
    <mesh position={[0,0.74,1.39]}><boxGeometry args={[1.1,0.12,0.05]} /><meshStandardMaterial color="#ead466" /></mesh>
    {[-0.56,0.56].flatMap((x)=>[-0.85,0.85].map((z)=><mesh key={`${x}-${z}`} position={[x,0.18,z]} rotation-z={Math.PI/2}><cylinderGeometry args={[0.24,0.24,0.14,12]} /><meshStandardMaterial color="#151719" /></mesh>))}
  </group>
}

function MovingScooter({ lane = 2.25, start = 720, span = 660, speed = 13, phase = 0 }: { lane?: number; start?: number; span?: number; speed?: number; phase?: number }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.position.z = start - ((clock.elapsedTime * speed + phase) % span)
  })
  return <group ref={ref} position={[lane,0.30,start]} rotation-y={Math.PI}>
    <mesh castShadow position={[0,0.42,0]}><boxGeometry args={[0.44,0.32,1.5]} /><meshStandardMaterial color="#486a70" roughness={0.68} /></mesh>
    <mesh castShadow position={[0,1.08,-0.08]}><capsuleGeometry args={[0.16,0.58,5,8]} /><meshStandardMaterial color="#725f4d" /></mesh>
    <mesh castShadow position={[0,1.58,-0.08]}><sphereGeometry args={[0.17,10,8]} /><meshStandardMaterial color="#7d5f4b" /></mesh>
    {[-0.52,0.52].map((z)=><mesh key={z} position={[0,0.22,z]} rotation-y={Math.PI/2}><torusGeometry args={[0.24,0.06,7,12]} /><meshStandardMaterial color="#151719" /></mesh>)}
  </group>
}

function ParkedScooters() {
  const places = [[-8.2,151,0.1],[8.4,349,-0.16],[-8.4,545,0.18],[8.5,653,-0.12],[-8.2,742,0.08]] as const
  return <>{places.map(([x,z,r],i)=><group key={i} position={[x,0.24,z]} rotation-y={r}>
    <mesh castShadow position={[0,0.35,0]}><boxGeometry args={[0.44,0.3,1.42]} /><meshStandardMaterial color={i%2 ? "#805448" : "#526d72"} roughness={0.75} /></mesh>
    {[-0.48,0.48].map((w)=><mesh key={w} position={[0,0.17,w]} rotation-y={Math.PI/2}><torusGeometry args={[0.21,0.055,7,12]} /><meshStandardMaterial color="#17191a" /></mesh>)}
  </group>)}</>
}

function RoadsideLife() {
  const clusters = [[-8.8,153],[8.9,351],[-8.8,548],[8.9,655],[-8.7,744]] as const
  return <>{clusters.flatMap(([x,z],ci)=>[-0.65,0.1,0.78].map((dz,i)=><group key={`${ci}-${i}`} position={[x + (i-1)*0.58,0,z+dz]}>
    <mesh castShadow position={[0,0.84,0]}><capsuleGeometry args={[0.17,0.7,5,8]} /><meshStandardMaterial color={["#6f5c75","#58736b","#7c654f"][(ci+i)%3]} /></mesh>
    <mesh castShadow position={[0,1.54,0]}><sphereGeometry args={[0.19,10,8]} /><meshStandardMaterial color="#86624e" /></mesh>
  </group>))}</>
}


function MonsoonZone() {
  const ref = useRef<THREE.Group>(null)
  const drops = Array.from({ length: 72 }, (_, i) => ({
    x: ((i * 37) % 150) / 10 - 7.5,
    y: 1 + ((i * 19) % 55) / 10,
    z: 362 + ((i * 43) % 570) / 10,
  }))
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.position.y = -((clock.elapsedTime * 8.5) % 1.8)
  })
  return <group>
    <group ref={ref}>
      {drops.map((d,i)=><mesh key={i} position={[d.x,d.y,d.z]} rotation-z={-0.08}>
        <boxGeometry args={[0.012,0.68,0.012]} /><meshBasicMaterial color="#c6d7dd" transparent opacity={0.42} />
      </mesh>)}
    </group>
    {[370,382,397,412].map((z,i)=><mesh key={z} receiveShadow position={[(i%2?2.2:-2.5),0.025,z]}>
      <circleGeometry args={[1.3 + i*0.18,24]} /><meshStandardMaterial color="#1f3339" transparent opacity={0.42} roughness={0.28} metalness={0.05} />
    </mesh>)}
  </group>
}

function RoadEdgeDetails() {
  return <>
    {Array.from({length: 21},(_,i)=>{
      const z=18+i*41
      return <group key={i}>
        <mesh receiveShadow position={[-6.75,-0.02,z]}><boxGeometry args={[0.22,0.10,22]} /><meshStandardMaterial color="#78746a" roughness={1} /></mesh>
        <mesh receiveShadow position={[6.75,-0.02,z]}><boxGeometry args={[0.22,0.10,22]} /><meshStandardMaterial color="#78746a" roughness={1} /></mesh>
      </group>
    })}
    {[116,338,532,734].map((z,i)=><group key={z} position={[i%2 ? 7.6 : -7.6,0,z]}>
      <mesh castShadow position={[0,0.55,0]}><boxGeometry args={[0.15,1.1,0.15]} /><meshStandardMaterial color="#5d625c" /></mesh>
      <mesh castShadow position={[0.55,1.05,0]}><boxGeometry args={[1.5,0.56,0.12]} /><meshStandardMaterial color={i%2 ? "#365d50" : "#6e453b"} /></mesh>
    </group>)}
  </>
}

function RivalBus() {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const loop = (clock.elapsedTime * 11) % 520
    ref.current.position.z = 830 - loop
  })
  return <group ref={ref} position={[3.0,0.7,830]} rotation-y={Math.PI}>
    <mesh castShadow position={[0,1.35,0]}><boxGeometry args={[2.35,2.55,9.6]} /><meshStandardMaterial color="#8b3430" roughness={0.82} /></mesh>
    <mesh position={[0,2.05,-4.86]}><boxGeometry args={[2.12,0.92,0.08]} /><meshStandardMaterial color="#233037" roughness={0.4} /></mesh>
    <mesh position={[0,0.7,0]}><boxGeometry args={[2.2,0.32,9.8]} /><meshStandardMaterial color="#d2c29b" /></mesh>
    {[-1.04,1.04].flatMap((x)=>[-2.65,2.65].map((z)=><mesh key={`${x}-${z}`} position={[x,0,z]} rotation-z={Math.PI/2}><cylinderGeometry args={[0.46,0.46,0.24,16]} /><meshStandardMaterial color="#17191a" /></mesh>))}
  </group>
}

function FinishDepot() {
  return <group position={[0,0,895]}>
    <mesh receiveShadow position={[0,-0.02,0]}><boxGeometry args={[28,0.08,22]} /><meshStandardMaterial color="#6e6d62" /></mesh>
    <mesh castShadow position={[-10,2.4,5]}><boxGeometry args={[7,4.8,6]} /><meshStandardMaterial color="#9d947f" roughness={0.96} /></mesh>
    <mesh castShadow position={[0,4.9,5]}><boxGeometry args={[27,0.22,7]} /><meshStandardMaterial color="#616a64" /></mesh>
    {[ -11,-5.5,0,5.5,11 ].map((x)=><mesh key={x} castShadow position={[x,2.45,5]}><boxGeometry args={[0.25,4.9,0.25]} /><meshStandardMaterial color="#72756f" /></mesh>)}
    <mesh position={[0,3.8,-2.5]}><boxGeometry args={[7.6,1.15,0.16]} /><meshStandardMaterial color="#e6dfc8" /></mesh>
    <mesh position={[0,3.8,-2.6]}><boxGeometry args={[5.8,0.18,0.02]} /><meshBasicMaterial color="#8f2f2c" /></mesh>
  </group>
}

export function KeralaVerticalSlice() {
  const houses = [
    [-11.2,35,false,0],[11.3,58,true,1],[-11.6,205,false,2],[11.2,318,true,3],[-11.1,365,false,0],[11.2,535,true,1],[-11.4,610,false,2],[11.2,682,true,0],[-11.0,770,false,3],[11.3,835,true,1],
  ] as const
  return <group>
    {houses.map(([x,z,flip,tone],i)=><House key={i} x={x} z={z} flip={flip} tone={tone} />)}
    <Shop x={10.8} z={128} label="BAKERY" flip />
    <TeaShop />
    <Shop x={-10.8} z={272} label="STORES" />
    <Shop x={10.7} z={352} label="HOTEL" flip />
    <Shop x={-10.9} z={548} label="TYRES" />
    <Shop x={10.8} z={655} label="BAKERY" flip />
    <Shop x={-10.7} z={744} label="TEA" />
    <PaddyFields />
    <UtilityPoles />
    <RoadsidePeople />
    <RoadsideLife />
    <ParkedScooters />
    <RoadEdgeDetails />
    <MonsoonZone />
    <MovingAuto lane={-2.35} start={120} phase={40} />
    <MovingAuto lane={-2.15} start={260} speed={8.2} phase={220} />
    <MovingScooter lane={2.35} start={770} phase={80} />
    <MovingScooter lane={2.1} start={690} speed={11.5} phase={340} />
    <RivalBus />
    <FinishDepot />
    {[-12,-10.5,11,12.5].flatMap((x, xi) => [18,74,142,188,246,302,358,442,486,548,612,684,752,818,874].map((z, zi) => <Palm key={`${xi}-${zi}`} x={x + ((zi % 2) * 1.1)} z={z} s={0.85 + (zi % 3) * 0.09} />))}
  </group>
}
