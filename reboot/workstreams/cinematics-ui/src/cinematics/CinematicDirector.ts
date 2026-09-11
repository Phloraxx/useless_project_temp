import * as THREE from "three"
import { CAMERA_STATES } from "./cameraStates"
import type {
  CameraPose,
  CameraStateName,
  CinematicRequest,
  DirectorFrame,
  MicroAnimationHook,
  SafetyState,
  SubtitleBeat,
} from "./types"

type Phase = DirectorFrame["phase"]
type CollisionResolver = (target: THREE.Vector3, desired: THREE.Vector3, radius: number) => THREE.Vector3

type JudgementBeat = {
  id: string
  evidenceShot?: CameraStateName
  subtitle?: SubtitleBeat
  scoreDelta?: number
  approvalDelta?: number
}

const clonePose = (pose: CameraPose): CameraPose => ({
  position: pose.position.clone(),
  target: pose.target.clone(),
  fov: pose.fov,
})

const ease = (t: number) => {
  const x = THREE.MathUtils.clamp(t, 0, 1)
  return x * x * (3 - 2 * x)
}
export class CinematicDirector {
  private queue: CinematicRequest[] = []
  private active: CinematicRequest | null = null
  private phase: Phase = "CHASE"
  private phaseTime = 0
  private holdTime = 0
  private fromPose: CameraPose | null = null
  private lastPose: CameraPose | null = null
  private skipRequested = false
  private fastForward = false
  private transientSubtitle: SubtitleBeat | null = null
  private transientSubtitleTime = 0
  private hookListeners = new Set<(hook: MicroAnimationHook) => void>()

  onHook(listener: (hook: MicroAnimationHook) => void) {
    this.hookListeners.add(listener)
    return () => { this.hookListeners.delete(listener) }
  }

  triggerHook(hook: MicroAnimationHook) {
    this.hookListeners.forEach((listener) => listener(hook))
  }

  canEnterSafeCinematic(safety: SafetyState) {
    return safety.speedKmh <= 7
      && safety.laneConstrained
      && safety.agentsStable
      && !safety.unresolvedCollision
      && !safety.pedestrianConflict
  }
  request(request: CinematicRequest, safety: SafetyState) {
    const needsSafety = request.requiresSafeState ?? !CAMERA_STATES[request.shot].allowAtSpeed
    if (needsSafety && !this.canEnterSafeCinematic(safety)) {
      if (request.unsafeFallbackHook) this.triggerHook(request.unsafeFallbackHook)
      if (request.subtitle) this.showTransientSubtitle(request.subtitle, 2.2)
      return "fallback" as const
    }
    this.queue.push({ ...request, requiresSafeState: needsSafety })
    return "queued" as const
  }

  presentJudgement(beat: JudgementBeat, safety: SafetyState) {
    if (!this.canEnterSafeCinematic(safety)) {
      this.triggerHook("examiner.glance")
      this.triggerHook("examiner.clipboardWrite")
      if (beat.subtitle) this.showTransientSubtitle(beat.subtitle, 2.4)
      return "micro" as const
    }
    if (beat.evidenceShot) {
      this.queue.push({
        id: `${beat.id}:evidence`,
        shot: beat.evidenceShot,
        duration: 1.25,
        skippable: true,
        requiresSafeState: true,
        pauseWhenSafe: true,
      })
    }
    this.queue.push({
      id: `${beat.id}:examiner`,
      shot: "INTERIOR_EXAMINER_MEDIUM",
      duration: 1.85,
      subtitle: beat.subtitle,
      hook: "examiner.clipboardWrite",
      skippable: true,
      requiresSafeState: true,
      pauseWhenSafe: true,
    })
    return "cinematic" as const
  }

  showTransientSubtitle(subtitle: SubtitleBeat, seconds = 2) {
    this.transientSubtitle = subtitle
    this.transientSubtitleTime = seconds
  }

  skip() {
    if (this.active?.skippable !== false) this.skipRequested = true
  }

  setFastForward(active: boolean) {
    this.fastForward = active
  }

  clear() {
    this.queue.length = 0
    this.active = null
    this.phase = "CHASE"
    this.phaseTime = 0
    this.holdTime = 0
  }
  private worldPose(
    name: CameraStateName,
    anchorMatrix: THREE.Matrix4,
    resolveCollision?: CollisionResolver,
  ): CameraPose {
    const def = CAMERA_STATES[name]
    const position = new THREE.Vector3(...def.position).applyMatrix4(anchorMatrix)
    const target = new THREE.Vector3(...def.target).applyMatrix4(anchorMatrix)
    const resolved = resolveCollision
      ? resolveCollision(target, position, def.collisionRadius)
      : position
    return { position: resolved, target, fov: def.fov }
  }

  private mixPose(from: CameraPose, to: CameraPose, t: number): CameraPose {
    const k = ease(t)
    return {
      position: from.position.clone().lerp(to.position, k),
      target: from.target.clone().lerp(to.target, k),
      fov: THREE.MathUtils.lerp(from.fov, to.fov, k),
    }
  }

  private begin(request: CinematicRequest, currentPose: CameraPose) {
    this.active = request
    this.phase = "BLEND_IN"
    this.phaseTime = 0
    this.holdTime = 0
    this.fromPose = clonePose(currentPose)
    this.skipRequested = false
    if (request.hook) this.triggerHook(request.hook)
  }
  tick(
    dt: number,
    anchorMatrix: THREE.Matrix4,
    chasePose: CameraPose,
    safety: SafetyState,
    resolveCollision?: CollisionResolver,
  ): DirectorFrame {
    // Prevent long render hitches from skipping through authored camera beats.
    const step = Math.min(Math.max(dt, 0), 0.1)
    const rate = this.fastForward ? 2.6 : 1
    if (this.transientSubtitleTime > 0) {
      this.transientSubtitleTime = Math.max(0, this.transientSubtitleTime - step)
      if (this.transientSubtitleTime === 0) this.transientSubtitle = null
    }

    if (this.phase === "CHASE" && !this.active && this.queue.length > 0) {
      const next = this.queue.shift()!
      if (next.requiresSafeState && !this.canEnterSafeCinematic(safety)) {
        if (next.unsafeFallbackHook) this.triggerHook(next.unsafeFallbackHook)
        if (next.subtitle) this.showTransientSubtitle(next.subtitle, 2.2)
      } else {
        this.begin(next, this.lastPose ?? chasePose)
      }
    }

    if (!this.active) {
      const pose = clonePose(chasePose)
      this.lastPose = pose
      return this.frame("CHASE", pose, 1, 1, this.transientSubtitle)
    }
    const def = CAMERA_STATES[this.active.shot]
    const destination = this.worldPose(this.active.shot, anchorMatrix, resolveCollision)
    let pose = clonePose(destination)
    let timeScale = 1
    let inputAuthority = 1
    const safePause = Boolean(this.active.pauseWhenSafe && this.canEnterSafeCinematic(safety))

    if (this.phase === "BLEND_IN") {
      this.phaseTime += step * rate
      const progress = this.phaseTime / Math.max(0.001, def.blendIn)
      pose = this.mixPose(this.fromPose ?? chasePose, destination, progress)
      if (safePause) {
        timeScale = THREE.MathUtils.lerp(1, 0.45, ease(progress))
        inputAuthority = THREE.MathUtils.lerp(1, 0.35, ease(progress))
      }
      if (progress >= 1) {
        this.phase = "HOLD"
        this.phaseTime = 0
        this.holdTime = 0
      }
    } else if (this.phase === "HOLD") {
      this.holdTime += step * rate
      pose = destination
      if (safePause) {
        timeScale = 0
        inputAuthority = 0
      }
      const requestedHold = this.active.duration ?? def.minHold
      const holdDone = this.holdTime >= Math.max(def.minHold, requestedHold)
      if (this.skipRequested || holdDone || (this.active.pauseWhenSafe && !safePause)) {
        const next = this.queue[0]
        if (next && (!next.requiresSafeState || this.canEnterSafeCinematic(safety))) {
          this.queue.shift()
          this.begin(next, pose)
          return this.tick(0, anchorMatrix, chasePose, safety, resolveCollision)
        }
        this.phase = "BLEND_OUT"
        this.phaseTime = 0
        this.fromPose = clonePose(pose)
        this.skipRequested = false
      }
    } else if (this.phase === "BLEND_OUT") {
      this.phaseTime += step * rate
      const progress = this.phaseTime / Math.max(0.001, def.blendOut)
      pose = this.mixPose(this.fromPose ?? destination, chasePose, progress)
      if (safePause) {
        timeScale = THREE.MathUtils.lerp(0.45, 1, ease(progress))
        inputAuthority = THREE.MathUtils.lerp(0.35, 1, ease(progress))
      }
      if (progress >= 1) {
        this.active = null
        this.phase = "CHASE"
        this.phaseTime = 0
        pose = clonePose(chasePose)
        timeScale = 1
        inputAuthority = 1
      }
    }
    this.lastPose = clonePose(pose)
    const subtitle = this.phase === "BLEND_OUT"
      ? this.transientSubtitle
      : (this.active?.subtitle ?? this.transientSubtitle)
    return this.frame(this.active?.shot ?? "CHASE", pose, timeScale, inputAuthority, subtitle)
  }

  private frame(
    shot: CameraStateName,
    pose: CameraPose,
    gameplayTimeScale: number,
    inputAuthority: number,
    subtitle: SubtitleBeat | null,
  ): DirectorFrame {
    return {
      shot,
      pose,
      gameplayTimeScale,
      inputAuthority,
      subtitle,
      activeRequestId: this.active?.id ?? null,
      queuedCount: this.queue.length,
      phase: this.phase,
    }
  }
}
