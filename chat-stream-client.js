// Gemini SSE client. Never retry an already-streaming request (avoids duplicate charges).
export async function streamFarmAnswer(url,payload,{onToken=()=>{},onReady=()=>{},fetcher=fetch,timeoutMs=39000}={}){
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),timeoutMs);
 let text='',done=false;
 try{
  let response;
  try{response=await fetcher(url,{method:'POST',headers:{'Content-Type':'application/json','Accept':'text/event-stream, application/json'},body:JSON.stringify(payload),cache:'no-store',signal:controller.signal})}
  catch(error){throw Object.assign(new Error('Connection interrupted. Check your internet and tap Retry.'),{code:'AI_NETWORK_INTERRUPTED'})}
  if(!response.ok){
   let data={};try{data=await response.json()}catch{}
   throw Object.assign(new Error(data.error||'Gemini is unavailable. Please try again.'),{code:data.code||'HTTP_'+response.status,status:response.status});
  }
  if(!response.body?.getReader||!String(response.headers?.get?.('content-type')||'').includes('text/event-stream')){
   throw Object.assign(new Error('Streaming is not supported here.'),{code:'STREAM_NOT_AVAILABLE'});
  }
  const reader=response.body.getReader(),decoder=new TextDecoder();
  let buffer='';
  while(true){
   let part;
   try{part=await reader.read()}catch{throw Object.assign(new Error('Stream interrupted. Your question is saved. Tap Retry.'),{code:'AI_NETWORK_INTERRUPTED'})}
   if(part.done)break;
   buffer+=decoder.decode(part.value,{stream:true}).replace(/\r\n/g,'\n');
   let end;
   while((end=buffer.indexOf('\n\n'))!==-1){
    const packet=buffer.slice(0,end);buffer=buffer.slice(end+2);
    let event='message';
    for(const line of packet.split('\n'))if(line.startsWith('event:'))event=line.slice(6).trim();
    const raw=packet.split('\n').filter(line=>line.startsWith('data:')).map(line=>line.slice(5).trimStart()).join('');
    if(!raw)continue;
    let data;try{data=JSON.parse(raw)}catch{continue}
    if(event==='ready')onReady();
    else if(event==='token'&&typeof data.text==='string'){text+=data.text;onToken(data.text,text)}
    else if(event==='done')done=true;
    else if(event==='error')throw Object.assign(new Error(data.error||'Gemini could not finish its response.'),{code:data.code||'GEMINI_ERROR'});
   }
  }
  if(!done||!text.trim())throw Object.assign(new Error('The reply was interrupted. Tap Retry to try again.'),{code:'AI_NETWORK_INTERRUPTED'});
  return text;
 }catch(error){
  if(error?.code)throw error;
  throw Object.assign(new Error(error?.name==='AbortError'?'The response timed out. Your question is saved. Tap Retry.':'Connection was lost. Your question is saved. Tap Retry.'),{code:'AI_NETWORK_INTERRUPTED'});
 }finally{clearTimeout(timer)}
}
