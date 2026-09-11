import * as THREE from "three"
import { SOCKET_ALIASES, SOCKETS, type SocketSpec } from "./socketLayout"

export type SocketName = keyof typeof SOCKETS
export type ResolvedSocket = SocketSpec & {
  source: "node" | "fallback"
  nodeName: string | null
}

export function resolveCharacterSocket(busRoot: THREE.Object3D, canonical: SocketName): ResolvedSocket {
  const candidates = SOCKET_ALIASES[canonical] ?? [canonical]
  const node = candidates.map((name) => busRoot.getObjectByName(name)).find(Boolean)
  const fallback = SOCKETS[canonical]
  if (!node) return { ...fallback, source: "fallback", nodeName: null }

  busRoot.updateWorldMatrix(true, false)
  node.updateWorldMatrix(true, false)
  const relative = busRoot.matrixWorld.clone().invert().multiply(node.matrixWorld)
  const position = new THREE.Vector3()
  const quaternion = new THREE.Quaternion()
  const scale = new THREE.Vector3()
  relative.decompose(position, quaternion, scale)
  const rotation = new THREE.Euler().setFromQuaternion(quaternion, "XYZ")
  return {
    position: [position.x, position.y, position.z],
    rotation: [rotation.x, rotation.y, rotation.z],
    source: "node",
    nodeName: node.name,
  }
}
