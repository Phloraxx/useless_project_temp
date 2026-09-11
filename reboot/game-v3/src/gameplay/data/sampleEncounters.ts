import type { EncounterDefinition } from '../encounters.js';

export const sampleEncounters: readonly EncounterDefinition[] = [
  {
    id: 'textbook-stop', family: 'stop', title: 'Textbook Stop', weight: 1.2, rarity: 'common',
    cooldownDistanceM: 650, cooldownSeconds: 75, antiRepeatGroups: ['stop-positioning'],
    eligibility: { requiredChunkTags: ['bus-stop'], requiredGeometryTags: ['safe-stop-pocket'], minPassengers: 1 },
    followUps: [{ encounterId: 'impossible-eta', onOutcome: ['success'], chance: 0.7, minDistanceAfterM: 180, expiresAfterM: 900, callbackTag: 'examiner-remembers-stop-confidence' }],
    authoredNotes: 'Exact alignment is safe but suspicious to the examiner; small controlled overshoot is the parody preference.'
  },
  {
    id: 'auto-in-lane', family: 'traffic', title: 'Auto in Lane', weight: 1.1, rarity: 'common',
    cooldownDistanceM: 550, cooldownSeconds: 60, antiRepeatGroups: ['traffic-negotiation'], incompatibleWith: ['market-merge'],
    eligibility: { requiredChunkTags: ['mixed-road'], minTrafficDensity: 0.25, maxTrafficDensity: 0.8, weather: ['clear', 'overcast', 'rain'] },
    authoredNotes: 'Contextual short horn communication can clear the lane. Impact never scores.'
  },
  {
    id: 'conductor-cue', family: 'social', title: 'Conductor Bell / Cue', weight: 1.05, rarity: 'common',
    cooldownDistanceM: 400, cooldownSeconds: 45, antiRepeatGroups: ['conductor-cue'],
    eligibility: { minPassengers: 2, requiredStoryGates: ['conductor-introduced'] },
    followUps: [{ encounterId: 'edge-forward-back', onOutcome: ['success', 'safe_fallback'], chance: 0.5, minDistanceAfterM: 120, expiresAfterM: 700, callbackTag: 'conductor-tests-low-speed-control' }]
  },
  {
    id: 'edge-forward-back', family: 'stop', title: 'Edge Forward / Back', weight: 0.7, rarity: 'uncommon',
    cooldownDistanceM: 700, cooldownSeconds: 90, antiRepeatGroups: ['stop-positioning', 'conductor-cue'],
    eligibility: { requiredChunkTags: ['bus-stop'], requiredGeometryTags: ['safe-stop-pocket'], minPassengers: 2, requiredStoryGates: ['conductor-introduced'] }
  },
  {
    id: 'rough-road-smoothness', family: 'road-control', title: 'Rough Road Smoothness', weight: 0.9, rarity: 'common',
    cooldownDistanceM: 800, cooldownSeconds: 90, antiRepeatGroups: ['surface-control'],
    eligibility: { requiredChunkTags: ['rough-road'], requiredGeometryTags: ['broken-surface'], maxTrafficDensity: 0.75 }
  },
  {
    id: 'impossible-eta', family: 'social', title: 'Impossible ETA', weight: 0.55, rarity: 'uncommon',
    cooldownDistanceM: 1000, cooldownSeconds: 120, antiRepeatGroups: ['passenger-question'],
    eligibility: { minPassengers: 1, requiredStoryGates: ['examiner-rules-introduced'] }
  },
  {
    id: 'market-merge', family: 'traffic', title: 'Market Merge', weight: 0.45, rarity: 'rare',
    cooldownDistanceM: 1300, cooldownSeconds: 150, antiRepeatGroups: ['traffic-negotiation'], incompatibleWith: ['auto-in-lane'],
    eligibility: { minDistanceM: 900, requiredChunkTags: ['market'], requiredGeometryTags: ['merge-gap-authored'], minTrafficDensity: 0.55, maxTrafficDensity: 0.9, weather: ['clear', 'overcast'] }
  },
  {
    id: 'monsoon-burst', family: 'weather', title: 'Monsoon Burst', weight: 0.35, rarity: 'rare',
    cooldownDistanceM: 1800, cooldownSeconds: 180, antiRepeatGroups: ['weather-event'],
    eligibility: { minDistanceM: 700, weather: ['rain', 'heavy_rain'], excludedChunkTags: ['narrow-bridge'] }
  },
  {
    id: 'student-group', family: 'passenger', title: 'Student Group', weight: 0.5, rarity: 'uncommon',
    cooldownDistanceM: 1600, cooldownSeconds: 180, antiRepeatGroups: ['boarding-group'],
    eligibility: { requiredChunkTags: ['bus-stop'], maxPassengers: 18, requiredStoryGates: ['passenger-system-live'] },
    followUps: [{ encounterId: 'impossible-eta', onOutcome: ['success'], chance: 0.55, minDistanceAfterM: 250, expiresAfterM: 1200, callbackTag: 'student-eta-callback' }]
  },
  {
    id: 'quiet-evaluation', family: 'evaluation', title: 'Quiet Evaluation Stretch', weight: 0.8, rarity: 'common',
    cooldownDistanceM: 600, cooldownSeconds: 70, antiRepeatGroups: ['evaluation'],
    eligibility: { maxTrafficDensity: 0.6, excludedChunkTags: ['market'], requiredStoryGates: ['examiner-rules-introduced'] }
  }
] as const;
