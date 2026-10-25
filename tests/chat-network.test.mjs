import test from 'node:test';
import assert from 'node:assert/strict';
import {postJsonWithRecovery as request} from '../chat-network.js';
const payload={messages:[{role:'user',content:'Hi'}]};
test('a successful chat request is sent once',async()=>{
 let n=0;
 const data=await request('/api/chat',payload,{fetcher:async()=>{n++;return {ok:true,json:async()=>({reply:'Hello farmer'})}}});
 assert.equal(n,1);assert.equal(data.reply,'Hello farmer');
});
test('one mobile disconnection is retried',async()=>{
 let n=0;
 const data=await request('/api/chat',payload,{fetcher:async()=>{n++;if(n===1)throw TypeError('Failed to fetch');return {ok:true,json:async()=>({reply:'Recovered'})}},wait:async()=>{}});
 assert.equal(n,2);assert.equal(data.reply,'Recovered');
});
test('persistent network errors are actionable',async()=>{
 let n=0;
 await assert.rejects(request('/api/chat',payload,{fetcher:async()=>{n++;throw TypeError('Failed to fetch')},wait:async()=>{}}),error=>error.code==='AI_NETWORK_INTERRUPTED'&&error.message.includes('Retry'));
 assert.equal(n,2);
});
test('quota errors are not automatically retried',async()=>{
 let n=0;
 await assert.rejects(request('/api/chat',payload,{fetcher:async()=>{n++;return {ok:false,status:429,json:async()=>({code:'GEMINI_QUOTA_LIMIT',error:'Quota exceeded'})}},wait:async()=>{}}),error=>error.code==='GEMINI_QUOTA_LIMIT');
 assert.equal(n,1);
});
test('a temporary gateway error is retried once',async()=>{
 let n=0;
 const x=await request('/api/chat',payload,{fetcher:async()=>{n++;return n===1?{ok:false,status:503,json:async()=>({code:'GEMINI_UNAVAILABLE'})}:{ok:true,json:async()=>({reply:'Recovered'})}},wait:async()=>{}});
 assert.equal(n,2);assert.equal(x.reply,'Recovered');
});
