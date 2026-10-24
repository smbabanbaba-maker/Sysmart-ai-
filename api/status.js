export default function handler(req,res){
 res.setHeader('Content-Type','application/json; charset=utf-8');
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).send(JSON.stringify({error:'Method not allowed'}));
 const configured=Boolean(process.env.OPENAI_API_KEY);
 return res.status(200).send(JSON.stringify({status:'ok',features:{advisor:configured,plantDoctor:configured},storage:'local-device',cloudSync:false}));
}
