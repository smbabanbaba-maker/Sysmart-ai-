const json=(res,status,data)=>res.status(status).setHeader('Content-Type','application/json; charset=utf-8').send(JSON.stringify(data));
export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 if(process.env.ALLOWED_ORIGIN&&req.headers.origin&&req.headers.origin!==process.env.ALLOWED_ORIGIN)return json(res,403,{error:'Origin not allowed'});
 if(!process.env.OPENAI_API_KEY)return json(res,503,{error:'AI chat is not connected yet. Configure OPENAI_API_KEY on the server to enable live answers.',code:'NOT_CONFIGURED'});
 const {messages=[],language='ha',farmContext=''}=req.body||{};
 if(!Array.isArray(messages)||messages.length>24||!messages.length)return json(res,400,{error:'Provide up to 24 messages'});
 const cleaned=messages.map(m=>({role:m.role,content:String(m.content||'').slice(0,7000)})).filter(m=>['user','assistant'].includes(m.role)&&m.content);
 if(!cleaned.length||cleaned.at(-1).role!=='user')return json(res,400,{error:'A user message is required'});
 const context=String(farmContext).slice(0,2500);
 const instructions=`You are SYSMART AI, an agricultural advisor built by SYLUTION for Nigerian and African farmers. Answer in ${language==='ha'?'natural Hausa, unless the farmer asks for another language':'clear English, unless the farmer asks for another language'}. Be practical, ask clarifying questions for location, crop, growth stage, season, area, irrigation, and soil testing where needed. Do NOT pretend to know live weather, market prices, lab results or diagnoses. Do not give precise pesticide application rates or hazardous mixing directions without confirmed, locally registered label and professional review. For plant disease, describe possibilities and verification steps, not definitive diagnosis from uncertain data. Be concise, supportive and accurate. If relevant, explain uncertainty. Farm context supplied by farmer: ${context}`;
 try {
  const response=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.OPENAI_API_KEY}`},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-4o-mini',temperature:0.3,max_tokens:1050,messages:[{role:'system',content:instructions},...cleaned]})});
  const data=await response.json();
  if(!response.ok)return json(res,502,{error:data?.error?.message||'AI provider error'});
  return json(res,200,{reply:data?.choices?.[0]?.message?.content||'No answer received'});
 }catch(e){return json(res,502,{error:'AI service could not be reached. Please try again.'})}
}
