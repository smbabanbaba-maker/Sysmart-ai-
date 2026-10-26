// Normalize untrusted Gemini image assessments; no numerical confidence or unsupported diagnosis.
const bounded=(value,fallback='',max=420)=>typeof value==='string'&&value.trim()?value.trim().slice(0,max):fallback;
const items=(value,max=5)=>Array.isArray(value)?value.filter(x=>typeof x==='string'&&x.trim()).slice(0,max).map(x=>x.trim().slice(0,300)):[];
const valid=(value,allowed,fallback)=>allowed.includes(String(value||'').toLowerCase())?String(value).toLowerCase():fallback;
function feature(raw){
 const value=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
 return {
  status:valid(value.status,['observed','suspected','not-visible','unclear'],'unclear'),
  details:bounded(value.details,'Not reliably assessable from this image.',390),
  actions:items(value.actions,3)
 };
}
export function normalizePlantReport(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('Invalid plant report');
 let plants=(Array.isArray(raw.identifiedPlants)?raw.identifiedPlants:[])
  .filter(p=>p&&typeof p==='object'&&typeof p.name==='string'&&p.name.trim())
  .slice(0,4).map(p=>({
   name:bounded(p.name,'Unidentified plant',110),
   type:valid(p.type,['crop','weed','unknown'],'unknown'),
   confidence:valid(p.confidence,['high','medium','low'],'low'),
   evidence:bounded(p.evidence,'Identification is preliminary.',320)
  }));
 const mainName=bounded(raw.plantName,'Plant not identified',150);
 if(!plants.length&&!/not identified|unclear|unknown|mixed|multiple|uncertain/i.test(mainName))
  plants=[{name:mainName,type:'crop',confidence:'low',evidence:'This name is an initial photo-based identification.'}];
 const care=raw.careNeeds&&typeof raw.careNeeds==='object'&&!Array.isArray(raw.careNeeds)?raw.careNeeds:{};
 const issues=Array.isArray(raw.possibleIssues)?raw.possibleIssues.filter(x=>typeof x==='string'&&x.trim()).slice(0,4).map(x=>x.trim().slice(0,210)):[];
 return {
  plantName:mainName,
  identificationNotes:bounded(raw.identificationNotes,'The available image may not identify the plant reliably.'),
  identifiedPlants:plants,
  plantAssessments:(Array.isArray(raw.plantAssessments)?raw.plantAssessments:[]).filter(p=>p&&typeof p==='object'&&typeof p.name==='string'&&p.name.trim()).slice(0,4).map(p=>({
   name:bounded(p.name,'Unidentified plant',110),confidence:valid(p.confidence,['high','medium','low'],'low'),
   healthStatus:valid(p.healthStatus,['healthy-looking','possible-stress','visible-damage','unclear'],'unclear'),
   visibleEvidence:bounded(p.visibleEvidence,'Not clear from photo.',350),possibleProblem:bounded(p.possibleProblem,'Not determined',240),
   pestsAndWeeds:bounded(p.pestsAndWeeds,'Not clear',260),waterAndNutrients:bounded(p.waterAndNutrients,'Check soil locally.',350),
   nextAction:bounded(p.nextAction,'Take a closer photo.',350),treatment:bounded(p.treatment,'Do not spray without diagnosis.',350)
  })),
  growthStage:bounded(raw.growthStage,'Not clear from photo',110),
  healthStatus:valid(raw.healthStatus,['healthy-looking','possible-stress','visible-damage','unclear'],'unclear'),
  urgency:valid(raw.urgency,['routine','monitor','seek-expert'],'monitor'),
  healthAssessment:bounded(raw.healthAssessment,'Plant health cannot be confirmed from a single photo.',750),
  likelyProblem:bounded(raw.likelyProblem,'Unable to determine from this photo',240),
  possibleIssues:issues,
  visibleSigns:items(raw.visibleSigns,5),
  pestAssessment:feature(raw.pestAssessment),
  weedAssessment:feature(raw.weedAssessment),
  careNeeds:{
   water:bounded(care.water,'Moisture needs cannot be assessed from the photo.',290),
   nutrients:bounded(care.nutrients,'Do not assume a nutrient deficiency without further evidence.',290),
   soil:bounded(care.soil,'Check soil type, drainage and compaction on site.',290),
   light:bounded(care.light,'Confirm light requirements after identifying the crop.',290),
   spacing:bounded(care.spacing,'Check crop-specific spacing after plant identification.',290)
  },
  recommendedActions:items(raw.recommendedActions||raw.nextSteps,6),
  treatmentGuidance:bounded(raw.treatmentGuidance,'Do not apply crop medicines or pesticides on the basis of a photo alone. Confirm the issue locally and follow approved labels.',500),
  prevention:items(raw.prevention,5),
  monitoring:items(raw.monitoring,4),
  certainty:bounded(raw.certainty,'Photo-based identification and diagnosis are preliminary.',380),
  imageQuality:bounded(raw.imageQuality,'Take clear daylight photos of an individual plant and affected leaves.',350),
  photoAdvice:items(raw.photoAdvice,4),
  whenToGetHelp:bounded(raw.whenToGetHelp,'Contact a local extension officer if damage spreads, plants wilt, or major crop losses are possible.',420)
 };
}
