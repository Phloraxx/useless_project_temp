import { writeFileSync } from 'node:fs';
import { WorldStreamer } from '../src/world/WorldStreamer';
const streamer=new WorldStreamer({seed:'BENCH-KERALA-50000',minLive:5,maxLive:7,rebaseThreshold:520});
const start=performance.now(); let peakLive=0,peakPool=0,maxRadius=0,samples=0;
for(let d=0;d<=50000;d+=10){const s=streamer.update(d);peakLive=Math.max(peakLive,s.activeCount);peakPool=Math.max(peakPool,s.pooledCount);maxRadius=Math.max(maxRadius,Math.hypot(s.playerRender.x,s.playerRender.z));samples++;}
const elapsed=performance.now()-start,last=streamer.update(50000),mem=process.memoryUsage();
const report={date:new Date().toISOString(),distanceKm:50,samples,elapsedMs:+elapsed.toFixed(2),updatesPerSecond:+(samples/(elapsed/1000)).toFixed(0),peakLiveChunks:peakLive,peakPooledIds:peakPool,generatedChunks:last.generatedCount,rebases:last.rebases,maxPlayerRenderRadiusM:+maxRadius.toFixed(2),heapUsedMB:+(mem.heapUsed/1048576).toFixed(2),rssMB:+(mem.rss/1048576).toFixed(2),note:'CPU-only deterministic streamer benchmark; browser GPU metrics are measured separately.'};
writeFileSync(new URL('../reports/streaming-benchmark.json',import.meta.url),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));