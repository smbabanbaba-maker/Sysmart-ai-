import test from 'node:test';
import assert from 'node:assert/strict';
import {streamFarmAnswer} from '../chat-stream-client.js';
import streamHandler from '../api/chat-stream.js';
const makeStream=chunks=>new ReadableStream({start(c){const encoder=new TextEncoder();for(const text of chunks)c.enqueue(encoder.encode(text));c.close()}});
const ok=(chunks)=>({ok:true,status:200,headers:{get:()=> 'text/event-stream'},body:makeStream(chunks)});
test('client receives streaming Gemini tokens before completion',async()=>{
 const pieces=[];
 const result=await streamFarmAnswer('/api/chat-stream',{messages:[{role:'user',content:'Hi'}]},{fetcher:async()=>ok(['event: ready\ndata: {}\n\n','event: token\ndata: {"text":"Hello "}\n\nevent: token\ndata: {"text":"farmer"}\n\n','event: done\ndata: {}\n\n']),onToken:(p)=>pieces.push(p)});
 assert.equal(result,'Hello farmer');assert.deepEqual(pieces,['Hello ','farmer']);
});
test('client parses split UTF-8 payloads and buffer boundaries',async()=>{
 const reply=await streamFarmAnswer('/api/chat-stream',{},{fetcher:async()=>ok(['event: token\ndata: {"text":"Sun','flower"}\n\n','event: done\ndata: {}\n\n'])});
 assert.equal(reply,'Sunflower');
});
test('streamed quota errors preserve provider code',async()=>{
 await assert.rejects(streamFarmAnswer('/api/chat-stream',{},{fetcher:async()=>ok(['event: error\ndata: {"code":"GEMINI_QUOTA_LIMIT","error":"Quota reached"}\n\n'])}),e=>e.code==='GEMINI_QUOTA_LIMIT');
});
test('incomplete stream does not falsely report success',async()=>{
 await assert.rejects(streamFarmAnswer('/api/chat-stream',{},{fetcher:async()=>ok(['event: token\ndata: {"text":"Incomplete"}\n\n'])}),e=>e.code==='AI_NETWORK_INTERRUPTED');
});
test('server rejects missing keys without exposing secret',async()=>{
 const k=process.env.GEMINI_API_KEY;delete process.env.GEMINI_API_KEY;
 const res={status(code){this.code=code;return this},setHeader(){return this},send(body){this.data=JSON.parse(body);return this}};
 try{await streamHandler({method:'POST',body:{messages:[{role:'user',content:'Hi'}]}},res);assert.equal(res.code,503);assert.equal(res.data.code,'NOT_CONFIGURED')}
 finally{if(k!==undefined)process.env.GEMINI_API_KEY=k}
});
test('server proxies Google SSE text safely',async()=>{
 const key=process.env.GEMINI_API_KEY,f=globalThis.fetch;
 process.env.GEMINI_API_KEY='test-key';
 const sent=[];
 const res={headers:{},statusCode:200,setHeader(k,v){this.headers[k]=v;return this},flushHeaders(){},write(s){sent.push(s);return true},end(){this.ended=true},on(){}};
 globalThis.fetch=async(url,opts)=>{assert.match(url,/streamGenerateContent\?alt=sse/);assert.equal(opts.headers['x-goog-api-key'],'test-key');return {ok:true,status:200,body:makeStream(['data: {"candidates":[{"content":{"parts":[{"text":"Grow"},{"text":" well"}]}}]}\n\n'])}};
 try{await streamHandler({method:'POST',body:{messages:[{role:'user',content:'Hi'}]}},res);assert.equal(res.ended,true);assert.match(sent.join(''),/event: token/);assert.match(sent.join(''),/Grow well/);assert.match(sent.join(''),/event: done/)}
 finally{globalThis.fetch=f;if(key===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=key}
});
