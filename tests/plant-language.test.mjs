import test from 'node:test';
import assert from 'node:assert/strict';
import plantHandler from '../api/plant-doctor.js';
import {renderPlantReport} from '../plant-report-view.js';
const esc=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
test('Hausa renderer localizes report headings without altering body facts',()=>{
 const report={plantName:'Tumatir',healthAssessment:'Ganye suna kore',recommendedActions:['Yi gwajin kasa'],language:'ha'};
 const html=renderPlantReport(report,{esc,icon:()=>''});
 assert.match(html,/RAHOTON SHUKARKA/);
 assert.match(html,/Yanayin lafiyar shuka/);
 assert.match(html,/Ganye suna kore/);
});
test('English renderer keeps English labels',()=>{
 const report={plantName:'Tomato',language:'en'};
 assert.match(renderPlantReport(report,{esc,icon:()=>''}),/YOUR PLANT ASSESSMENT/);
});
test('Plant Doctor passes Hausa language to Gemini and returns the same language',async()=>{
 const prior=process.env.GEMINI_API_KEY,oldFetch=globalThis.fetch;
 process.env.GEMINI_API_KEY='test-key';
 let payload,requestUrl;
 globalThis.fetch=async(url,options)=>{
  requestUrl=url;payload=JSON.parse(options.body);
  return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify({plantName:'Tumatir',healthAssessment:'Ganyen suna da lafiya',recommendedActions:['Duba ruwa']})}]}}]})};
 };
 const response={statusCode:0,status(status){this.statusCode=status;return this},setHeader(){return this},send(value){this.data=JSON.parse(value);return this}};
 try{
  await plantHandler({method:'POST',body:{language:'ha',image:'data:image/jpeg;base64,YWJj'}},response);
  assert.equal(response.statusCode,200);
  assert.equal(response.data.report.language,'ha');
  assert.match(payload.systemInstruction.parts[0].text,/natural Hausa/);
  assert.match(payload.contents[0].parts[1].inlineData.mimeType,/image/);
 }finally{globalThis.fetch=oldFetch;if(prior===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=prior;}
});
test('Unsupported language safely defaults to English',async()=>{
 const saved=process.env.GEMINI_API_KEY,oldFetch=globalThis.fetch;process.env.GEMINI_API_KEY='test-key';
 globalThis.fetch=async()=>({ok:true,json:async()=>({candidates:[{content:{parts:[{text:'{"plantName":"Tomato"}'}]}}]})});
 const response={statusCode:0,status(c){this.statusCode=c;return this},setHeader(){return this},send(s){this.data=JSON.parse(s);return this}};
 try{await plantHandler({method:'POST',body:{language:'random',image:'data:image/jpeg;base64,YWJj'}},response);assert.equal(response.data.report.language,'en')}
 finally{globalThis.fetch=oldFetch;if(saved===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=saved;}
});
