const json=(res,status,data)=>res.status(status).setHeader('Content-Type','application/json; charset=utf-8').send(JSON.stringify(data));
export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 if(process.env.ALLOWED_ORIGIN&&req.headers.origin&&req.headers.origin!==process.env.ALLOWED_ORIGIN)return json(res,403,{error:'Origin not allowed'});
 if(!process.env.OPENAI_API_KEY)return json(res,503,{error:'Plant Doctor requires a server-side OPENAI_API_KEY. Image diagnosis is not active yet.',code:'NOT_CONFIGURED'});
 const {image,crop='Unknown crop',symptoms='',language='ha'}=req.body||{};
 if(typeof image!=='string'||!/^data:image\/(jpeg|png|webp);base64,/.test(image)||image.length>5_500_000)return json(res,400,{error:'Upload a PNG, JPEG or WEBP image under 4 MB'});
 const instructions=`You are SYSMART AI Plant Doctor, a cautious crop health advisor. Analyze the attached crop image and contextual symptoms. Never claim certainty from one image, never fabricate a confidence percentage and do not identify a specific active pesticide ingredient or dose. Return plain text in ${language==='ha'?'Hausa':'English'} with short labeled sections: Visible observations, 2-3 possible explanations, how to verify, safe immediate actions, when to consult a local extension officer. Consider water stress, nutrient deficiency, fungi, bacteria, pests; be explicit if photo is insufficient. Plant: ${String(crop).slice(0,80)}. Reported symptoms: ${String(symptoms).slice(0,500)}.`;
 try {
  const response=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.OPENAI_API_KEY}`},body:JSON.stringify({model:process.env.OPENAI_VISION_MODEL||process.env.OPENAI_MODEL||'gpt-4o-mini',max_tokens:950,messages:[{role:'system',content:instructions},{role:'user',content:[{type:'text',text:'Assess this photo cautiously. If image quality is poor, explain what extra photos are needed.'},{type:'image_url',image_url:{url:image,detail:'low'}}]}]})});
  const data=await response.json();
  if(!response.ok)return json(res,502,{error:data?.error?.message||'Image analysis service error'});
  return json(res,200,{analysis:data?.choices?.[0]?.message?.content||'No analysis returned',disclaimer:'Preliminary AI guidance. Confirm with a local agricultural professional before treatment.'});
 }catch(e){return json(res,502,{error:'Unable to analyze image at present. Please try again.'})}
}
