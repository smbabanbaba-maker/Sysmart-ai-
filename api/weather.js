const json=(res,status,data)=>res.status(status).setHeader('Content-Type','application/json; charset=utf-8').send(JSON.stringify(data));
export default async function handler(req,res){
 if(req.method!=='GET')return json(res,405,{error:'Method not allowed'});
 const lat=Number(req.query?.lat),lon=Number(req.query?.lon);
 if(!Number.isFinite(lat)||!Number.isFinite(lon)||lat < -90||lat>90||lon < -180||lon>180)return json(res,400,{error:'Valid latitude and longitude are required'});
 const endpoint=new URL('https://api.open-meteo.com/v1/forecast');
 endpoint.searchParams.set('latitude',String(lat));endpoint.searchParams.set('longitude',String(lon));
 endpoint.searchParams.set('current','temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code');
 endpoint.searchParams.set('daily','weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max');
 endpoint.searchParams.set('forecast_days','5');endpoint.searchParams.set('timezone','auto');
 try {const r=await fetch(endpoint,{headers:{'Accept':'application/json'},signal:AbortSignal.timeout(11000)}); if(!r.ok)throw new Error(); const d=await r.json();res.setHeader('Cache-Control','s-maxage=900, stale-while-revalidate=1800');return json(res,200,{current:d.current,daily:d.daily,units:d.current_units,timeZone:d.timezone,provider:'Open-Meteo',retrievedAt:new Date().toISOString()});}
 catch(e){return json(res,502,{error:'Weather service is currently unavailable. Please try again.'})}
}
