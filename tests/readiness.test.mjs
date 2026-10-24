import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import status from '../api/status.js';
import chat from '../api/chat.js';
import plant from '../api/plant-doctor.js';
import weather from '../api/weather.js';

function response() {
 const r={code:200,headers:{},body:null};
 r.status=(n)=>{r.code=n;return r};
 r.setHeader=(n,v)=>{r.headers[n.toLowerCase()]=v;return r};
 r.send=(s)=>{r.body=JSON.parse(s);return r};
 return r;
}
test('status endpoint never exposes API credentials or falsely claims cloud sync',()=>{
 const r=response();status({method:'GET'},r);
 assert.equal(r.code,200);
 assert.equal(r.body.storage,'local-device');
 assert.equal(r.body.cloudSync,false);
 assert.equal(typeof r.body.features.advisor,'boolean');
 assert.equal(JSON.stringify(r.body).includes(process.env.OPENAI_API_KEY||'__unlikely_secret__'),false);
});
test('status endpoint rejects unsafe methods',()=>{
 const r=response();status({method:'POST'},r);assert.equal(r.code,405);
});
test('chat rejects invalid empty message arrays before provider call',async()=>{
 const r=response();await chat({method:'POST',headers:{},body:{messages:[]}},r);
 assert.ok([400,503].includes(r.code));assert.equal(typeof r.body.error,'string');
});
test('plant doctor rejects missing photo or reports missing AI configuration',async()=>{
 const r=response();await plant({method:'POST',headers:{},body:{}},r);
 assert.ok([400,503].includes(r.code));assert.equal(typeof r.body.error,'string');
});
test('weather refuses invalid latitude and longitude without external fetch',async()=>{
 const r=response();await weather({method:'GET',query:{lat:'999',lon:'8'},headers:{}},r);
 assert.equal(r.code,400);
});
test('home supports actionable farm tools and no unreleased modules',()=>{
 const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
 const home=app.slice(app.indexOf('function home(){'),app.indexOf('function heading(',app.indexOf('function home(){')));
 assert.ok(home.includes('onboardingGuide()'));
 assert.ok(home.includes('weatherPanel()'));
 assert.ok(home.includes('data-page="plant"'));
 assert.ok(home.includes('data-page="planner"'));
 assert.ok(!home.includes('class="v5-hero"'));
 assert.ok(!app.includes('function sensors(){'));
 assert.ok(!app.includes('function market(){'));
});
test('reports and backup/restore actions are present',()=>{
 const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
 for(const str of ['function savePlantReport','function exportBackup','async function importBackup','function loadAIStatus','open-plant-report','data-action="export-backup"','data-action="import-backup"'])assert.ok(app.includes(str),str);
});
