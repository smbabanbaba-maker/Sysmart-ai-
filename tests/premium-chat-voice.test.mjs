import test from 'node:test';import assert from 'node:assert/strict';
import {formatChatAnswer,plainAnswer} from '../chat-rich-text.js';
import {chunkSpeech,reportSpeechText} from '../speech-content.js';
test('Markdown bullets headings bold render clean',()=>{
 const x=formatChatAnswer('### Tumatir\n\n* **Ban ruwa:** ruwa.\n* **Taki:** gwaji.\n\n---');
 assert.match(x,/<h3>Tumatir<\/h3>/);assert.match(x,/<strong>Ban ruwa:<\/strong>/);
 assert.match(x,/<ul>/);assert.match(x,/<hr>/);assert.doesNotMatch(x,/###|\*\*|---/);
});
test('untrusted HTML stays escaped',()=>{const x=formatChatAnswer('**Good** <img src=x onerror=alert(1)> <script>alert(2)</script>');assert.match(x,/&lt;img/);assert.doesNotMatch(x,/<img|<script/)});
test('code spans are not treated as bold',()=>{const t=String.fromCharCode(96);assert.match(formatChatAnswer(t+'**hello**'+t),/<code>\*\*hello\*\*<\/code>/)});
test('read aloud removes Markdown',()=>{assert.doesNotMatch(plainAnswer('### Hi\n* **Ban ruwa**\n\n---'),/\*\*|###|---/)});
test('Hausa plant report script is readable',()=>{const s=reportSpeechText({plantName:'Tumatir',healthAssessment:'Ganye kore',recommendedActions:['Duba ruwa']},'ha');assert.match(s,/Sunan shuka/);assert.match(s,/Duba ruwa/)});
test('speech chunks fit a mobile voice',()=>{const p=chunkSpeech('Long answer with information. '.repeat(80),120);assert.ok(p.length>1);assert.ok(p.every(x=>x.length<=120))});
