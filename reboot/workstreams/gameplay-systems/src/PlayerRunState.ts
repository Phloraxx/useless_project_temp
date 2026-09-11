import type { EncounterOutcome } from './encounters.js';
import type { FailureReason, ScoreDecision } from './ExaminerScoring.js';

export type RunFailureReason = FailureReason | 'approval_zero';

export interface CallbackRecord {
  sourceEncounterId: string;
  targetEncounterId: string;
  callbackTag?: string;
  distanceM: number;
}

export interface EncounterRecord {
  encounterId: string;
  outcome: EncounterOutcome;
  distanceM: number;
}

export interface PlayerRunSnapshot {
  runSeed: string;
  distanceM: number;
  score: number;
  flow: number;
  approval: number;
  strikes: number;
  failures: RunFailureReason[];
  runEnded: boolean;
  discoveredEncounters: string[];
  encounterHistory: EncounterRecord[];
  callbacks: CallbackRecord[];
  bestLocalScore: number;
}

export interface ScoreStore {
  getBestScore(): number;
  setBestScore(score: number): void;
}

export class MemoryScoreStore implements ScoreStore {
  constructor(private best = 0) {}
  getBestScore(): number { return this.best; }
  setBestScore(score: number): void { this.best = Math.max(this.best, Math.max(0, Math.floor(score))); }
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export class LocalScoreStore implements ScoreStore {
  constructor(private readonly storage: StorageLike, private readonly key = 'adutha-stoppil.best-score.v2') {}
  getBestScore(): number {
    const parsed = Number(this.storage.getItem(this.key));
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
  }
  setBestScore(score: number): void {
    const next = Math.max(this.getBestScore(), Math.max(0, Math.floor(score)));
    this.storage.setItem(this.key, String(next));
  }
}

export class PlayerRunState {
  private distanceM = 0;
  private score = 0;
  private flow = 1;
  private approval = 70;
  private strikes = 0;
  private readonly failures: RunFailureReason[] = [];
  private runEnded = false;
  private readonly discovered = new Set<string>();
  private readonly encounterHistory: EncounterRecord[] = [];
  private readonly callbacks: CallbackRecord[] = [];
  private bestLocalScore: number;

  constructor(readonly runSeed: string, private readonly scoreStore: ScoreStore = new MemoryScoreStore()) {
    this.bestLocalScore = scoreStore.getBestScore();
  }

  setDistance(distanceM: number): void {
    if (!Number.isFinite(distanceM)) throw new Error('distanceM must be finite');
    this.distanceM = Math.max(this.distanceM, Math.max(0, distanceM));
  }

  applyScoreDecision(decision: ScoreDecision): void {
    if (this.runEnded) return;
    this.score = Math.max(0, this.score + decision.awardedPoints);
    this.flow = clamp(decision.flowAfter, 1, 8);
    this.approval = clamp(this.approval + decision.approvalDelta, 0, 100);
    this.strikes += Math.max(0, decision.strikeDelta);
    if (decision.failureReason) this.fail(decision.failureReason);
    if (!this.runEnded && this.approval <= 0) this.fail('approval_zero');
  }

  recordEncounter(encounterId: string, outcome: EncounterOutcome): void {
    this.discovered.add(encounterId);
    this.encounterHistory.push({ encounterId, outcome, distanceM: this.distanceM });
  }

  recordCallback(sourceEncounterId: string, targetEncounterId: string, callbackTag?: string): void {
    const record: CallbackRecord = { sourceEncounterId, targetEncounterId, distanceM: this.distanceM };
    if (callbackTag !== undefined) record.callbackTag = callbackTag;
    this.callbacks.push(record);
  }

  finishRun(): PlayerRunSnapshot {
    this.runEnded = true;
    this.scoreStore.setBestScore(this.score);
    this.bestLocalScore = this.scoreStore.getBestScore();
    return this.snapshot();
  }

  snapshot(): PlayerRunSnapshot {
    return {
      runSeed: this.runSeed,
      distanceM: this.distanceM,
      score: this.score,
      flow: this.flow,
      approval: this.approval,
      strikes: this.strikes,
      failures: [...this.failures],
      runEnded: this.runEnded,
      discoveredEncounters: [...this.discovered],
      encounterHistory: this.encounterHistory.map((record) => ({ ...record })),
      callbacks: this.callbacks.map((record) => ({ ...record })),
      bestLocalScore: this.bestLocalScore,
    };
  }

  private fail(reason: RunFailureReason): void {
    if (!this.failures.includes(reason)) this.failures.push(reason);
    this.runEnded = true;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
