import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { writeFile, mkdir } from 'node:fs/promises';

const root=new URL('../',import.meta.url).pathname;
const port=4193, base=`http://127.0.0.1:${port}`;
const server=spawn('npm',['run','dev','--','--port',String(port),'--strictPort'],{cwd:root,stdio:'ignore'});
async function waitServer(){for(let i=0;i<80;i++){try{const r=await fetch(base);if(r.ok)return;}catch{}await new Promise(r=>setTimeout(r,250));}throw new Error('Vite server did not start');}
const avg=a=>a.reduce((x,y)=>x+y,0)/Math.max(1,a.length);

async function profile(browser,{name,quality,viewport}){
  const page=await browser.newPage({viewport});
  const url=`${base}/?seed=SHOWCASE-KERALA-2047&quality=${quality}&capture=1&camera=high&speedKph=1800`;
  await page.goto(url,{waitUntil:'networkidle'});await page.waitForTimeout(1800);
  const samples=[];
  for(let i=0;i<36;i++){await page.waitForTimeout(500);const m=await page.evaluate(()=>window.__WORLD_LAB__);if(m)samples.push(m);}
  await mkdir(`${root}screenshots`,{recursive:true});await page.screenshot({path:`${root}screenshots/soak-${name}.png`});
  await page.close();
  const first=samples[0]??{},last=samples.at(-1)??{};
  const fps=samples.map(x=>Number(x.fps)||0), calls=samples.map(x=>Number(x.drawCalls)||0), tris=samples.map(x=>Number(x.triangles)||0), live=samples.map(x=>Number(x.activeChunks)||0);
  return{name,quality,viewport,sampleCount:samples.length,logicalDistanceDeltaM:(Number(last.distanceM)||0)-(Number(first.distanceM)||0),finalDistanceM:Number(last.distanceM)||0,rebases:Number(last.rebases)||0,families:[...new Set(samples.map(x=>String(x.family)))],fps:{avg:+avg(fps).toFixed(1),min:+Math.min(...fps).toFixed(1),max:+Math.max(...fps).toFixed(1)},drawCalls:{avg:+avg(calls).toFixed(1),max:Math.max(...calls)},triangles:{avg:Math.round(avg(tris)),max:Math.max(...tris)},liveChunks:{min:Math.min(...live),max:Math.max(...live)}};
}
let browser;
try{
  await waitServer();browser=await chromium.launch({headless:true});
  const profiles=[];
  profiles.push(await profile(browser,{name:'desktop-high',quality:'HIGH',viewport:{width:1440,height:900}}));
  profiles.push(await profile(browser,{name:'mobile-low',quality:'LOW',viewport:{width:390,height:844}}));
  const report={date:new Date().toISOString(),seed:'SHOWCASE-KERALA-2047',method:'Accelerated logical-distance browser soak at 1800 km/h; validates streaming/rebasing/render stability, not vehicle-physics timing.',environment:'Oracle VM headless Chromium; FPS is software/headless and should not be treated as target-device GPU certification.',profiles};
  await mkdir(`${root}reports`,{recursive:true});await writeFile(`${root}reports/browser-soak.json`,JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
}finally{
  if(browser)await browser.close();server.kill('SIGTERM');
}
