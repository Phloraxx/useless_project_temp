export type WeatherKind = 'clear' | 'overcast' | 'rain' | 'heavy_rain';
export type EncounterRarity = 'common' | 'uncommon' | 'rare' | 'showcase';
export type EncounterOutcome = 'success' | 'safe_fallback' | 'failure' | 'aborted';

export interface EncounterEligibility {
  minDistanceM?: number;
  maxDistanceM?: number;
  requiredChunkTags?: string[];
  excludedChunkTags?: string[];
  requiredGeometryTags?: string[];
  minTrafficDensity?: number;
  maxTrafficDensity?: number;
  weather?: WeatherKind[];
  minPassengers?: number;
  maxPassengers?: number;
  minStandingPassengers?: number;
  requiredStoryGates?: string[];
  excludedStoryGates?: string[];
}

export interface FollowUpDefinition {
  encounterId: string;
  onOutcome?: EncounterOutcome[];
  chance?: number;
  minDistanceAfterM?: number;
  expiresAfterM?: number;
  callbackTag?: string;
}

export interface EncounterDefinition {
  id: string;
  family: string;
  title: string;
  weight: number;
  rarity: EncounterRarity;
  cooldownDistanceM: number;
  cooldownSeconds: number;
  antiRepeatGroups?: string[];
  incompatibleWith?: string[];
  eligibility: EncounterEligibility;
  followUps?: FollowUpDefinition[];
  authoredNotes?: string;
}

export interface EncounterContext {
  simTimeMs: number;
  distanceM: number;
  chunkId: string;
  chunkTags: ReadonlySet<string>;
  geometryTags: ReadonlySet<string>;
  trafficDensity: number;
  weather: WeatherKind;
  passengerCount: number;
  standingPassengerCount: number;
  storyGates: ReadonlySet<string>;
  activeEncounterIds: ReadonlySet<string>;
}

export interface EncounterSelection {
  definition: EncounterDefinition;
  source: 'scheduled' | 'callback';
  callbackTag?: string;
  callbackSourceEncounterId?: string;
}

export interface EncounterDirectorConfig {
  globalMinSpacingMs?: number;
  globalMinSpacingM?: number;
  recentHistorySize?: number;
}
