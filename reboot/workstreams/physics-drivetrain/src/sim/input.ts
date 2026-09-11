export type DriveInput = {
  throttle: number
  brake: number
  reverseRequested: boolean
  steer: number
  resetRequested: boolean
}

export type VirtualControl = "throttle" | "brake" | "steerLeft" | "steerRight"

export const STEER_LEFT = -1
export const STEER_RIGHT = 1

export function steerFromHorizontalPad(normalizedX: number) {
  return Math.max(-1, Math.min(1, normalizedX))
}

let virtualSteer = 0

const virtualState: Record<VirtualControl, boolean> = {
  throttle: false,
  brake: false,
  steerLeft: false,
  steerRight: false,
}

export function setVirtualControl(control: VirtualControl, active: boolean) {
  virtualState[control] = active
}

export function setVirtualSteer(value: number) {
  virtualSteer = steerFromHorizontalPad(value)
}

export function releaseVirtualControls() {
  for (const key of Object.keys(virtualState) as VirtualControl[]) virtualState[key] = false
  virtualSteer = 0
}

export function createKeyboardInput() {
  const pressed = new Set<string>()
  let resetRequested = false
  const releaseAll = () => {
    pressed.clear()
    releaseVirtualControls()
  }

  const onKeyDown = (event: KeyboardEvent) => {
    const code = event.code
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(code)) event.preventDefault()
    pressed.add(code)
    if (code === "KeyR" && !event.repeat) resetRequested = true
  }

  const onKeyUp = (event: KeyboardEvent) => pressed.delete(event.code)
  window.addEventListener("keydown", onKeyDown, { passive: false })
  window.addEventListener("keyup", onKeyUp)
  window.addEventListener("blur", releaseAll)

  return {
    sample(): DriveInput {
      const throttle = pressed.has("KeyW") || pressed.has("ArrowUp") || virtualState.throttle ? 1 : 0
      const reverseRequested = pressed.has("KeyS") || pressed.has("ArrowDown") || virtualState.brake
      const serviceBrake = reverseRequested ? 0.55 : 0
      const emergencyBrake = pressed.has("Space") ? 1 : 0
      const left = pressed.has("KeyA") || pressed.has("ArrowLeft") || virtualState.steerLeft
      const right = pressed.has("KeyD") || pressed.has("ArrowRight") || virtualState.steerRight
      const keyboardSteer = (right ? STEER_RIGHT : 0) + (left ? STEER_LEFT : 0)
      const result = {
        throttle,
        brake: Math.max(serviceBrake, emergencyBrake),
        reverseRequested,
        steer: Math.abs(virtualSteer) > 0.01 ? virtualSteer : keyboardSteer,
        resetRequested,
      }
      resetRequested = false
      return result
    },
    dispose() {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
      window.removeEventListener("blur", releaseAll)
      releaseAll()
    },
  }
}
