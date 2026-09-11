import { SeededRandom } from './random.js';
import type {
  EncounterContext,
  EncounterDefinition,
  EncounterDirectorConfig,
  EncounterOutcome,
  EncounterSelection,
  FollowUpDefinition,
} from './encounters.js';

interface EncounterStamp {
  simTimeMs: number;
  distanceM: number;
}

interface PendingCallback {
  sourceEncounterId: string;
  targetEncounterId: string;
  availableAtDistanceM: number;
  expiresAtDistanceM: number;
  callbackTag?: string;
}

const RARITY_FACTOR = {
  common: 1,
  uncommon: 0.68,
  rare: 0.34,
  showcase: 0.16,
} as const;

export class EncounterDirector {
  private readonly definitionsById = new Map<string, EncounterDefinition>();
  private readonly encounterRng: SeededRandom;
  private readonly callbackRng: SeededRandom;
  private readonly config: Required<EncounterDirectorConfig>;
  private readonly lastSeen = new Map<string, EncounterStamp>();
  private readonly recent: string[] = [];
  private readonly pendingCallbacks: PendingCallback[] = [];
  private lastSelection: EncounterStamp | null = null;

  constructor(seed: string | number, definitions: readonly EncounterDefinition[], config: EncounterDirectorConfig = {}) {
    for (const definition of definitions) {
      if (this.definitionsById.has(definition.id)) throw new Error(`Duplicate encounter id: ${definition.id}`);
      this.definitionsById.set(definition.id, definition);
    }
    this.encounterRng = new SeededRandom(seed, 'encounter-selection');
    this.callbackRng = new SeededRandom(seed, 'encounter-callbacks');
    this.config = {
      globalMinSpacingMs: config.globalMinSpacingMs ?? 8_000,
      globalMinSpacingM: config.globalMinSpacingM ?? 90,
      recentHistorySize: config.recentHistorySize ?? 4,
    };
  }

  select(context: EncounterContext): EncounterSelection | null {
    this.pruneExpiredCallbacks(context.distanceM);
    if (!this.spacingSatisfied(context)) return null;

    const callback = this.selectCallback(context);
    if (callback) return callback;

    const eligible = [...this.definitionsById.values()].filter((definition) => this.isEligible(definition, context));
    if (eligible.length === 0) return null;

    const weights = eligible.map((definition) => definition.weight * RARITY_FACTOR[definition.rarity]);
    const pickedIndex = this.encounterRng.weightedIndex(weights);
    if (pickedIndex === null) return null;
    const picked = eligible[pickedIndex];
    if (!picked) return null;

    this.markSelected(picked, context);
    return { definition: picked, source: 'scheduled' };
  }

  registerOutcome(encounterId: string, outcome: EncounterOutcome, context: Pick<EncounterContext, 'distanceM'>): void {
    const definition = this.definitionsById.get(encounterId);
    if (!definition?.followUps) return;

    for (const followUp of definition.followUps) {
      if (!this.followUpMatches(followUp, outcome)) continue;
      if (!this.callbackRng.chance(followUp.chance ?? 1)) continue;
      const minDistance = followUp.minDistanceAfterM ?? 80;
      const expiresAfter = followUp.expiresAfterM ?? 800;
      const pending: PendingCallback = {
        sourceEncounterId: encounterId,
        targetEncounterId: followUp.encounterId,
        availableAtDistanceM: context.distanceM + minDistance,
        expiresAtDistanceM: context.distanceM + expiresAfter,
      };
      if (followUp.callbackTag !== undefined) pending.callbackTag = followUp.callbackTag;
      this.pendingCallbacks.push(pending);
    }
  }

  getPendingCallbacks(): readonly Readonly<PendingCallback>[] {
    return this.pendingCallbacks;
  }

  getRecentHistory(): readonly string[] {
    return this.recent;
  }

  private selectCallback(context: EncounterContext): EncounterSelection | null {
    for (let index = 0; index < this.pendingCallbacks.length; index += 1) {
      const callback = this.pendingCallbacks[index];
      if (!callback || context.distanceM < callback.availableAtDistanceM) continue;
      const target = this.definitionsById.get(callback.targetEncounterId);
      if (!target || !this.isEligible(target, context)) continue;

      this.pendingCallbacks.splice(index, 1);
      this.markSelected(target, context);
      const selection: EncounterSelection = { definition: target, source: 'callback', callbackSourceEncounterId: callback.sourceEncounterId };
      if (callback.callbackTag !== undefined) selection.callbackTag = callback.callbackTag;
      return selection;
    }
    return null;
  }

  private isEligible(definition: EncounterDefinition, context: EncounterContext): boolean {
    const e = definition.eligibility;
    if (context.activeEncounterIds.has(definition.id)) return false;
    if (definition.incompatibleWith?.some((id) => context.activeEncounterIds.has(id))) return false;
    if (this.recent.includes(definition.id)) return false;
    if (definition.antiRepeatGroups?.some((group) => this.recent.some((id) => this.definitionsById.get(id)?.antiRepeatGroups?.includes(group)))) return false;

    const previous = this.lastSeen.get(definition.id);
    if (previous) {
      if (context.distanceM - previous.distanceM < definition.cooldownDistanceM) return false;
      if (context.simTimeMs - previous.simTimeMs < definition.cooldownSeconds * 1000) return false;
    }

    if (e.minDistanceM !== undefined && context.distanceM < e.minDistanceM) return false;
    if (e.maxDistanceM !== undefined && context.distanceM > e.maxDistanceM) return false;
    if (e.requiredChunkTags && !e.requiredChunkTags.some((tag) => context.chunkTags.has(tag))) return false;
    if (e.excludedChunkTags?.some((tag) => context.chunkTags.has(tag))) return false;
    if (e.requiredGeometryTags && !e.requiredGeometryTags.every((tag) => context.geometryTags.has(tag))) return false;
    if (e.minTrafficDensity !== undefined && context.trafficDensity < e.minTrafficDensity) return false;
    if (e.maxTrafficDensity !== undefined && context.trafficDensity > e.maxTrafficDensity) return false;
    if (e.weather && !e.weather.includes(context.weather)) return false;
    if (e.minPassengers !== undefined && context.passengerCount < e.minPassengers) return false;
    if (e.maxPassengers !== undefined && context.passengerCount > e.maxPassengers) return false;
    if (e.minStandingPassengers !== undefined && context.standingPassengerCount < e.minStandingPassengers) return false;
    if (e.requiredStoryGates && !e.requiredStoryGates.every((gate) => context.storyGates.has(gate))) return false;
    if (e.excludedStoryGates?.some((gate) => context.storyGates.has(gate))) return false;
    return true;
  }

  private spacingSatisfied(context: EncounterContext): boolean {
    if (!this.lastSelection) return true;
    return (
      context.simTimeMs - this.lastSelection.simTimeMs >= this.config.globalMinSpacingMs &&
      context.distanceM - this.lastSelection.distanceM >= this.config.globalMinSpacingM
    );
  }

  private markSelected(definition: EncounterDefinition, context: EncounterContext): void {
    const stamp = { simTimeMs: context.simTimeMs, distanceM: context.distanceM };
    this.lastSelection = stamp;
    this.lastSeen.set(definition.id, stamp);
    this.recent.push(definition.id);
    while (this.recent.length > this.config.recentHistorySize) this.recent.shift();
  }

  private pruneExpiredCallbacks(distanceM: number): void {
    for (let index = this.pendingCallbacks.length - 1; index >= 0; index -= 1) {
      const callback = this.pendingCallbacks[index];
      if (callback && distanceM > callback.expiresAtDistanceM) this.pendingCallbacks.splice(index, 1);
    }
  }

  private followUpMatches(followUp: FollowUpDefinition, outcome: EncounterOutcome): boolean {
    return !followUp.onOutcome || followUp.onOutcome.includes(outcome);
  }
}
