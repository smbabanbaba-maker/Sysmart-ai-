import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyProviderError,classifyConnectionError} from '../api/provider-errors.js';
test('bad API key is identified without disclosure',()=>{
 const r=classifyProviderError(401,'invalid_api_key');
 assert.equal(r.code,'INVALID_AI_KEY');
 assert.doesNotMatch(r.error,/sk-[A-Za-z0-9]/);
});
test('billing and rate limit are differentiated',()=>{
 assert.equal(classifyProviderError(429,'insufficient_quota').code,'AI_BILLING_REQUIRED');
 assert.equal(classifyProviderError(429,'rate_limit_exceeded').code,'AI_RATE_LIMITED');
});
test('model permissions are actionable',()=>{
 assert.equal(classifyProviderError(404,'model_not_found').code,'AI_MODEL_UNAVAILABLE');
 assert.equal(classifyProviderError(403,'permission_denied').code,'AI_PERMISSION_DENIED');
});
test('provider errors do not expose raw API messages',()=>{
 assert.equal(classifyProviderError(502,'unexpected').code,'AI_PROVIDER_ERROR');
 assert.match(classifyConnectionError({name:'TimeoutError'}).error,/too long/i);
});

test('quota codes and error types are actionable',()=>{for(const x of ['credit_balance_exhausted','organization_usage_limit_exceeded','organization_spend_limit_exceeded','project_spend_limit_exceeded'])assert.equal(classifyProviderError(429,x).code,'AI_BILLING_REQUIRED');assert.equal(classifyProviderError(429,'unknown','insufficient_quota').code,'AI_BILLING_REQUIRED');assert.equal(classifyProviderError(429,'rate_limit_exceeded').code,'AI_RATE_LIMITED')});
