import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyProviderError,classifyConnectionError} from '../api/provider-errors.js';

test('Gemini invalid key returns safe guidance',()=>{
 const problem=classifyProviderError(400,'INVALID_ARGUMENT','API key not valid');
 assert.equal(problem.code,'INVALID_GEMINI_KEY');
 assert.doesNotMatch(problem.error,/AIza[\w-]{15,}/);
});
test('Gemini quotas and throttling give useful guidance',()=>{
 const problem=classifyProviderError(429,'RESOURCE_EXHAUSTED','Resource exhausted, check quota');
 assert.equal(problem.code,'GEMINI_QUOTA_LIMIT');
 assert.match(problem.error,/quota|limit/i);
});
test('unsupported Gemini model and regional permissions are distinguished',()=>{
 assert.equal(classifyProviderError(404,'NOT_FOUND').code,'GEMINI_MODEL_UNAVAILABLE');
 assert.equal(classifyProviderError(403,'PERMISSION_DENIED').code,'GEMINI_ACCESS_DENIED');
});
test('Gemini provider returns safe defaults',()=>{
 assert.equal(classifyProviderError(502,'UNKNOWN').code,'GEMINI_PROVIDER_ERROR');
 assert.equal(classifyProviderError(503,'UNAVAILABLE').code,'GEMINI_UNAVAILABLE');
});
test('network timeouts have explicit friendly errors',()=>{
 const r=classifyConnectionError({name:'TimeoutError'});
 assert.equal(r.code,'GEMINI_TIMEOUT');
 assert.match(r.error,/timed out/i);
});
