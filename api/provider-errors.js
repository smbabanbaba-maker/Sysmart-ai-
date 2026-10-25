// Friendly Google Gemini errors, without passing provider internals or API keys to clients.
export function classifyProviderError(status,reason='',message=''){
 const kind=String(reason||'').toUpperCase(),detail=String(message||'').toLowerCase().slice(0,800);
 if(status===401||/api.key.not.valid|api_key_invalid|invalid api key|expired api key/.test(detail))return {status:503,code:'INVALID_GEMINI_KEY',error:'Google Gemini rejected the API key. Check GEMINI_API_KEY in Vercel Production.'};
 if(status===403||kind==='PERMISSION_DENIED')return {status:503,code:'GEMINI_ACCESS_DENIED',error:'This Google AI Studio project cannot access the selected Gemini model. Check project access and region.'};
 if(status===429||kind==='RESOURCE_EXHAUSTED')return {status:429,code:'GEMINI_QUOTA_LIMIT',error:'Gemini usage limit or free-tier quota has been reached. Check Google AI Studio Usage and Limits.'};
 if(status===404||kind==='NOT_FOUND')return {status:503,code:'GEMINI_MODEL_UNAVAILABLE',error:'The selected Gemini model is not available. Check GEMINI_MODEL in Vercel.'};
 if(status===400||kind==='INVALID_ARGUMENT')return {status:400,code:'GEMINI_BAD_REQUEST',error:'Gemini could not process that request. Try shorter text or a clearer image.'};
 if(status===503||kind==='UNAVAILABLE')return {status:503,code:'GEMINI_UNAVAILABLE',error:'Gemini is temporarily unavailable. Please try again later.'};
 return {status:502,code:'GEMINI_PROVIDER_ERROR',error:'Gemini could not process the request right now.'};
}
export function classifyConnectionError(error){
 if(error?.name==='AbortError'||error?.name==='TimeoutError')return {status:504,code:'GEMINI_TIMEOUT',error:'Gemini response timed out. Try again later.'};
 return {status:502,code:'GEMINI_CONNECTION',error:'Could not connect to Gemini. Check the network and try again.'};
}
