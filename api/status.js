import {configured,modelFor} from './gemini.js';
export default function handler(req,res){
 res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).send(JSON.stringify({error:'Method not allowed'}));
 const active=configured();
 return res.status(200).send(JSON.stringify({status:'ok',provider:'Gemini',model:modelFor('chat'),features:{advisor:active,plantDoctor:active},storage:'local-device',cloudSync:false}));
}
