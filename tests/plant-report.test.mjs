import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePlantReport} from '../api/plant-report-normalizer.js';
import {renderPlantReport,cropEmoji} from '../plant-report-view.js';
import {escapeHtml} from '../core.js';
const esc=s=>escapeHtml(String(s));
const icon=name=>'<i>'+esc(name)+'</i>';
test('identifies up to four real crop candidates and handles uncertain stage',()=>{
 const report=normalizePlantReport({plantName:'Mixed crops — closer photo required',identifiedPlants:[{name:'Tomato',type:'crop',confidence:'medium',evidence:'Visible tomato fruits'},{name:'Maize',type:'crop',confidence:'low',evidence:'Grass-like leaves'}],healthStatus:'unclear',growthStage:'Not clear from photo',weedAssessment:{status:'unclear',details:'Weeds cannot be separated from crops at this distance'},careNeeds:{water:'Check soil before watering'}});
 assert.equal(report.identifiedPlants.length,2);assert.equal(report.healthStatus,'unclear');assert.equal(report.weedAssessment.status,'unclear');
 assert.match(renderPlantReport(report,{esc,icon}),/Tomato/);assert.match(renderPlantReport(report,{esc,icon}),/Maize/);
});
test('unknown image never invents species or confident diagnosis',()=>{
 const report=normalizePlantReport({plantName:'Plant not identified',identifiedPlants:[],likelyProblem:'Unable to determine from this photo'});
 assert.equal(report.identifiedPlants.length,0);assert.equal(report.healthStatus,'unclear');assert.match(renderPlantReport(report,{esc,icon}),/No individual crop or weed species/);
});
test('legacy saved reports remain readable',()=>{
 const report={plantName:'Tomato',visibleSigns:['Yellow leaves'],recommendedActions:['Inspect leaves'],prevention:['Remove debris'],certainty:'Low'};
 const html=renderPlantReport(report,{esc,icon});
 assert.match(html,/Tomato/);assert.match(html,/Yellow leaves/);assert.match(html,/Inspect leaves/);
});
test('icon mapping is deterministic and unknown crops remain generic',()=>{
 assert.equal(cropEmoji('Tomato'),'🍅');assert.equal(cropEmoji('Maize'),'🌽');assert.equal(cropEmoji('onion'),'🧅');assert.equal(cropEmoji('Unknown exotic plant'),'🌿');
});
test('untrusted Gemini content is HTML-escaped across all fields',()=>{
 const report=normalizePlantReport({plantName:'<img src=x onerror=alert(1)>',healthAssessment:'<script>bad</script>',identifiedPlants:[{name:'<svg onload=alert(1)>',type:'crop',evidence:'<b>fake</b>'}],careNeeds:{water:'<iframe>'},recommendedActions:['<button onclick=alert(1)>Press</button>']});
 const html=renderPlantReport(report,{esc,icon});
 assert.doesNotMatch(html,/<script>|<iframe>|<svg onload|<button onclick|<img src=x/);
 assert.match(html,/&lt;script&gt;/);
});
test('oversized arrays, untrusted health states and strings are bounded',()=>{
 const report=normalizePlantReport({healthStatus:'healthy-according-to-me',urgency:'urgent-spray',identifiedPlants:Array(10).fill({name:'Tomato',confidence:'perfect',type:'disease'}) ,visibleSigns:Array(20).fill('x')});
 assert.equal(report.healthStatus,'unclear');assert.equal(report.urgency,'monitor');assert.equal(report.identifiedPlants.length,4);assert.equal(report.identifiedPlants[0].confidence,'low');assert.equal(report.visibleSigns.length,5);
});
