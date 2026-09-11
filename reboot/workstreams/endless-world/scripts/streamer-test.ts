import assert from 'node:assert/strict';
import { CHUNK_LIBRARY } from '../src/world/chunks';
import { WorldStreamer } from '../src/world/WorldStreamer';

function run(seed:string,km=20){
  const w=new WorldStreamer({seed,minLive:5,maxLive:7,rebaseThreshold:520});
  const seen=new Map<number,string>(); let maxLive=0,minLive=99,maxRenderRadius=0,lastRebases=0;
  for(let d=0;d<=km*1000;d+=25){const s=w.update(d);maxLive=Math.max(maxLive,s.activeCount);minLive=Math.min(minLive,s.activeCount);maxRenderRadius=Math.max(maxRenderRadius,Math.hypot(s.playerRender.x,s.playerRender.z));lastRebases=s.rebases;for(const c of s.chunks)seen.set(c.sequenceIndex,c.definition.family);}
  return{w,sequence:[...seen.entries()].sort((a,b)=>a[0]-b[0]).map(x=>x[1]),maxLive,minLive,maxRenderRadius,rebases:lastRebases};
}

const a=run('SHOWCASE-KERALA-2047'),b=run('SHOWCASE-KERALA-2047'),c=run('DIFFERENT-SEED-77');
assert.deepEqual(a.sequence,b.sequence,'same seed must reproduce identical sequence');
assert.notDeepEqual(a.sequence.slice(0,20),c.sequence.slice(0,20),'different seed should alter sequence');
assert.ok(a.minLive>=5&&a.maxLive<=7,`live chunks escaped 5–7 budget: ${a.minLive}..${a.maxLive}`);
assert.ok(a.maxRenderRadius<=521,`render-space player exceeded rebase threshold: ${a.maxRenderRadius}`);
assert.ok(a.rebases>10,`20 km route should exercise rebasing repeatedly, got ${a.rebases}`);
for(let i=1;i<a.sequence.length;i++)assert.notEqual(a.sequence[i],a.sequence[i-1],`adjacent family repeated at ${i}`);
const families=new Set(a.sequence); assert.equal(families.size,6,'showcase long run should exercise all six chunk families');
const socketKinds=new Set(CHUNK_LIBRARY.flatMap(c=>c.sockets.map(s=>s.kind))); for(const kind of ['traffic','pedestrian','busStop','shop','encounter','camera','audio'])assert.ok(socketKinds.has(kind as never),`missing ${kind} socket`);
assert.ok(Math.max(...a.w.getActiveChunks().map(c=>c.poolId))<7,'pool IDs should be recycled instead of growing');
const jump=new WorldStreamer({seed:'SHOWCASE-KERALA-2047',minLive:5,maxLive:7,rebaseThreshold:520});
const jumped=jump.update(12000), holder=jumped.chunks.find(c=>12000>=c.startDistance&&12000<=c.endDistance);
assert.ok(holder,'arbitrary logical-distance jump must converge the stream window in one update');
assert.ok(jumped.activeCount>=5&&jumped.activeCount<=7,'jump recovery must preserve live chunk budget');
console.log(JSON.stringify({status:'PASS',chunksSeen:a.sequence.length,families:[...families],liveRange:[a.minLive,a.maxLive],rebases:a.rebases,maxRenderRadius:+a.maxRenderRadius.toFixed(2)},null,2));