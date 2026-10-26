// SYSMART AI rich plant health report. ALL model strings are HTML-escaped before rendering.
export function cropEmoji(name=''){
 const x=String(name).toLowerCase();
 if(/tomato|tumatir/.test(x))return '🍅';
 if(/maize|corn|masara/.test(x))return '🌽';
 if(/rice|shinkafa|wheat|millet|sorghum/.test(x))return '🌾';
 if(/onion|albasa/.test(x))return '🧅';
 if(/pepper|chili|chilli|barkono/.test(x))return '🌶️';
 if(/cucumber|kokwamba/.test(x))return '🥒';
 if(/bean|cowpea|wake/.test(x))return '🫘';
 if(/potato|dankali/.test(x))return '🥔';
 if(/cassava|manioc|rogo/.test(x))return '🌿';
 if(/lettuce|cabbage|spinach|leafy/.test(x))return '🥬';
 if(/watermelon|melon/.test(x))return '🍉';
 if(/banana|plantain/.test(x))return '🍌';
 if(/weed|grass/.test(x))return '🌱';
 return '🌿';
}
export function renderPlantReport(report,{esc,icon}){
 if(typeof report==='string')return '<div class="pd-report-legacy">'+esc(report).replaceAll('\n','<br>')+'</div>';
 if(!report||typeof report!=='object')return '';
 const clean=(value,fallback='Not clear from the photo')=>esc(String(typeof value==='string'&&value.trim()?value:fallback));
 const list=(value,empty)=>{
  const entries=Array.isArray(value)?value.filter(x=>typeof x==='string'&&x.trim()).slice(0,6):[];
  return entries.length?'<ul class="pd-v2-list">'+entries.map(v=>'<li><span class="pd-v2-check">'+icon('check',14)+'</span><span>'+clean(v)+'</span></li>').join('')+'</ul>':'<p class="pd-v2-muted">'+esc(empty)+'</p>';
 };
 const stage=clean(report.growthStage||'Growth stage uncertain');
 const status=String(report.healthStatus||'unclear').toLowerCase();
 const statusLabel={'healthy-looking':'No obvious damage','possible-stress':'Possible stress','visible-damage':'Visible damage','unclear':'Not yet clear'}[status]||'Not yet clear';
 const statusClass={'healthy-looking':'ok','possible-stress':'watch','visible-damage':'risk','unclear':'unclear'}[status]||'unclear';
 const urgency={'routine':'Routine care','monitor':'Monitor closely','seek-expert':'Ask an expert'}[report.urgency]||'Monitor closely';
 const plants=Array.isArray(report.identifiedPlants)?report.identifiedPlants.slice(0,4).filter(p=>p&&typeof p==='object'&&typeof p.name==='string'&&p.name.trim()):[];
 const main=clean(report.plantName||'Plant not identified');
 const cards=plants.length?plants.map(p=>'<article class="pd-v2-crop"><span class="pd-v2-crop-emoji" aria-hidden="true">'+cropEmoji(p.name)+'</span><div><strong>'+clean(p.name)+'</strong><div class="pd-v2-crop-meta">'+clean(p.type||'plant')+' · '+clean(p.confidence||'low')+' identification confidence</div><p>'+clean(p.evidence,'Identification is preliminary.')+'</p></div></article>').join(''):'<div class="pd-v2-empty">'+icon('search',17)+'<span>No individual crop or weed species can be reliably named from this photo. Take a closer picture of one plant.</span></div>';
 const perPlant=Array.isArray(report.plantAssessments)?report.plantAssessments.slice(0,4):[];
 const plantDetails=perPlant.length?'<section class="pd-v2-section"><h3>🪴 Individual plant health cards</h3><p class="pd-v2-subtitle">Each card is based only on visible evidence.</p><div class="pd-v3-plant-grid">'+perPlant.map(p=>'<article class="pd-v3-plant-card"><div class="pd-v3-plant-head"><span class="pd-v3-plant-icon">'+cropEmoji(p.name)+'</span><div><strong>'+clean(p.name)+'</strong><small>'+clean(p.confidence,'low')+' identification confidence</small></div><span class="pd-v3-health">'+clean({'healthy-looking':'Looks healthy','possible-stress':'Possible stress','visible-damage':'Visible damage','unclear':'Unclear'}[p.healthStatus]||'Unclear')+'</span></div><dl><dt>👁️ Visible signs</dt><dd>'+clean(p.visibleEvidence)+'</dd><dt>🦠 Possible problem</dt><dd>'+clean(p.possibleProblem)+'</dd><dt>🐛 Pests and weeds</dt><dd>'+clean(p.pestsAndWeeds)+'</dd><dt>💧 Water and nutrients</dt><dd>'+clean(p.waterAndNutrients)+'</dd><dt>✅ What to do first</dt><dd>'+clean(p.nextAction)+'</dd><dt>🩺 Treatment guidance</dt><dd>'+clean(p.treatment)+'</dd></dl></article>').join('')+'</div></section>':'';
 const pests=report.pestAssessment&&typeof report.pestAssessment==='object'?report.pestAssessment:{};
 const weeds=report.weedAssessment&&typeof report.weedAssessment==='object'?report.weedAssessment:{};
 const care=report.careNeeds&&typeof report.careNeeds==='object'?report.careNeeds:{};
 const issueList=Array.isArray(report.possibleIssues)?report.possibleIssues:[];
 const evidence=report.visibleSigns||[];
 const condition=(title,emoji,detail,kind)=>'<article class="pd-v2-observation"><span class="pd-v2-obs-emoji" aria-hidden="true">'+emoji+'</span><div><div class="pd-v2-feature-head"><strong>'+title+'</strong><span class="pd-v2-status-soft">'+clean(detail.status==='observed'?'Visible evidence':detail.status==='suspected'?'Possible':detail.status==='not-visible'?'Not visible':'Unclear')+'</span></div><p>'+clean(detail.details,'Cannot be reliably assessed from this photo.')+'</p>'+list(detail.actions,kind==='weed'?'Confirm which plants are crops before removing any growth.':'Inspect leaf undersides and stems for identifiable signs.')+'</div></article>';
 const careTile=(emoji,title,key)=>'<div class="pd-v2-care-item"><span aria-hidden="true">'+emoji+'</span><div><strong>'+title+'</strong><p>'+clean(care[key],'Cannot confirm this need from the image alone.')+'</p></div></div>';
 return '<div class="pd-v2-report" aria-live="polite">'
  +'<section class="pd-v2-identity"><div class="pd-v2-identity-icon" aria-hidden="true">'+cropEmoji(report.plantName)+'</div><div class="pd-v2-identity-content"><span class="pd-v2-kicker">YOUR PLANT ASSESSMENT</span><h2>'+main+'</h2><p>'+clean(report.identificationNotes,'Identification is preliminary.')+'</p><div class="pd-v2-tags"><span>'+icon('leaf',13)+' '+stage+'</span><span>'+icon('search',13)+' '+clean(report.certainty,'Photo-based assessment, not a diagnosis')+'</span></div></div></section>'
  +'<div class="pd-v2-summary"><div class="pd-v2-summary-top"><span class="pd-v2-health pd-v2-health-'+statusClass+'"><i></i>'+statusLabel+'</span><span class="pd-v2-urgency">'+urgency+'</span></div><h3>Plant health overview</h3><p>'+clean(report.healthAssessment,'A single image cannot confirm plant health.')+'</p><div class="pd-v2-issue"><strong>Possible health concern</strong><span>'+clean(report.likelyProblem,'No specific issue can be determined from this image.')+'</span></div></div>'
  +'<section class="pd-v2-section"><h3><span>🌱</span> Plants identified in this photo</h3><p class="pd-v2-subtitle">Names are preliminary. Only visually distinguishable plants should appear here.</p><div class="pd-v2-crops">'+cards+'</div></section>'
  +plantDetails
  +'<section class="pd-v2-section"><h3><span>🔎</span> What the image actually shows</h3>'+list(evidence,'No distinct symptoms or plant features can be confidently assessed.')+(issueList.length?'<div class="pd-v2-possibilities"><strong>Possible explanations (not diagnoses)</strong>'+list(issueList,'')+'</div>':'')+'</section>'
  +'<section class="pd-v2-section"><h3><span>🐛</span> Pests and weeds</h3><div class="pd-v2-observations">'+condition('Pests and insects','🐛',pests,'pest')+condition('Weeds and competing growth','🌱',weeds,'weed')+'</div></section>'
  +'<section class="pd-v2-section"><h3><span>💧</span> What your crop may need</h3><p class="pd-v2-subtitle">Photo-based guidance only; soil moisture and nutrients require checks.</p><div class="pd-v2-care-grid">'+careTile('💦','Watering','water')+careTile('🧪','Nutrients and fertilizer','nutrients')+careTile('🌍','Soil and drainage','soil')+careTile('☀️','Sunlight','light')+careTile('🌾','Spacing and airflow','spacing')+'</div></section>'
  +'<section class="pd-v2-section pd-v2-plan"><h3><span>✅</span> Recommended next steps</h3>'+list(report.recommendedActions,'Take clearer images and seek local advice before treating.')+'</section>'
  +'<section class="pd-v2-section pd-v2-treatment"><h3><span>🩺</span> Treatment guidance</h3><p>'+clean(report.treatmentGuidance,'Do not apply pesticides or crop medicines until the issue is confirmed locally.')+'</p></section>'
  +'<div class="pd-v2-duo"><section class="pd-v2-section"><h3><span>🛡️</span> Prevention</h3>'+list(report.prevention,'Monitor and maintain clean crop growing conditions.')+'</section><section class="pd-v2-section"><h3><span>📅</span> What to monitor</h3>'+list(report.monitoring,'Watch for spreading symptoms and changes in leaf health.')+'</section></div>'
  +'<section class="pd-v2-section pd-v2-photos"><h3><span>📷</span> Get a more accurate result</h3><p>'+clean(report.imageQuality,'A closer, well-lit photo will be more helpful.')+'</p>'+list(report.photoAdvice,['Take a full plant photo and a close-up of both sides of one leaf.'].join(''))+'<button type="button" class="pd-v2-retake" data-action="plant-camera">'+icon('image',17)+' Take a closer photo</button></section>'
  +'<section class="pd-v2-help"><strong>'+icon('info',16)+' When to contact an expert</strong><p>'+clean(report.whenToGetHelp,'Seek local agricultural extension support if symptoms spread or plants decline.')+'</p></section>'
  +'<p class="pd-v2-disclaimer">'+icon('shield',16)+' AI photo screening is not a laboratory diagnosis. Confirm the cause before applying pesticides, crop medicines or expensive treatments.</p>'
  +'</div>';
}
