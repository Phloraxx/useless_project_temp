import {
  EncounterDirector,
  ExaminerScoring,
  MemoryScoreStore,
  PlayerRunState,
  sampleEncounters,
  type EncounterContext,
  type SemanticDrivingEvent,
} from '../src/index.js';

const seed = process.argv[2] ?? 'showcase-kerala-2047';
const director = new EncounterDirector(seed, sampleEncounters, { globalMinSpacingMs: 9_000, globalMinSpacingM: 110, recentHistorySize: 3 });
const scoring = new ExaminerScoring();
const run = new PlayerRunState(seed, new MemoryScoreStore(1_500));
const storyGates = new Set(['examiner-rules-introduced', 'conductor-introduced', 'passenger-system-live']);

const scoringEvents: SemanticDrivingEvent[] = [
  { type: 'HORN_USE', simTimeMs: 14_000, distanceM: 150, payload: { durationMs: 120, context: 'contextual' } },
  { type: 'STOP_PRECISION', simTimeMs: 29_000, distanceM: 330, payload: { offsetM: 2.1, stopId: 'mock-stop-a' } },
  { type: 'ROUGH_ROAD_SMOOTHNESS', simTimeMs: 47_000, distanceM: 560, payload: { verticalAccelRms: 1.2, jerkRms: 4.1, speedKph: 24, progressM: 45 } },
  { type: 'IMPOSSIBLE_ETA_RESPONSE', simTimeMs: 62_000, distanceM: 760, payload: { answer: 'confident' } },
  { type: 'CONDUCTOR_CUE', simTimeMs: 77_000, distanceM: 950, payload: { cueId: 'edge-a-little', outcome: 'obeyed' } },
  { type: 'HARD_BRAKE', simTimeMs: 92_000, distanceM: 1110, payload: { decelMps2: 4.8, speedKph: 35 } },
  { type: 'TRAFFIC_COMMUNICATION', simTimeMs: 105_000, distanceM: 1260, payload: { method: 'horn', outcome: 'clear' } },
];

let eventCursor = 0;
const encounterLog: string[] = [];
const scoringLog: string[] = [];

for (let step = 0; step <= 14; step += 1) {
  const distanceM = step * 100;
  const simTimeMs = step * 8_000;
  run.setDistance(distanceM);
  const atStop = step % 3 === 0;
  const rough = step === 5 || step === 6;
  const market = step >= 10 && step <= 12;
  const raining = step >= 8 && step <= 10;
  const chunkTags = new Set<string>(['mixed-road']);
  const geometryTags = new Set<string>();
  if (atStop) { chunkTags.add('bus-stop'); geometryTags.add('safe-stop-pocket'); }
  if (rough) { chunkTags.add('rough-road'); geometryTags.add('broken-surface'); }
  if (market) { chunkTags.add('market'); geometryTags.add('merge-gap-authored'); }

  const encounterContext: EncounterContext = {
    simTimeMs,
    distanceM,
    chunkId: `mock-chunk-${step}`,
    chunkTags,
    geometryTags,
    trafficDensity: market ? 0.7 : 0.4,
    weather: raining ? 'rain' : 'clear',
    passengerCount: 7,
    standingPassengerCount: step > 9 ? 2 : 0,
    storyGates,
    activeEncounterIds: new Set(),
  };

  const selection = director.select(encounterContext);
  if (selection) {
    encounterLog.push(`${distanceM.toString().padStart(4)}m  ${selection.source.padEnd(9)} ${selection.definition.id}`);
    run.recordEncounter(selection.definition.id, 'success');
    director.registerOutcome(selection.definition.id, 'success', { distanceM });
    if (selection.source === 'callback') run.recordCallback(selection.callbackSourceEncounterId ?? 'unknown', selection.definition.id, selection.callbackTag);
  }

  while (eventCursor < scoringEvents.length && (scoringEvents[eventCursor]?.distanceM ?? Infinity) <= distanceM) {
    const event = scoringEvents[eventCursor];
    eventCursor += 1;
    if (!event) continue;
    const decision = scoring.score(event, run.snapshot());
    if (!decision) continue;
    run.applyScoreDecision(decision);
    scoringLog.push(`${event.distanceM.toString().padStart(4)}m  ${decision.reasonCode.padEnd(28)} ${String(decision.awardedPoints).padStart(5)} pts  Flow x${decision.flowAfter}  Approval ${decision.approvalDelta >= 0 ? '+' : ''}${decision.approvalDelta}`);
  }
}

const summary = run.finishRun();
console.log(`Seed: ${seed}`);
console.log('\nEncounters');
for (const line of encounterLog) console.log(`  ${line}`);
console.log('\nScore events');
for (const line of scoringLog) console.log(`  ${line}`);
console.log('\nRun summary');
console.log(JSON.stringify({ distanceM: summary.distanceM, score: summary.score, flow: summary.flow, approval: summary.approval, strikes: summary.strikes, failures: summary.failures, discovered: summary.discoveredEncounters.length, callbacks: summary.callbacks.length, bestLocalScore: summary.bestLocalScore }, null, 2));
