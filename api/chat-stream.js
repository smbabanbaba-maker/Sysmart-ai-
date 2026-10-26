import {configured,modelFor} from './gemini.js';
import {classifyProviderError,classifyConnectionError} from './provider-errors.js';

const send=(res,status,body)=>res.status(status).setHeader('Content-Type','application/json; charset=utf-8').send(JSON.stringify(body));
const push=(res,type,data)=>res.write('event: '+type+'\ndata: '+JSON.stringify(data)+'\n\n');
const fallbackModel=model=>model==='gemini-3.5-flash-lite'?'gemini-3.1-flash-lite':model==='gemini-3.8-flash'?'gemini-3.6-flash':null;

export default async function handler(req,res){
 if(req.method!=='POST')return send(res,405,{error:'Method not allowed'});
 if(process.env.ALLOWED_ORIGIN&&req.headers.origin&&req.headers.origin!==process.env.ALLOWED_ORIGIN)return send(res,403,{error:'Origin not allowed'});
 if(!configured())return send(res,503,{code:'NOT_CONFIGURED',error:'Set GEMINI_API_KEY in Vercel Production.'});
 const {messages=[],language='en',farmContext=''}=req.body||{};
 if(!Array.isArray(messages)||!messages.length||messages.length>20)return send(res,400,{error:'Provide 1 to 20 chat messages.'});
 const valid=messages.filter(m=>m&&['user','assistant'].includes(m.role)&&typeof m.content==='string'&&m.content.trim()).map(m=>({role:m.role,content:m.content.trim().slice(0,2200)}));
 if(!valid.length||valid.at(-1).role!=='user')return send(res,400,{error:'A question is required.'});
 if(valid.reduce((sum,m)=>sum+m.content.length,0)>12000)return send(res,413,{error:'This conversation is too long. Start a new chat.'});
 const systemInstruction='You are SYSMART AI from SYLUTION, a helpful agriculture adviser for Nigerian and African farmers. Answer in the same language as the farmer (Hausa or English). Be clear, warm, concise and accurate. For simple questions use 60-130 words; only give longer explanations when explicitly requested. Prefer short actionable steps. Use neat Markdown headings or bullets only when useful. Avoid long introductions. Never invent farm or weather data, test results, diagnoses or prices. Crop disease assessments based on descriptions/photos are preliminary. Do not guess pesticide chemical doses or hazardous mixtures. Ask one helpful question if key information is missing. Farm details: '+String(farmContext).slice(0,1100);
 const contents=valid.slice(-10).map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]}));
 const primary=modelFor('chat');
 const modelNames=[primary,...(fallbackModel(primary)?[fallbackModel(primary)]:[])];
 const controller=new AbortController();
 let streamStarted=false,finished=false,full='';
 const timer=setTimeout(()=>controller.abort(),36500);
 res.on?.('close',()=>{if(!finished)controller.abort()});
 try{
  for(let index=0;index<modelNames.length;index++){
   const name=modelNames[index];
   const endpoint='https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(name)+':streamGenerateContent?alt=sse';
   let upstream;
   try{
    upstream=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY},body:JSON.stringify({contents,systemInstruction:{parts:[{text:systemInstruction}]},generationConfig:{maxOutputTokens:760,thinkingConfig:{thinkingLevel:name.includes('flash-lite')?'minimal':'low'}}}),signal:controller.signal});
   }catch(error){
    if(index+1<modelNames.length&&!controller.signal.aborted)continue;
    const issue=classifyConnectionError(error);
    if(!streamStarted)return send(res,issue.status,{code:issue.code,error:issue.error});
    push(res,'error',{code:issue.code,error:issue.error});return res.end();
   }
   if(!upstream.ok){
    let details={};try{details=await upstream.json()}catch{}
    const issue=classifyProviderError(upstream.status,details?.error?.status,details?.error?.message);
    if(index+1<modelNames.length&&['GEMINI_UNAVAILABLE','GEMINI_MODEL_UNAVAILABLE'].includes(issue.code))continue;
    if(!streamStarted)return send(res,issue.status,{code:issue.code,error:issue.error});
    push(res,'error',{code:issue.code,error:issue.error});return res.end();
   }
   if(!upstream.body?.getReader){
    if(!streamStarted)return send(res,502,{code:'STREAM_NOT_AVAILABLE',error:'Streaming is unavailable. Try standard chat.'});
    push(res,'error',{code:'STREAM_NOT_AVAILABLE',error:'Streaming stopped unexpectedly.'});return res.end();
   }
   res.statusCode=200;
   res.setHeader('Content-Type','text/event-stream; charset=utf-8');
   res.setHeader('Cache-Control','no-cache, no-transform');
   res.setHeader('X-Accel-Buffering','no');
   res.flushHeaders?.();
   streamStarted=true;
   push(res,'ready',{provider:'Gemini'});
   const reader=upstream.body.getReader(),decoder=new TextDecoder();
   let buffer='';
   while(true){
    const {done,value}=await reader.read();
    if(done)break;
    buffer+=decoder.decode(value,{stream:true}).replace(/\r\n/g,'\n');
    let pos;
    while((pos=buffer.indexOf('\n\n'))!==-1){
     const packet=buffer.slice(0,pos);buffer=buffer.slice(pos+2);
     const dataLine=packet.split('\n').filter(line=>line.startsWith('data:')).map(line=>line.slice(5).trimStart()).join('');
     if(!dataLine||dataLine==='[DONE]')continue;
     let event;try{event=JSON.parse(dataLine)}catch{continue}
     const token=event?.candidates?.[0]?.content?.parts?.filter(p=>typeof p.text==='string'&&!p.thought).map(p=>p.text).join('')||'';
     if(!token)continue;
     full+=token;
     push(res,'token',{text:token});
    }
   }
   if(!full.trim())push(res,'error',{code:'GEMINI_EMPTY_RESPONSE',error:'Gemini returned no answer. Please retry.'});
   else push(res,'done',{length:full.length});
   finished=true;return res.end();
  }
 }catch(error){
  const issue=classifyConnectionError(error);
  if(!streamStarted)return send(res,issue.status,{code:issue.code,error:issue.error});
  push(res,'error',{code:issue.code,error:issue.error});
  return res.end();
 }finally{finished=true;clearTimeout(timer)}
}
