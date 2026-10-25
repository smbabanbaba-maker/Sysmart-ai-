import {classifyProviderError,classifyConnectionError} from './provider-errors.js';
// Server-only Gemini access. Never return, log, or send the key to the browser.
export const configured=()=>Boolean(process.env.GEMINI_API_KEY?.trim());
export function modelFor(kind='chat'){
 const name=(kind==='vision'?process.env.GEMINI_VISION_MODEL||process.env.GEMINI_MODEL:process.env.GEMINI_MODEL)||'gemini-3.8-flash';
 const sanitized=name.replace(/^models\//,'');
 return /^[a-zA-Z0-9._-]{3,90}$/.test(sanitized)?sanitized:'gemini-3.8-flash';
}
const fallbackFor=primary=>{
 if(primary==='gemini-3.8-flash')return 'gemini-3.6-flash';
 if(primary==='gemini-3.6-flash')return 'gemini-3.8-flash';
 return null;
};
export async function generateGemini({contents,systemInstruction,model,maxOutputTokens=1200,responseMimeType}){
 if(!configured())throw Object.assign(new Error('Gemini is not configured. Add GEMINI_API_KEY to Vercel Production and deploy.'),{httpStatus:503,code:'NOT_CONFIGURED'});
 const chosen=model||modelFor();
 const alternative=fallbackFor(chosen);
 const models=alternative?[chosen,alternative]:[chosen];
 let last;
 for(let i=0;i<models.length;i++){
  const ctrl=new AbortController();
  const timer=setTimeout(()=>ctrl.abort(),18500);
  try{
   const endpoint='https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(models[i])+':generateContent';
   const request={contents,systemInstruction:{parts:[{text:systemInstruction}]},generationConfig:{maxOutputTokens,thinkingConfig:{thinkingLevel:'low'},...(responseMimeType?{responseMimeType}:{})}};
   const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY},body:JSON.stringify(request),signal:ctrl.signal});
   let data={};try{data=await response.json()}catch{}
   if(!response.ok){
    const detail=data?.error||{};
    const issue=classifyProviderError(response.status,detail.status,detail.message);
    last=Object.assign(new Error(issue.error),{httpStatus:issue.status,code:issue.code});
    // Only fail over on transient outages or model unavailability, NEVER quota/auth/validation.
    if(i===0&&alternative&&['GEMINI_UNAVAILABLE','GEMINI_MODEL_UNAVAILABLE'].includes(issue.code))continue;
    throw last;
   }
   const reply=data?.candidates?.[0]?.content?.parts?.filter(x=>typeof x.text==='string'&&!x.thought).map(x=>x.text).join('\n').trim();
   if(!reply)throw Object.assign(new Error('Gemini did not return an answer. Try another question or a clearer image.'),{httpStatus:502,code:'GEMINI_EMPTY_RESPONSE'});
   return reply;
  }catch(error){
   if(error.httpStatus)throw error;
   const problem=classifyConnectionError(error);
   last=Object.assign(new Error(problem.error),{httpStatus:problem.status,code:problem.code});
   if(i===0&&alternative&&['GEMINI_TIMEOUT','GEMINI_CONNECTION'].includes(problem.code))continue;
   throw last;
  }finally{clearTimeout(timer)}
 }
 throw last||Object.assign(new Error('Gemini is temporarily unavailable.'),{httpStatus:503,code:'GEMINI_UNAVAILABLE'});
}
