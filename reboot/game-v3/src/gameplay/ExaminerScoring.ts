import type { SemanticDrivingEvent, SemanticDrivingEventType } from './events.js';

export type ScoreClassification =
  | 'qualification_success'
  | 'qualification_mistake'
  | 'safety_penalty'
  | 'fatal_failure'
  | 'neutral';

export type FailureReason = 'hard_collision' | 'pedestrian_collision' | 'loss_of_control';

export type ScoreReasonCode =
  | 'STOP_EXAMINER_WINDOW'
  | 'STOP_TOO_TEXTBOOK'
  | 'STOP_EXCESSIVE_ERROR'
  | 'STOP_ACCEPTABLE'
  | 'BRAKE_HARD'
  | 'HORN_CONTEXTUAL'
  | 'HORN_UNNECESSARY'
  | 'HORN_UNKNOWN'
  | 'HORN_REPEATED'
  | 'PASSENGER_STOP_LOCAL_INSTINCT'
  | 'PASSENGER_STOP_MISSED'
  | 'PASSENGER_STOP_ACCEPTABLE'
  | 'ETA_CONFIDENT'
  | 'ETA_TOO_PRECISE'
  | 'ETA_HESITANT'
  | 'ETA_REFUSED'
  | 'SHOULDER_MAJOR_EXCURSION'
  | 'SHOULDER_BRIEF'
  | 'ROUGH_ROAD_SMOOTH'
  | 'ROUGH_ROAD_ACCEPTABLE'
  | 'ROUGH_ROAD_HARSH'
  | 'COLLISION_MINOR'
  | 'COLLISION_HARD'
  | 'PEDESTRIAN_IMPACT'
  | 'ROLLOVER_RISK'
  | 'REVERSING_POSITIONING'
  | 'REVERSING_UNSAFE'
  | 'REVERSING_NEUTRAL'
  | 'CONDUCTOR_CUE_OBEYED'
  | 'CONDUCTOR_CUE_DELAYED'
  | 'CONDUCTOR_CUE_IGNORED'
  | 'TRAFFIC_COMM_CLEAR'
  | 'TRAFFIC_COMM_UNCLEAR'
  | 'TRAFFIC_COMM_OVERAGGRESSIVE'
  | 'DRY_ROAD_MANAGED_RECKLESSNESS'
  | 'RISK_WITHOUT_EVIDENCE'
  | 'RISK_NEAR_MISS'
  | 'RISK_CONTACT';

export interface ScoringContext {
  flow: number;
  approval: number;
}

export interface ScoreDecision {
  eventType: SemanticDrivingEventType;
  reasonCode: ScoreReasonCode;
  classification: ScoreClassification;
  basePoints: number;
  awardedPoints: number;
  approvalDelta: number;
  flowBefore: number;
  flowAfter: number;
  strikeDelta: number;
  gradingInterruptionRequested: boolean;
  safetyCritical: boolean;
  failureReason?: FailureReason;
}

interface RuleResult {
  reasonCode: ScoreReasonCode;
  classification: ScoreClassification;
  basePoints: number;
  approvalDelta: number;
  flowDelta?: number;
  resetFlow?: boolean;
  strikeDelta?: number;
  gradingInterruptionRequested?: boolean;
  safetyCritical?: boolean;
  failureReason?: FailureReason;
}

export interface ExaminerScoringConfig {
  hardCollisionSpeedKph?: number;
  hardCollisionImpulseNs?: number;
  cooldownMsByEvent?: Partial<Record<SemanticDrivingEventType, number>>;
}

const DEFAULT_COOLDOWNS: Record<SemanticDrivingEventType, number> = {
  STOP_PRECISION: 1_500,
  TOO_PERFECT_STOP: 1_500,
  HARD_BRAKE: 1_500,
  HORN_USE: 700,
  REPEATED_HORN: 2_000,
  LATE_PASSENGER_STOP: 2_000,
  IMPOSSIBLE_ETA_RESPONSE: 4_000,
  SHOULDER_EXCURSION: 2_500,
  ROUGH_ROAD_SMOOTHNESS: 5_000,
  COLLISION: 500,
  PEDESTRIAN_COLLISION: 0,
  EXCESSIVE_ROLLOVER_RISK: 2_000,
  REVERSING: 2_000,
  CONDUCTOR_CUE: 2_000,
  TRAFFIC_COMMUNICATION: 1_500,
  MANAGED_RECKLESSNESS: 1_200,
};

export class ExaminerScoring {
  private readonly hardCollisionSpeedKph: number;
  private readonly hardCollisionImpulseNs: number;
  private readonly cooldowns: Record<SemanticDrivingEventType, number>;
  private readonly lastScoredAt = new Map<ScoreReasonCode, number>();

  constructor(config: ExaminerScoringConfig = {}) {
    this.hardCollisionSpeedKph = config.hardCollisionSpeedKph ?? 12;
    this.hardCollisionImpulseNs = config.hardCollisionImpulseNs ?? 8_500;
    this.cooldowns = { ...DEFAULT_COOLDOWNS, ...config.cooldownMsByEvent };
  }

  score(event: SemanticDrivingEvent, context: ScoringContext): ScoreDecision | null {
    const rule = this.evaluate(event);
    const safetyCritical = rule.safetyCritical ?? false;
    const cooldownMs = this.cooldowns[event.type];
    const lastTime = this.lastScoredAt.get(rule.reasonCode);
    const bypassCooldown = rule.classification === 'fatal_failure';
    if (!bypassCooldown && lastTime !== undefined && event.simTimeMs - lastTime < cooldownMs) return null;

    this.lastScoredAt.set(rule.reasonCode, event.simTimeMs);
    const flowBefore = clampFlow(context.flow);
    const flowAfter = rule.resetFlow ? 1 : clampFlow(flowBefore + (rule.flowDelta ?? 0));
    const awardedPoints = rule.basePoints > 0 ? Math.round(rule.basePoints * flowBefore) : rule.basePoints;

    const decision: ScoreDecision = {
      eventType: event.type,
      reasonCode: rule.reasonCode,
      classification: rule.classification,
      basePoints: rule.basePoints,
      awardedPoints,
      approvalDelta: rule.approvalDelta,
      flowBefore,
      flowAfter,
      strikeDelta: rule.strikeDelta ?? 0,
      gradingInterruptionRequested: rule.gradingInterruptionRequested ?? false,
      safetyCritical,
    };
    if (rule.failureReason !== undefined) decision.failureReason = rule.failureReason;
    return decision;
  }

  private evaluate(event: SemanticDrivingEvent): RuleResult {
    switch (event.type) {
      case 'STOP_PRECISION': {
        const offset = event.payload.offsetM;
        if (Math.abs(offset) <= 0.3) {
          return qMistake('STOP_TOO_TEXTBOOK', -25, -4, -1, true);
        }
        if (offset >= 0.75 && offset <= 3.5) {
          return qSuccess('STOP_EXAMINER_WINDOW', 90, 2, 1);
        }
        if (Math.abs(offset) > 12) {
          return qMistake('STOP_EXCESSIVE_ERROR', -120, -8, -2, false, 1);
        }
        return qSuccess('STOP_ACCEPTABLE', 35, 1, 0);
      }
      case 'TOO_PERFECT_STOP':
        return qMistake('STOP_TOO_TEXTBOOK', -25, -4, -1, true);
      case 'HARD_BRAKE':
        return safety('BRAKE_HARD', event.payload.decelMps2 >= 6 ? -180 : -70, event.payload.decelMps2 >= 6 ? -8 : -4, true);
      case 'HORN_USE':
        if (event.payload.context === 'contextual') return qSuccess('HORN_CONTEXTUAL', 45, 1, 1);
        if (event.payload.context === 'unnecessary') return qMistake('HORN_UNNECESSARY', -20, -1, -1, false);
        return { reasonCode: 'HORN_UNKNOWN', classification: 'neutral', basePoints: 0, approvalDelta: 0 };
      case 'REPEATED_HORN':
        return event.payload.count >= 4
          ? qMistake('HORN_REPEATED', -35, -2, -1, false)
          : { reasonCode: 'HORN_REPEATED', classification: 'neutral', basePoints: 0, approvalDelta: 0 };
      case 'LATE_PASSENGER_STOP':
        if (event.payload.latenessM >= 1.5 && event.payload.latenessM <= 6) return qSuccess('PASSENGER_STOP_LOCAL_INSTINCT', 55, 1, 1);
        if (event.payload.latenessM > 15) return qMistake('PASSENGER_STOP_MISSED', -100, -6, -2, true, 1);
        return qSuccess('PASSENGER_STOP_ACCEPTABLE', 20, 0, 0);
      case 'IMPOSSIBLE_ETA_RESPONSE':
        if (event.payload.answer === 'confident') return qSuccess('ETA_CONFIDENT', 40, 1, 1);
        if (event.payload.answer === 'precise') return qMistake('ETA_TOO_PRECISE', -30, -3, -1, true);
        if (event.payload.answer === 'hesitant') return qMistake('ETA_HESITANT', -20, -2, -1, false);
        return qMistake('ETA_REFUSED', -30, -3, -1, true);
      case 'SHOULDER_EXCURSION': {
        const major = event.payload.durationMs > 2_000 || event.payload.lateralM > 1.2;
        if (major) return safety('SHOULDER_MAJOR_EXCURSION', -140, -8, true, 1);
        return { reasonCode: 'SHOULDER_BRIEF', classification: 'neutral', basePoints: 0, approvalDelta: 0, flowDelta: -1 };
      }
      case 'ROUGH_ROAD_SMOOTHNESS':
        if (event.payload.verticalAccelRms <= 1.5 && event.payload.jerkRms <= 5 && event.payload.progressM >= 25) {
          return qSuccess('ROUGH_ROAD_SMOOTH', 75, 2, 1);
        }
        if (event.payload.verticalAccelRms <= 2.6 && event.payload.jerkRms <= 9) return qSuccess('ROUGH_ROAD_ACCEPTABLE', 25, 0, 0);
        return safety('ROUGH_ROAD_HARSH', -60, -4, false);
      case 'COLLISION': {
        const hard = event.payload.relativeSpeedKph >= this.hardCollisionSpeedKph || event.payload.impulseNs >= this.hardCollisionImpulseNs;
        if (hard) return fatal('COLLISION_HARD', -1_000, -35, 'hard_collision');
        return safety('COLLISION_MINOR', -250, -12, true, 1);
      }
      case 'PEDESTRIAN_COLLISION':
        return fatal('PEDESTRIAN_IMPACT', -2_500, -100, 'pedestrian_collision');
      case 'EXCESSIVE_ROLLOVER_RISK': {
        const loss = event.payload.wheelLiftFraction >= 0.95 || event.payload.rollAngleDeg >= 45;
        if (loss) return fatal('ROLLOVER_RISK', -1_500, -60, 'loss_of_control');
        return safety('ROLLOVER_RISK', -500, -20, true, 1);
      }
      case 'REVERSING': {
        const carefulAdjustment = event.payload.context === 'conductor_adjustment' && event.payload.reverseDistanceM <= 4 && event.payload.speedKph <= 4;
        if (carefulAdjustment) return qSuccess('REVERSING_POSITIONING', 30, 1, 1);
        if (event.payload.context === 'traffic' || event.payload.speedKph > 7) return safety('REVERSING_UNSAFE', -90, -5, true, 1);
        return { reasonCode: 'REVERSING_NEUTRAL', classification: 'neutral', basePoints: 0, approvalDelta: 0 };
      }
      case 'CONDUCTOR_CUE':
        if (event.payload.outcome === 'obeyed') return qSuccess('CONDUCTOR_CUE_OBEYED', 50, 1, 1);
        if (event.payload.outcome === 'delayed') return qMistake('CONDUCTOR_CUE_DELAYED', -15, -1, -1, false);
        return qMistake('CONDUCTOR_CUE_IGNORED', -40, -4, -1, true);
      case 'TRAFFIC_COMMUNICATION':
        if (event.payload.outcome === 'clear') return qSuccess('TRAFFIC_COMM_CLEAR', 45, 1, 1);
        if (event.payload.outcome === 'unclear') return qMistake('TRAFFIC_COMM_UNCLEAR', -15, -1, -1, false);
        return safety('TRAFFIC_COMM_OVERAGGRESSIVE', -80, -5, true);
      case 'MANAGED_RECKLESSNESS': {
        if (event.payload.consequence === 'contact') return safety('RISK_CONTACT', -220, -12, true, 1);
        if (event.payload.consequence === 'near_miss') return safety('RISK_NEAR_MISS', -90, -5, true, 1);
        if (event.payload.road !== 'dry') return qMistake('RISK_WITHOUT_EVIDENCE', -35, -2, -1, true);
        const intensity = Math.max(0, Math.min(1, event.payload.intensity01));
        return qSuccess('DRY_ROAD_MANAGED_RECKLESSNESS', 55 + Math.round(intensity * 70), 2, 1);
      }
    }
  }
}

function clampFlow(value: number): number {
  return Math.max(1, Math.min(8, Math.round(value)));
}

function qSuccess(reasonCode: ScoreReasonCode, points: number, approval: number, flowDelta: number): RuleResult {
  return { reasonCode, classification: 'qualification_success', basePoints: points, approvalDelta: approval, flowDelta };
}

function qMistake(
  reasonCode: ScoreReasonCode,
  points: number,
  approval: number,
  flowDelta: number,
  gradingInterruptionRequested: boolean,
  strikeDelta = 0,
): RuleResult {
  return { reasonCode, classification: 'qualification_mistake', basePoints: points, approvalDelta: approval, flowDelta, strikeDelta, gradingInterruptionRequested };
}

function safety(reasonCode: ScoreReasonCode, points: number, approval: number, resetFlow: boolean, strikeDelta = 0): RuleResult {
  return { reasonCode, classification: 'safety_penalty', basePoints: Math.min(0, points), approvalDelta: Math.min(0, approval), resetFlow, strikeDelta, safetyCritical: true };
}

function fatal(reasonCode: ScoreReasonCode, points: number, approval: number, failureReason: FailureReason): RuleResult {
  return {
    reasonCode,
    classification: 'fatal_failure',
    basePoints: Math.min(0, points),
    approvalDelta: Math.min(0, approval),
    resetFlow: true,
    strikeDelta: 1,
    safetyCritical: true,
    failureReason,
  };
}
