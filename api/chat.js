import {configured,modelFor,generateGemini} from './gemini.js';
const send=(res,status,data)=>res.status(status).setHeader('Content-Type','application/json; charset=utf-8').send(JSON.stringify(data));
export default async function handler(req,res){
 if(req.method!=='POST')return send(res,405,{error:'Method not allowed'});
 if(process.env.ALLOWED_ORIGIN&&req.headers.origin&&req.headers.origin!==process.env.ALLOWED_ORIGIN)return send(res,403,{error:'Origin not allowed'});
 if(!configured())return send(res,503,{code:'NOT_CONFIGURED',error:'Add GEMINI_API_KEY in Vercel Production to enable the AI Advisor.'});
 const {messages=[],language='en',farmContext=''}=req.body||{};
 if(!Array.isArray(messages)||!messages.length||messages.length>20)return send(res,400,{error:'Provide 1 to 24 chat messages'});
 const conversation=messages.filter(m=>m&&['user','assistant'].includes(m.role)&&typeof m.content==='string'&&m.content.trim()).map(m=>({role:m.role,content:m.content.trim().slice(0,2200)}));
 if(!conversation.length||conversation.at(-1).role!=='user')return send(res,400,{error:'The latest message must be from a farmer'});
 if(conversation.reduce((n,m)=>n+m.content.length,0)>22000)return send(res,413,{error:'Conversation too long. Start a new chat.'});
 const systemInstruction=`You are SYSMART AI from SYLUTION, a practical agricultural advisor for Nigerian and African farmers. Answer in ${language==='ha'?'natural Hausa unless otherwise requested':'clear English unless otherwise requested'}. Help with planting, disease screening, pests, irrigation, farming costs, and farm planning. Ask relevant questions if location, crop or growth stage is unknown. Do not pretend to know live forecasts, soil test results or current market prices. Do not claim a definitive crop diagnosis without evidence. Avoid unverified chemical pesticides, dosages and hazardous mixing. Recommend a local agricultural expert for serious problems. Be direct, useful and honest about uncertainty. Use brief answers of about 60-130 words unless the farmer requests details. Respond in the language of the farmer. Farmer-provided context: ${String(farmContext).slice(0,1100)}`;
 const contents=conversation.map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]}));
 try{const reply=await generateGemini({model:modelFor('chat'),contents,systemInstruction,maxOutputTokens:760});return send(res,200,{reply,provider:'Gemini'});}
 catch(error){return send(res,error.httpStatus||502,{error:error.message||'Gemini unavailable',code:error.code||'GEMINI_ERROR'});}
}
