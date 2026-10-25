import test from 'node:test';
import assert from 'node:assert/strict';
import {configured,modelFor,generateGemini} from '../api/gemini.js';
import {classifyProviderError} from '../api/provider-errors.js';
test('requires Gemini key',()=>{const prev=process.env.GEMINI_API_KEY;delete process.env.GEMINI_API_KEY;assert.equal(configured(),false);if(prev!==undefined)process.env.GEMINI_API_KEY=prev});
test('uses stable Gemini model',()=>assert.match(modelFor(),/^gemini-/));
test('identifies quota errors',()=>assert.equal(classifyProviderError(429,'RESOURCE_EXHAUSTED').code,'GEMINI_QUOTA_LIMIT'));
test('identifies invalid keys',()=>assert.equal(classifyProviderError(400,'INVALID_ARGUMENT','API key not valid').code,'INVALID_GEMINI_KEY'));
test('Gemini responds and key stays in header',async()=>{
 const old=process.env.GEMINI_API_KEY,fetchOld=globalThis.fetch;
 process.env.GEMINI_API_KEY='test-key';let request;
 globalThis.fetch=async(url,args)=>{request={url,args};return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:'Tomato requires balanced watering.'}]}}]})}};
 try{const text=await generateGemini({model:'gemini-2.5-flash',contents:[{role:'user',parts:[{text:'tomato'}]}],systemInstruction:'Agriculture'});assert.match(text,/Tomato/);assert.equal(request.args.headers['x-goog-api-key'],'test-key');assert.ok(!request.url.includes('test-key'));}
 finally{globalThis.fetch=fetchOld;if(old===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=old}
});
test('image input uses inlineData and JSON response',async()=>{
 const old=process.env.GEMINI_API_KEY,fetchOld=globalThis.fetch;
 process.env.GEMINI_API_KEY='test-key';let request;
 globalThis.fetch=async(url,args)=>{request=JSON.parse(args.body);return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:'{"plantName":"Maize"}'}]}}]})}};
 try{const result=await generateGemini({model:'gemini-2.5-flash',contents:[{role:'user',parts:[{inlineData:{mimeType:'image/jpeg',data:'ZGF0YQ=='}}]}],systemInstruction:'Plant health',responseMimeType:'application/json'});assert.equal(JSON.parse(result).plantName,'Maize');assert.equal(request.contents[0].parts[0].inlineData.mimeType,'image/jpeg');assert.equal(request.generationConfig.responseMimeType,'application/json');}
 finally{globalThis.fetch=fetchOld;if(old===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=old}
});


test('fails over from unavailable Gemini 3.8 to stable Gemini 3.6',async()=>{
 const oldKey=process.env.GEMINI_API_KEY,originalFetch=globalThis.fetch;
 process.env.GEMINI_API_KEY='test-key';const attempted=[];
 globalThis.fetch=async(url)=>{
  attempted.push(url);
  if(url.includes('gemini-3.8-flash'))return {ok:false,status:503,json:async()=>({error:{status:'UNAVAILABLE',message:'Provider capacity unavailable'}})};
  return {ok:true,status:200,json:async()=>({candidates:[{content:{parts:[{text:'Maize needs consistent soil moisture.'}]}}]})};
 };
 try{
  const reply=await generateGemini({model:'gemini-3.8-flash',contents:[{role:'user',parts:[{text:'Grow maize'}]}],systemInstruction:'Agriculture'});
  assert.match(reply,/Maize/);
  assert.equal(attempted.length,2);
  assert.match(attempted[1],/gemini-3.6-flash/);
 }finally{globalThis.fetch=originalFetch;if(oldKey===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=oldKey;}
});
test('quota errors do not trigger fallback model',async()=>{
 const oldKey=process.env.GEMINI_API_KEY,originalFetch=globalThis.fetch;
 process.env.GEMINI_API_KEY='test-key';let calls=0;
 globalThis.fetch=async()=>{calls++;return {ok:false,status:429,json:async()=>({error:{status:'RESOURCE_EXHAUSTED',message:'Limit reached'}})}};
 try{
  await assert.rejects(generateGemini({model:'gemini-3.8-flash',contents:[{role:'user',parts:[{text:'Hi'}]}],systemInstruction:'Test'}),e=>e.code==='GEMINI_QUOTA_LIMIT');
  assert.equal(calls,1);
 }finally{globalThis.fetch=originalFetch;if(oldKey===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=oldKey;}
});
