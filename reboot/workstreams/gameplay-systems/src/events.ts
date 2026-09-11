export interface TelemetrySnapshot {
  speedKph: number;
  longitudinalAccelMps2?: number;
  lateralAccelMps2?: number;
  rollAngleDeg?: number;
  steering01?: number;
}

interface EventBase<T extends string, P> {
  type: T;
  simTimeMs: number;
  distanceM: number;
  telemetry?: TelemetrySnapshot;
  sourceEntityId?: string;
  payload: P;
}

export type SemanticDrivingEvent =
  | EventBase<'STOP_PRECISION', { offsetM: number; stopId?: string }>
  | EventBase<'TOO_PERFECT_STOP', { offsetM: number; stopId?: string }>
  | EventBase<'HARD_BRAKE', { decelMps2: number; speedKph: number }>
  | EventBase<'HORN_USE', { durationMs: number; context: 'contextual' | 'unnecessary' | 'unknown' }>
  | EventBase<'REPEATED_HORN', { count: number; windowMs: number }>
  | EventBase<'LATE_PASSENGER_STOP', { latenessM: number; requestedStopId?: string }>
  | EventBase<'IMPOSSIBLE_ETA_RESPONSE', { answer: 'confident' | 'precise' | 'hesitant' | 'refused' }>
  | EventBase<'SHOULDER_EXCURSION', { durationMs: number; lateralM: number; speedKph: number }>
  | EventBase<'ROUGH_ROAD_SMOOTHNESS', { verticalAccelRms: number; jerkRms: number; speedKph: number; progressM: number }>
  | EventBase<'COLLISION', { impulseNs: number; relativeSpeedKph: number; entityKind: 'vehicle' | 'scenery' | 'barrier' | 'unknown' }>
  | EventBase<'PEDESTRIAN_COLLISION', { relativeSpeedKph: number; pedestrianId?: string }>
  | EventBase<'EXCESSIVE_ROLLOVER_RISK', { rollAngleDeg: number; wheelLiftFraction: number; durationMs: number }>
  | EventBase<'REVERSING', { reverseDistanceM: number; speedKph: number; context: 'conductor_adjustment' | 'recovery' | 'traffic' | 'unknown' }>
  | EventBase<'CONDUCTOR_CUE', { cueId: string; outcome: 'obeyed' | 'ignored' | 'delayed' }>
  | EventBase<'TRAFFIC_COMMUNICATION', { method: 'horn' | 'positioning' | 'yield'; outcome: 'clear' | 'unclear' | 'overaggressive' }>;

export type SemanticDrivingEventType = SemanticDrivingEvent['type'];
