import test from 'node:test';import assert from 'node:assert/strict';import {money,escapeHtml,totals,createPlan,weatherLabel} from '../core.js';
test('formats Naira',()=>assert.equal(money(4526000),'₦4,526,000'));
test('escapes user HTML',()=>assert.equal(escapeHtml(`<img src="x" onerror='bad'>`),'&lt;img src=&quot;x&quot; onerror=&#39;bad&#39;&gt;'));
test('transactions calculate net profit for farm',()=>assert.deepEqual(totals([{farmId:'one',type:'income',amount:800},{farmId:'one',type:'expense',amount:300},{farmId:'two',type:'income',amount:60}],'one'),{income:800,expenses:300,profit:500}));
test('crop plan milestones and dates',()=>{const p=createPlan('Masara',2,'2026-10-22','Rainfed');assert.equal(p.expectedHarvest,'2027-02-09');assert.equal(p.milestones.length,5)});
test('rejects nonsensical area',()=>assert.throws(()=>createPlan('Masara',0,'2026-10-22','Rainfed')));
test('weather label rain',()=>assert.match(weatherLabel(63),/Rain/));
