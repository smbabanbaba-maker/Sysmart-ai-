import test from 'node:test';
import assert from 'node:assert/strict';
import chatHandler from '../api/chat.js';
import plantHandler from '../api/plant-doctor.js';
import statusHandler from '../api/status.js';

function response(){
 return {statusCode:200,headers:{},json:null,status(code){this.statusCode=code;return this},setHeader(key,value){this.headers[key]=value;return this},send(body){this.json=JSON.parse(body);return this}};
}
async function withGemini(key,fetcher,callback){
 const originalKey=process.env.GEMINI_API_KEY,originalFetch=globalThis.fetch;
 if(key==null)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=key;
 if(fetcher)globalThis.fetch=fetcher;
 try{return await callback()}finally{if(originalKey===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=originalKey;globalThis.fetch=originalFetch}
}
test('AI status distinguishes configuration from health',async()=>{
 await withGemini(undefined,null,async()=>{const res=response();await statusHandler({method:'GET'},res);assert.equal(res.json.provider,'Gemini');assert.equal(res.json.features.advisor,false)});
 await withGemini('test-gemini',null,async()=>{const res=response();await statusHandler({method:'GET'},res);assert.equal(res.json.features.advisor,true);assert.equal(res.json.features.plantDoctor,true)});
});
test('Advisor requires key and never invents an answer',async()=>{
 await withGemini(undefined,null,async()=>{const res=response();await chatHandler({method:'POST',body:{messages:[{role:'user',content:'Hi'}]}},res);assert.equal(res.statusCode,503);assert.equal(res.json.code,'NOT_CONFIGURED')});
});
test('Advisor returns Gemini output through Vercel handler',async()=>{
 let sent;
 await withGemini('example-test-key',async(url,opts)=>{sent={url,opts};return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:'Grow maize in well-drained soil.'}]}}]})}},async()=>{
  const res=response();await chatHandler({method:'POST',body:{messages:[{role:'user',content:'Give maize planting advice.'}]}},res);
  assert.equal(res.statusCode,200);assert.match(res.json.reply,/maize/i);assert.equal(res.json.provider,'Gemini')
 });
 assert.equal(sent.opts.headers['x-goog-api-key'],'example-test-key');
 assert.doesNotMatch(sent.url,/example-test-key/);
});
test('Advisor presents Gemini quota errors without disclosing secrets',async()=>{
 await withGemini('example-test-key',async()=>({ok:false,status:429,json:async()=>({error:{status:'RESOURCE_EXHAUSTED',message:'Usage quota exceeded'}})}),async()=>{
  const res=response();await chatHandler({method:'POST',body:{messages:[{role:'user',content:'Hello'}]}},res);
  assert.equal(res.statusCode,429);assert.equal(res.json.code,'GEMINI_QUOTA_LIMIT');assert.doesNotMatch(res.json.error,/example-test-key/)
 });
});
test('Plant Doctor checks image format before provider call',async()=>{
 let calls=0;
 await withGemini('example-test-key',async()=>{calls++;throw Error('must not call provider')},async()=>{
  const res=response();await plantHandler({method:'POST',body:{image:'bad-image'}},res);assert.equal(res.statusCode,400)
 });
 assert.equal(calls,0);
});
test('Plant Doctor returns structured plant findings',async()=>{
 let call;
 await withGemini('example-test-key',async(url,opts)=>{call=JSON.parse(opts.body);return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify({plantName:'Tomato',likelyProblem:'Unable to determine from this photo',visibleSigns:['Yellow leaves'],recommendedActions:['Inspect the underside of the leaves'],prevention:['Keep healthy soil']})}]}}]})}},async()=>{
  const res=response();await plantHandler({method:'POST',body:{image:'data:image/jpeg;base64,YWJj'}},res);
  assert.equal(res.statusCode,200);assert.equal(res.json.report.plantName,'Tomato');assert.equal(res.json.report.visibleSigns[0],'Yellow leaves');
 });
 assert.equal(call.contents[0].parts[1].inlineData.mimeType,'image/jpeg');
 assert.equal(call.generationConfig.responseMimeType,'application/json');
});
