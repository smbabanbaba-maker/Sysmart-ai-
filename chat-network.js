// Retry a single temporary mobile connection failure without losing a farmer's draft.
export async function postJsonWithRecovery(url,payload,opts={}){
 const fetcher=opts.fetcher||fetch;
 const wait=opts.wait||(ms=>new Promise(resolve=>setTimeout(resolve,ms)));
 for(let attempt=0;attempt<2;attempt++){
  const ctrl=new AbortController();
  const timer=setTimeout(()=>ctrl.abort(),35000);
  try{
   const res=await fetcher(url,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload),cache:'no-store',signal:ctrl.signal});
   let data;
   try{data=await res.json()}catch{
    throw Object.assign(new Error('The server returned an unexpected response. Please try again.'),{code:'AI_INVALID_RESPONSE'});
   }
   if(res.ok)return data;
   const code=data?.code||'AI_HTTP_'+res.status;
   const error=Object.assign(new Error(data?.error||'Unable to complete the AI request.'),{code,status:res.status});
   // Only retry transient server/gateway errors, not quota or bad credentials.
   if(attempt===0&&[502,503,504].includes(res.status)&&['GEMINI_CONNECTION','GEMINI_TIMEOUT','GEMINI_UNAVAILABLE','AI_HTTP_502','AI_HTTP_503','AI_HTTP_504'].includes(code)){
    await wait(850);continue;
   }
   throw error;
  }catch(err){
   if(err.code||err.status)throw err;
   if(attempt===0){await wait(1100);continue;}
   const offline=typeof navigator!=='undefined'&&navigator.onLine===false;
   throw Object.assign(new Error(offline?'You are offline. Reconnect, then tap Retry. Your question is saved.':'Connection to SYSMART AI was interrupted. Check your internet, then tap Retry. Your question is saved.'),{code:'AI_NETWORK_INTERRUPTED'});
  }finally{clearTimeout(timer)}
 }
 throw Object.assign(new Error('Network unavailable. Retry your question.'),{code:'AI_NETWORK_INTERRUPTED'});
}
