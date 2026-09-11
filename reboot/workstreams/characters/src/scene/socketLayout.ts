import type { EulerTuple, Vector3Tuple } from "three"

export type SocketSpec = { position: Vector3Tuple; rotation: EulerTuple }

export const SOCKETS: Record<string, SocketSpec> = {
  SOCKET_DRIVER: { position: [-0.63, 0.38, 2.9], rotation: [0, Math.PI, 0] },
  SOCKET_EXAMINER: { position: [-0.58, 0.38, 1.72], rotation: [0, Math.PI, 0] },
  SOCKET_CONDUCTOR_HOME: { position: [0.76, 0.02, 2.12], rotation: [0, Math.PI, 0] },
  SOCKET_DOOR_ENTRY: { position: [1.05, 0.02, 2.55], rotation: [0, -Math.PI / 2, 0] },
  SOCKET_AISLE_01: { position: [0.12, 0.02, 1.2], rotation: [0, Math.PI, 0] },
  SOCKET_AISLE_02: { position: [0.12, 0.02, 0.25], rotation: [0, Math.PI, 0] },
  SOCKET_SEAT_01: { position: [0.67, 0.38, -0.35], rotation: [0, Math.PI, 0] },
}

export const SOCKET_ALIASES: Record<string, string[]> = {
  SOCKET_EXAMINER: ["SOCKET_EXAMINER", "SOCKET_EXAMINER_HEAD"],
  SOCKET_CONDUCTOR_HOME: ["SOCKET_CONDUCTOR_HOME"],
  SOCKET_DOOR_ENTRY: ["SOCKET_DOOR_ENTRY"],
}
