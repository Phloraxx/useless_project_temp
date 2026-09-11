import assert from 'node:assert/strict';
import {
  EncounterDirector,
  ExaminerScoring,
  MemoryScoreStore,
  PlayerRunState,
  type EncounterContext,
  type EncounterDefinition,
  type SemanticDrivingEvent,
} from '../src/index.js';

const emptySet = new Set<string>();

function context(distanceM: number, simTimeMs: number, overrides: Partial<EncounterContext> = {}): EncounterContext {
  return {
    simTimeMs,
    distanceM,
    chunkId: `chunk-${Math.floor(distanceM / 100)}`,
    chunkTags: new Set(['road']),
    geometryTags: emptySet,
    trafficDensity: 0.4,
    weather: 'clear',
    passengerCount: 5,
    standingPassengerCount: 0,
    storyGates: emptySet,
    activeEncounterIds: emptySet,
    ...overrides,
  };
}

function simpleEncounter(id: string, weight = 1): EncounterDefinition {
  return {
    id, family: 'test', title: id, weight, rarity: 'common', cooldownDistanceM: 0, cooldownSeconds: 0, eligibility: {},
  };
}

function testNoEncounterSpam(): void {
  const director = new EncounterDirector('spam-seed', [simpleEncounter('a'), simpleEncounter('b')], { globalMinSpacingMs: 8_000, globalMinSpacingM: 90, recentHistorySize: 1 });
  assert.ok(director.select(context(0, 0)));
  assert.equal(director.select(context(50, 7_999)), null, 'must reject selection before both global spacing gates are satisfied');
  assert.equal(director.select(context(100, 7_999)), null, 'time spacing alone can block');
  assert.ok(director.select(context(100, 8_000)), 'selection resumes when distance and time spacing are both satisfied');
}

function testAntiRepetition(): void {
  const defs = ['a', 'b', 'c', 'd', 'e'].map((id) => simpleEncounter(id));
  const director = new EncounterDirector('anti-repeat', defs, { globalMinSpacingMs: 0, globalMinSpacingM: 0, recentHistorySize: 4 });
  const picked: string[] = [];
  for (let i = 0; i < 5; i += 1) {
    const selection = director.select(context(i * 100, i * 1000));
    assert.ok(selection);
    picked.push(selection.definition.id);
  }
  assert.equal(new Set(picked).size, 5, 'recent-history protection should prevent immediate encounter repeats');
}

function testScoringStableAndSpamCooldown(): void {
  const scoring = new ExaminerScoring();
  const run = new PlayerRunState('score-seed', new MemoryScoreStore());
  const horn: SemanticDrivingEvent = { type: 'HORN_USE', simTimeMs: 1_000, distanceM: 100, payload: { durationMs: 120, context: 'contextual' } };
  const first = scoring.score(horn, run.snapshot());
  assert.ok(first);
  run.applyScoreDecision(first);
  const scoreAfterFirst = run.snapshot().score;

  const spam: SemanticDrivingEvent = { ...horn, simTimeMs: 1_200, distanceM: 102 };
  assert.equal(scoring.score(spam, run.snapshot()), null, 'duplicate score event inside cooldown must be suppressed');
  assert.equal(run.snapshot().score, scoreAfterFirst);

  const hardBrake: SemanticDrivingEvent = { type: 'HARD_BRAKE', simTimeMs: 2_000, distanceM: 130, payload: { decelMps2: 5, speedKph: 30 } };
  const brakeFirst = scoring.score(hardBrake, run.snapshot());
  assert.ok(brakeFirst);
  const brakeSpam = scoring.score({ ...hardBrake, simTimeMs: 2_100 }, run.snapshot());
  assert.equal(brakeSpam, null, 'non-fatal penalty events must still obey anti-spam cooldowns');

  const later: SemanticDrivingEvent = { ...horn, simTimeMs: 1_800, distanceM: 120 };
  const second = scoring.score(later, run.snapshot());
  assert.ok(second);
  assert.equal(second.flowBefore, 2);
  assert.equal(second.awardedPoints, 90, 'positive score is multiplied by existing Flow');
}

function testCollisionNeverRewarded(): void {
  for (const [speed, impulse] of [[2, 1_000], [8, 4_000], [15, 10_000]] as const) {
    const scoring = new ExaminerScoring();
    const decision = scoring.score(
      { type: 'COLLISION', simTimeMs: 1_000, distanceM: 100, payload: { relativeSpeedKph: speed, impulseNs: impulse, entityKind: 'vehicle' } },
      { flow: 8, approval: 100 },
    );
    assert.ok(decision);
    assert.ok(decision.awardedPoints <= 0);
    assert.equal(decision.flowAfter, 1);
    assert.ok(decision.classification === 'safety_penalty' || decision.classification === 'fatal_failure');
  }
  const pedestrian = new ExaminerScoring().score(
    { type: 'PEDESTRIAN_COLLISION', simTimeMs: 2_000, distanceM: 200, payload: { relativeSpeedKph: 1 } },
    { flow: 8, approval: 100 },
  );
  assert.ok(pedestrian);
  assert.equal(pedestrian.awardedPoints > 0, false);
  assert.equal(pedestrian.failureReason, 'pedestrian_collision');
}

function testCallbacks(): void {
  const source: EncounterDefinition = {
    ...simpleEncounter('source'),
    followUps: [{ encounterId: 'callback', onOutcome: ['success'], chance: 1, minDistanceAfterM: 100, expiresAfterM: 500, callbackTag: 'remember-me' }],
  };
  const callback: EncounterDefinition = { ...simpleEncounter('callback'), eligibility: { minDistanceM: 100 } };
  const director = new EncounterDirector('callback-seed', [source, callback], { globalMinSpacingMs: 0, globalMinSpacingM: 0, recentHistorySize: 1 });
  const selected = director.select(context(0, 0));
  assert.equal(selected?.definition.id, 'source');
  director.registerOutcome('source', 'success', { distanceM: 0 });
  assert.equal(director.select(context(99, 5_000)), null, 'callback must respect min follow-up distance');
  const follow = director.select(context(100, 6_000));
  assert.equal(follow?.definition.id, 'callback');
  assert.equal(follow?.source, 'callback');
  assert.equal(follow?.callbackTag, 'remember-me');
  assert.equal(follow?.callbackSourceEncounterId, 'source');
}

function testSeedReproducibility(): void {
  const defs = [simpleEncounter('a', 1), simpleEncounter('b', 2), simpleEncounter('c', 3), simpleEncounter('d', 4)];
  const runSequence = (seed: string): string[] => {
    const director = new EncounterDirector(seed, defs, { globalMinSpacingMs: 0, globalMinSpacingM: 0, recentHistorySize: 1 });
    const output: string[] = [];
    for (let i = 0; i < 20; i += 1) {
      const picked = director.select(context(i * 100, i * 1000));
      assert.ok(picked);
      output.push(picked.definition.id);
    }
    return output;
  };
  assert.deepEqual(runSequence('same-seed'), runSequence('same-seed'));
  assert.notDeepEqual(runSequence('same-seed'), runSequence('other-seed'));
}

function testQualificationVsSafety(): void {
  const scoring = new ExaminerScoring();
  const textbook = scoring.score({ type: 'TOO_PERFECT_STOP', simTimeMs: 1_000, distanceM: 50, payload: { offsetM: 0.05 } }, { flow: 4, approval: 70 });
  assert.ok(textbook);
  assert.equal(textbook.classification, 'qualification_mistake');
  assert.equal(textbook.safetyCritical, false);
  assert.equal(textbook.gradingInterruptionRequested, true);

  const hardCrash = scoring.score({ type: 'COLLISION', simTimeMs: 1_100, distanceM: 55, payload: { impulseNs: 12_000, relativeSpeedKph: 20, entityKind: 'vehicle' } }, { flow: 8, approval: 70 });
  assert.ok(hardCrash);
  assert.equal(hardCrash.classification, 'fatal_failure');
  assert.equal(hardCrash.failureReason, 'hard_collision');
  assert.ok(hardCrash.awardedPoints < 0);
}

const tests: Array<[string, () => void]> = [
  ['no encounter spam', testNoEncounterSpam],
  ['anti repetition', testAntiRepetition],
  ['scoring stable + cooldown', testScoringStableAndSpamCooldown],
  ['collision never rewarded', testCollisionNeverRewarded],
  ['callbacks work', testCallbacks],
  ['seed reproducibility', testSeedReproducibility],
  ['qualification and safety are separate', testQualificationVsSafety],
];

for (const [name, test] of tests) {
  test();
  console.log(`PASS ${name}`);
}
console.log(`\n${tests.length}/${tests.length} deterministic gameplay-system tests passed.`);
