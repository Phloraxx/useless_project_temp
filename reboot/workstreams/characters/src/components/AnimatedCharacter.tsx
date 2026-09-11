import { useFrame, useLoader } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { clone as skeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js"
import { CLIP_BY_STATE, DEFAULT_CROSSFADE, ONE_SHOT_STATES } from "../animation/characterGraph"
import { useMotionSignals } from "../animation/useMotionSignals"
import type { CharacterModel, CharacterRole, CharacterState } from "../types"

const BASE = "/models/quaternius/"
const MODEL_URL: Record<CharacterModel, string> = {
  male: `${BASE}Superhero_Male_FullBody.gltf`,
  female: `${BASE}Superhero_Female_FullBody.gltf`,
}
const UAL1 = `${BASE}UAL1_Standard.glb`
const UAL2 = `${BASE}UAL2_Standard.glb`

type Props = {
  model?: CharacterModel
  role: CharacterRole
  state: CharacterState
  reactionScale?: number
  scale?: number
  lodMode?: "hero" | "adaptive"
}

function tintPrototype(root: THREE.Object3D, role: CharacterRole) {
  const tint = role === "examiner" ? new THREE.Color("#c6c0aa") : role === "conductor" ? new THREE.Color("#a28a65") : new THREE.Color("#7d8896")
  root.traverse((object) => {
    if (!(object instanceof THREE.SkinnedMesh)) return
    const tintMaterial = (material: THREE.Material) => {
      const next = material.clone() as THREE.MeshStandardMaterial
      if (next.color) next.color.lerp(tint, 0.42)
      next.roughness = 0.82
      return next
    }
    object.material = Array.isArray(object.material)
      ? object.material.map(tintMaterial)
      : tintMaterial(object.material)
    object.castShadow = true
    object.receiveShadow = true
  })
}

function applyOutfitPlaceholder(root: THREE.Object3D, role: CharacterRole) {
  root.traverse((object) => {
    if (!(object instanceof THREE.SkinnedMesh) || !object.name.toLowerCase().includes("superhero")) return
    object.geometry = object.geometry.clone()
    const position = object.geometry.getAttribute("position")
    const colors = new Float32Array(position.count * 3)
    const shirt = new THREE.Color(role === "examiner" ? "#d5d0c3" : role === "conductor" ? "#b59a67" : "#6f7f91")
    const trousers = new THREE.Color(role === "examiner" ? "#252a2d" : role === "conductor" ? "#554936" : "#343b46")
    const skin = new THREE.Color("#8a5639")
    const shoes = new THREE.Color("#17191a")
    for (let i = 0; i < position.count; i += 1) {
      const x = Math.abs(position.getX(i))
      const y = position.getY(i)
      const color = y < 0.16 ? shoes : y < 0.95 ? trousers : y < 1.48 && x < 0.57 ? shirt : skin
      colors[i * 3] = color.r; colors[i * 3 + 1] = color.g; colors[i * 3 + 2] = color.b
    }
    object.geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    const dressed = materials.map((material) => {
      const next = material.clone() as THREE.MeshStandardMaterial
      next.map = null; next.color.set("#ffffff"); next.vertexColors = true; next.roughness = 0.86
      return next
    })
    object.material = Array.isArray(object.material) ? dressed : dressed[0]
  })
}

export function AnimatedCharacter({ model = "male", role, state, reactionScale = 1, scale = 1, lodMode }: Props) {
  const character = useLoader(GLTFLoader, MODEL_URL[model])
  const ual1 = useLoader(GLTFLoader, UAL1)
  const ual2 = useLoader(GLTFLoader, UAL2)
  const motion = useMotionSignals()
  const currentAction = useRef<THREE.AnimationAction | null>(null)
  const container = useRef<THREE.Group>(null)
  const filtered = useRef({ long: 0, lat: 0, bump: 0 })
  const lodAccumulator = useRef(0)
  const worldPosition = useMemo(() => new THREE.Vector3(), [])
  const effectiveLod = lodMode ?? (role === "passenger" ? "adaptive" : "hero")

  const root = useMemo(() => {
    const next = skeletonClone(character.scene)
    tintPrototype(next, role)
    applyOutfitPlaceholder(next, role)
    next.traverse((object) => { object.frustumCulled = false })
    return next
  }, [character.scene, role])

  const mixer = useMemo(() => new THREE.AnimationMixer(root), [root])
  const clips = useMemo(() => new Map([...ual1.animations, ...ual2.animations].map((clip) => [clip.name, clip])), [ual1.animations, ual2.animations])
  const spine = useMemo(() => root.getObjectByName("spine_03"), [root])
  const head = useMemo(() => root.getObjectByName("Head"), [root])

  useEffect(() => {
    const clipName = CLIP_BY_STATE[state]
    const clip = clips.get(clipName)
    if (!clip) { console.warn(`Missing animation clip ${clipName}`); return }
    const next = mixer.clipAction(clip, root)
    next.enabled = true
    next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1)
    if (ONE_SHOT_STATES.has(state)) { next.setLoop(THREE.LoopOnce, 1); next.clampWhenFinished = true }
    else { next.setLoop(THREE.LoopRepeat, Infinity); next.clampWhenFinished = false }
    next.play()
    if (currentAction.current && currentAction.current !== next) currentAction.current.crossFadeTo(next, DEFAULT_CROSSFADE, false)
    currentAction.current = next
  }, [clips, mixer, root, state])

  useEffect(() => () => { mixer.stopAllAction(); mixer.uncacheRoot(root) }, [mixer, root])

  useFrame(({ camera }, delta) => {
    let step = delta
    if (effectiveLod === "adaptive") {
      const holder = container.current
      if (!holder) return
      holder.getWorldPosition(worldPosition)
      const distance = worldPosition.distanceTo(camera.position)
      holder.visible = distance < 45
      if (!holder.visible) return
      const updateHz = distance < 10 ? 60 : distance < 20 ? 30 : 12
      lodAccumulator.current += delta
      if (lodAccumulator.current < 1 / updateHz) return
      step = lodAccumulator.current
      lodAccumulator.current = 0
    } else if (container.current) container.current.visible = true
    mixer.update(step)
    const roleGain = role === "examiner" ? 0.46 : role === "conductor" ? 0.82 : 1
    const gain = reactionScale * roleGain
    const smooth = 1 - Math.exp(-step * 7.5)
    filtered.current.long = THREE.MathUtils.lerp(filtered.current.long, motion.current.longitudinalAccel, smooth)
    filtered.current.lat = THREE.MathUtils.lerp(filtered.current.lat, motion.current.lateralAccel, smooth)
    filtered.current.bump = THREE.MathUtils.lerp(filtered.current.bump, motion.current.verticalImpulse, 1 - Math.exp(-step * 12))
    const pitch = THREE.MathUtils.clamp(-filtered.current.long * 0.035 * gain, -0.12, 0.12)
    const roll = THREE.MathUtils.clamp(filtered.current.lat * 0.04 * gain, -0.11, 0.11)
    const bump = THREE.MathUtils.clamp(filtered.current.bump * 0.018 * gain, 0, 0.06)
    if (spine) { spine.rotateX(pitch); spine.rotateZ(roll) }
    if (head) { head.rotateX(-pitch * 0.24 + bump); head.rotateZ(-roll * 0.18) }
  })

  return <group ref={container} scale={scale}><primitive object={root} /></group>
}

Object.values(MODEL_URL).forEach((url) => useLoader.preload(GLTFLoader, url))
useLoader.preload(GLTFLoader, UAL1)
useLoader.preload(GLTFLoader, UAL2)
