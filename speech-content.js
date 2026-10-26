import {plainAnswer} from './chat-rich-text.js';
export function reportSpeechText(report,language='en'){
 if(typeof report==='string')return plainAnswer(report);
 if(!report||typeof report!=='object')return '';
 const ha=language==='ha',items=[];
 const add=(en,hw,value)=>{const raw=Array.isArray(value)?value.join('. '):value;if(typeof raw==='string'&&raw.trim())items.push((ha?hw:en)+'. '+plainAnswer(raw))};
 add('Plant name','Sunan shuka',report.plantName);
 add('Plant health','Yanayin lafiyar shuka',report.healthAssessment);
 add('Possible problem','Matsalar da ake zargi',report.likelyProblem);
 for(const crop of (Array.isArray(report.plantAssessments)?report.plantAssessments:[]).slice(0,4)){
  add('Crop name','Sunan shuka',crop.name);add('Visible signs','Alamomin da aka gani',crop.visibleEvidence);
  add('Health concern','Matsalar shuka',crop.possibleProblem);add('Water and nutrients','Ruwa da taki',crop.waterAndNutrients);
  add('Next action','Abin da za a fara yi',crop.nextAction);add('Treatment','Kulawa da magani',crop.treatment);
 }
 add('Pests','Kwari',report.pestAssessment?.details);add('Weeds','Ciyayi',report.weedAssessment?.details);
 add('Recommended actions','Matakan da za a dauka',report.recommendedActions);
 add('Treatment guidance','Shawarar magani',report.treatmentGuidance);
 add('Prevention','Hanyoyin kariya',report.prevention);
 add('Certainty','Tabbaci',report.certainty);
 add('When to seek help','Lokacin neman taimako',report.whenToGetHelp);
 return items.join('. ').slice(0,9600);
}
export function chunkSpeech(value,max=240){
 const out=[];let line='';
 for(const word of plainAnswer(value).split(/\s+/).filter(Boolean)){
  if(line&&(line+' '+word).length>max){out.push(line);line=word}else line=line?line+' '+word:word;
 }
 if(line)out.push(line);return out;
}
