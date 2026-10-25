import {classifyProviderError,classifyConnectionError} from './provider-errors.js';
// Server-side Gemini gateway. The key must never appear in client code.
export const configured=()=>Boolean(process.env.GEMINI_API_KEY?.trim());
export function modelFor(kind='chat'){
 const name=(kind==='vision'?process.env.GEMINI_VISION_MODEL||process.env.GEMINI_MODEL:process.env.GEMINI_MODEL)||'gemini-2.5-flash';
 const sanitized=name.replace(/^models\//,'');
 return /^[a-zA-Z0-9._-]{3,90}$/.test(sanitized)?sanitized:'gemini-2.5-flash';
}
export async function generateGemini({contents,systemInstruction,model,maxOutputTokens=1200,responseMimeType}){
 if(!configured())throw Object.assign(new Error('Gemini is not configured. Add GEMINI_API_KEY to Vercel Production and deploy.'),{httpStatus:503,code:'NOT_CONFIGURED'});
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),27000);
 try{
  const url='https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent';
  const payload={contents,systemInstruction:{parts:[{text:systemInstruction}]},generationConfig:{maxOutputTokens,temperature:0.25,...(responseMimeType?{responseMimeType}:{})}};
  const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY},body:JSON.stringify(payload),signal:controller.signal});
  let data={};try{data=await response.json()}catch{}
  if(!response.ok){const err=data.error||{};const issue=classifyProviderError(response.status,err.status,err.message);throw Object.assign(new Error(issue.error),{httpStatus:issue.status,code:issue.code});}
  const txt=data?.candidates?.[0]?.content?.parts?.filter(x=>typeof x.text==='string'&&!x.thought).map(x=>x.text).join('\n').trim();
  if(!txt)throw Object.assign(new Error('Gemini did not return an answer. Try rephrasing or upload a clearer photo.'),{httpStatus:502,code:'GEMINI_EMPTY_RESPONSE'});
  return txt;
 }catch(error){
  if(error.httpStatus)throw error;
  const issue=classifyConnectionError(error);
  throw Object.assign(new Error(issue.error),{httpStatus:issue.status,code:issue.code});
 }finally{clearTimeout(timer)}
}
