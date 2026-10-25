// Error messages safe to expose to farmers. Never return provider secrets or raw diagnostics.
export function classifyProviderError(status,code=''){
 const kind=String(code||'').toLowerCase();
 const typeCode=String(arguments[2]||'').toLowerCase();
 const detail=String(arguments[3]||'').toLowerCase().slice(0,500);
 const quota=new Set(['insufficient_quota','billing_hard_limit_reached','credit_balance_exhausted','organization_usage_limit_exceeded','organization_spend_limit_exceeded','project_spend_limit_exceeded']);
 if(status===401)return {status:503,code:'INVALID_AI_KEY',error:'OpenAI rejected the API key. Check the key in Vercel Production and deploy again.'};
 if(status===403)return {status:503,code:'AI_PERMISSION_DENIED',error:'This OpenAI project is not permitted to use the selected model. Check your API project permissions.'};
 if(status===429&&(quota.has(kind)||quota.has(typeCode)||/credit.balance.exhausted|insufficient.quota|exceeded.*quota|spend.limit.exceeded/.test(detail)))return {status:503,code:'AI_BILLING_REQUIRED',error:'OpenAI API billing or credits are unavailable. Enable API billing and check your usage limits.'};
 if(status===429)return {status:429,code:'AI_RATE_LIMITED',error:'OpenAI request or token rate limit reached. Check API Limits before trying again; repeated requests can extend the limit.'};
 if(status===404||kind==='model_not_found')return {status:503,code:'AI_MODEL_UNAVAILABLE',error:'The configured OpenAI model is unavailable to this API project. Check OPENAI_MODEL or OPENAI_VISION_MODEL.'};
 if(status===400)return {status:502,code:'AI_REQUEST_REJECTED',error:'The AI provider could not process this request. Try a shorter question or a clearer plant photo.'};
 return {status:502,code:'AI_PROVIDER_ERROR',error:'The AI provider is temporarily unavailable. Try again later.'};
}
export function classifyConnectionError(error){
 if(error?.name==='TimeoutError'||error?.name==='AbortError')return {status:504,code:'AI_TIMEOUT',error:'The AI request took too long. Check your connection and try again.'};
 return {status:502,code:'AI_NETWORK_ERROR',error:'The AI service could not be reached. Please try again.'};
}
