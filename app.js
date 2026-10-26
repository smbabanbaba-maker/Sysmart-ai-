import {renderPlantReport} from './plant-report-view.js';
import {streamFarmAnswer} from './chat-stream-client.js';
import {postJsonWithRecovery} from './chat-network.js';
import { CITIES, CROPS, money, escapeHtml as esc, totals, safeDate, createPlan, weatherLabel, uid } from './core.js';

const STORAGE_KEY = 'sysmart-ai-mvp-v1';
const DRAFT_KEY = 'sysmart-ai-chat-draft-v1';
const PAGE_KEY = 'sysmart-ai-last-page-v1';
const VALID_PAGES = new Set(['dashboard','farms','planner','chat','plant','weather','records','settings']);
function readPage(){try{const page=sessionStorage.getItem(PAGE_KEY);return VALID_PAGES.has(page)?page:'dashboard'}catch{return 'dashboard'}}
function storePage(page){try{sessionStorage.setItem(PAGE_KEY,page)}catch{}}
function storeChatDraft(value){try{if(value)localStorage.setItem(DRAFT_KEY,value.slice(0,6000));else localStorage.removeItem(DRAFT_KEY)}catch{}}
function readChatDraft(){try{return (localStorage.getItem(DRAFT_KEY)||'').slice(0,6000)}catch{return ''}}

const PHOTO = {
  landscape: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1700&q=80',
  rows: 'https://images.unsplash.com/photo-1719757168062-3ceb06988532?auto=format&fit=crop&w=900&q=80',
  farm: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=900&q=80',
  tomato: 'https://images.unsplash.com/photo-1546470427-e26264be0b0d?auto=format&fit=crop&w=900&q=80',
  maize: 'https://images.unsplash.com/photo-1601593768795-63925c6f1f17?auto=format&fit=crop&w=900&q=80',
  greenhouse: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80',
};
let saved={};
try { saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{}; }catch{}
let state={
  profile:{name:'Farmer',lang:'en',city:'Kano'},farms:[],transactions:[],
  chats:[{id:'welcome',title:'New conversation',messages:[]}],activeChat:'welcome',plans:[],plantReports:[],onboardingSeen:false,showDemo:false,
  ...saved, profile:{name:'Farmer',lang:'en',city:'Kano',...(saved.profile||{}),lang:'en'}
};
for(const field of ['farms','transactions','chats','plans','plantReports'])if(!Array.isArray(state[field]))state[field]=[];
// Retire legacy fake demo records without affecting real user-created content.
state.farms=state.farms.filter(x=>!x.demo);
state.transactions=state.transactions.filter(x=>!x.demo);
state.showDemo=false;
state.onboardingSeen=Boolean(state.onboardingSeen);
if(!state.chats.length)state.chats=[{id:'welcome',title:'New conversation',messages:[]}];
if(!state.chats.some(c=>c.id===state.activeChat))state.activeChat=state.chats[0].id;
const ui={page:readPage(),sidebar:false,modal:null,chatInput:readChatDraft(),chatBusy:false,chatLiveText:'',chatPendingQuestion:'',weather:null,weatherError:'',weatherBusy:false,weatherCity:null,weatherFetchedAt:null,weatherStale:false,photo:null,plantResult:null,plantError:'',plantBusy:false,aiReady:null,aiChecked:false,aiError:'',plantSaved:false,chatError:null,plan:null,recordFilter:'all'};
const svgPaths={
 home:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
 farm:'<path d="M3 20V9l9-6 9 6v11H3Z"/><path d="M9 20v-8h6v8"/>',leaf:'<path d="M20 4C7 4 3 10 4 17c4 5 14 4 16-13ZM3 21c4-6 8-10 14-12"/>',
 chat:'<path d="M20 11.5a8 8 0 0 1-8 8.5 9 9 0 0 1-4-.9L3 21l1.9-5A9 9 0 1 1 20 11.5Z"/>',
 doctor:'<path d="M12 3v18M3 12h18"/><circle cx="12" cy="12" r="9"/>',cloud:'<path d="M20 17a4 4 0 0 0-1-7.9 7 7 0 0 0-13 2A4 4 0 0 0 6 19h13"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',
 finance:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m7 16 4-4 3 2 4-6"/>',
 sensor:'<circle cx="12" cy="12" r="4"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5M5 5l3 3m8 8 3 3M19 5l-3 3m-8 8-3 3"/>',
 market:'<path d="M3 10h18l-2-6H5l-2 6ZM5 10v11h14V10M9 21v-7h6v7"/>',
 settings:'<circle cx="12" cy="12" r="3"/><path d="m9 3-.5 2.5L6 7 4 6l-2 3 2 2v2l-2 2 2 3 2-1 2.5 1.5L9 21h6l.5-2.5L18 17l2 1 2-3-2-2v-2l2-2-2-3-2 1-2.5-1.5L15 3H9Z"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',chevron:'<path d="m9 18 6-6-6-6"/>',menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',close:'<path d="M5 5l14 14M19 5 5 19"/>',
 location:'<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5M17.5 17.5 19 19m0-14-1.5 1.5M6.5 17.5 5 19"/>',
 wind:'<path d="M3 8h13a3 3 0 1 0-3-3M2 12h17a3 3 0 1 1-3 3M3 17h7a2 2 0 1 1-2 2"/>',
 drop:'<path d="M12 2C8 8 5 11 5 15a7 7 0 0 0 14 0c0-4-3-7-7-13Z"/>',
 image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1.5"/><path d="m21 16-5-5L5 21"/>',
 upload:'<path d="M12 16V4m-5 5 5-5 5 5M4 16v4h16v-4"/>',
 shield:'<path d="m12 2 9 4v6c0 5-4 8-9 10-5-2-9-5-9-10V6l9-4Z"/><path d="m8 12 3 3 5-6"/>',
 check:'<path d="m5 12 4 4L19 6"/>',mic:'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5m-4 0h8"/>',
 send:'<path d="m22 2-7 20-4-9-9-4 20-7ZM11 13 22 2"/>',
 download:'<path d="M12 3v13m-5-5 5 5 5-5M4 17v4h16v-4"/>',
 trash:'<path d="M4 7h16M10 4h4M6 7l1 14h10l1-14"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7h.01"/>',
 logout:'<path d="M9 4H4v16h5M12 12h9m-4-4 4 4-4 4"/>',
 spark:'<path d="m12 2 2 7 7 3-7 2-2 8-3-8-7-2 7-3 3-7Z"/>',
 wallet:'<rect x="2" y="6" width="20" height="15" rx="3"/><path d="M2 10h20M6 6V3h13"/>',
 bars:'<path d="M5 20v-7h3v7M11 20V5h3v15M17 20v-11h3v11"/>',
 globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-5 5-5 13 0 18M12 3c5 5 5 13 0 18"/>'
};
const icon=(name,size=20)=>`<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${svgPaths[name]||svgPaths.leaf}</svg>`;
const NAV=[['dashboard','home','Home'],['chat','spark','AI Advisor'],['plant','doctor','Plant Doctor'],['farms','farm','My Farms'],['planner','calendar','Crop Planner'],['weather','cloud','Weather'],['records','finance','Farm Records']];
const photoFor=(c)=>({Tumatir:PHOTO.tomato,Masara:PHOTO.maize,Kokwamba:PHOTO.greenhouse,Shinkafa:PHOTO.rows,Albasa:PHOTO.farm,Barkono:PHOTO.tomato,Wake:PHOTO.rows,Dankali:PHOTO.farm}[c]||PHOTO.rows);
const cropInfo=(name)=>CROPS.find(x=>x.name===name)||CROPS[0];
const cropName=(name)=>cropInfo(name).en;
const formatNumber=(n)=>new Intl.NumberFormat('en-NG',{maximumFractionDigits:2}).format(Number(n)||0);
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify({...state,profile:{...state.profile,lang:'en'}}));}catch{notify('Could not save changes in this browser.','error')}}
function notify(message,kind='success'){const e=document.createElement('div');e.className='toast '+kind;e.textContent=message;document.getElementById('toasts').append(e);setTimeout(()=>e.remove(),4600)}
const firstName=()=>esc((state.profile.name||'Farmer').split(' ')[0]);

function brand(){return `<div class="brand-icon">${icon('leaf',29)}</div><div class="brand-label"><strong>SYSMART <em>AI</em></strong><small>from SYLUTION</small></div>`}
function sidebar(){return `<aside class="sidebar ${ui.sidebar?'show':''}">
<div class="sidebar-head">${brand()}<button class="icon-button sidebar-dismiss" data-action="menu" aria-label="Close navigation">${icon('close')}</button></div>
<div class="side-section-label">YOUR WORKSPACE</div>
<nav class="side-nav">${NAV.map(([p,i,n])=>`<button data-page="${p}" class="side-link ${ui.page===p?'active':''}" ${ui.page===p?'aria-current="page"':''}>${icon(i,19)}<span>${n}</span></button>`).join('')}</nav>
<div class="sidebar-grow"></div>
<button data-page="settings" class="side-link ${ui.page==='settings'?'active':''}">${icon('settings',18)}<span>Settings</span></button>
<div class="v4-side-divider"></div>
<button class="side-profile" data-page="settings"><span class="avatar">${esc(state.profile.name.charAt(0).toUpperCase())}</span><span><b>${esc(state.profile.name)}</b><small>Personal workspace</small></span>${icon('chevron',16)}</button>
<div class="v4-side-credit">SYSMART AI <span>from SYLUTION</span></div>
</aside>`}
function header(){return `<header class="topbar v4-topbar"><button class="icon-button hamburger" aria-label="Open navigation" data-action="menu">${icon('menu',22)}</button>
<div class="mobile-brand">${brand()}</div><div class="crumbs v4-desktop-crumb"><span>SYSMART AI</span>${icon('chevron',14)}<strong>${ui.page==='dashboard'?'Home':(NAV.find(x=>x[0]===ui.page)?.[2]||'Settings')}</strong></div>
<div class="top-right"><button class="v4-top-location" data-page="weather">${icon('location',15)} ${esc(state.profile.city)}</button><button class="profile-round" data-page="settings" aria-label="Profile and settings">${esc(state.profile.name.charAt(0).toUpperCase())}</button></div></header>`}
function bottomNav(){const items=[['dashboard','home','Home'],['farms','farm','My Farms'],['chat','chat','AI Chat'],['plant','doctor','Doctor']];return `<nav class="mobile-tabs" aria-label="Primary mobile navigation">${items.map(([p,i,n])=>`<button data-page="${p}" class="${ui.page===p?'active':''}">${icon(i,21)}<span>${n}</span></button>`).join('')}<button data-action="menu" aria-label="Open all tools and settings">${icon('menu',21)}<span>More</span></button></nav>`;}

function cover(f){return `<div class="farm-image" style="background-image:linear-gradient(180deg,transparent 58%,rgba(1,43,29,.3)),url('${photoFor(f.crop)}')"><span class="farm-status">${icon('check',13)} ${esc(f.status||'Growing')}</span></div>`}
function farmCard(f){return `<button data-action="view-farm" data-id="${esc(f.id)}" class="farm-tile">${cover(f)}<div class="farm-tile-content"><div class="farm-tile-title"><strong>${esc(f.name)}</strong>${f.demo?'<span class="sample-chip">SAMPLE</span>':''}</div><p>${icon('location',14)} ${esc(f.location)} · ${formatNumber(f.area)} hectares</p><div class="farm-tile-bottom"><span>${cropInfo(f.crop).emoji} ${cropName(f.crop)}</span>${icon('arrow',16)}</div></div></button>`}
function statTile(label,value,meta,ic,kind=''){return `<div class="stat-tile"><div class="stat-icon ${kind}">${icon(ic,21)}</div><div class="stat-copy"><span>${label}</span><strong>${value}</strong><small>${meta}</small></div></div>`}
function feature(p,i,title,subtitle,kind){return `<button data-page="${p}" class="quick-tile"><span class="quick-icon ${kind}">${icon(i,22)}</span><span><strong>${title}</strong><small>${subtitle}</small></span>${icon('chevron',17)}</button>`}

function weatherNumber(n,unit=""){return n!==undefined&&n!==null&&n!==""&&Number.isFinite(Number(n))?`${Math.round(Number(n))}${unit}`:"—";}
function weatherIcon(code){if(code===0)return "sun";if([1,2,3,45,48].includes(code))return "cloud";return [51,53,55,61,63,65,80,81,82,95,96,99].includes(code)?"drop":"cloud";}
function weatherPanel(){
 const data=ui.weatherCity===state.profile.city?ui.weather:null,c=data?.current,day=data?.daily;
 const valid=c?.temperature_2m!==undefined&&c?.temperature_2m!==null&&Number.isFinite(Number(c.temperature_2m));
 const prob=day?.precipitation_probability_max?.[0];
 const updated=ui.weatherFetchedAt&&!isNaN(Date.parse(ui.weatherFetchedAt))?new Date(ui.weatherFetchedAt).toLocaleTimeString("en-NG",{hour:"numeric",minute:"2-digit"}):"";
 const days=valid&&day?.time?.length?day.time.slice(0,3).map((d,i)=>`<span class="v6-day v8-day-${weatherIcon(day.weather_code?.[i]??c.weather_code)}"><small>${i===0?"Today":new Intl.DateTimeFormat("en-NG",{weekday:"short"}).format(new Date(d+"T12:00:00"))}</small>${icon(weatherIcon(day.weather_code?.[i]??c.weather_code),16)}<b>${weatherNumber(day.temperature_2m_max?.[i],"°")}</b></span>`).join(""):"";
 return `<section class="v6-weather" aria-label="Local weather for ${esc(state.profile.city)}">
 <div class="v6-w-top"><div><span class="v6-w-eyebrow">${icon("cloud",15)} LOCAL FARM WEATHER</span><h2>${icon("location",16)} ${esc(state.profile.city)}, Nigeria</h2></div><button data-action="load-weather" aria-label="Refresh weather conditions" ${ui.weatherBusy?"disabled":""}>${icon("arrow",16)} ${ui.weatherBusy?"Updating":"Refresh"}</button></div>
 ${valid?`<div class="v6-w-main"><div class="v6-w-current"><span class="v6-w-condition-icon v8-weather-${weatherIcon(c.weather_code)}">${icon(weatherIcon(c.weather_code),40)}</span><div><strong>${weatherNumber(c.temperature_2m,"°")}<small>C</small></strong><span>${esc(weatherLabel(c.weather_code))}</span></div></div>
 <div class="v6-w-stats"><div class="v8-humidity"><span>${icon("drop",15)} Humidity</span><strong>${weatherNumber(c.relative_humidity_2m,"%")}</strong></div><div class="v8-rain"><span>${icon("cloud",15)} Rain chance <sup>today</sup></span><strong>${weatherNumber(prob,"%")}</strong></div><div class="v8-wind"><span>${icon("wind",15)} Wind speed</span><strong>${weatherNumber(c.wind_speed_10m)} <small>km/h</small></strong></div></div></div>
 <div class="v6-w-forecast">${days?`<div class="v6-w-days">${days}</div>`:""}<button data-page="weather">Full forecast ${icon("arrow",15)}</button></div>`:
 `<div class="v6-w-offline"><span>${icon("cloud",30)}</span><div><strong>${ui.weatherBusy?"Fetching local conditions…":"Weather data unavailable"}</strong><p>${ui.weatherBusy?"Connecting to the forecast provider.":ui.weatherError?"Check your connection and try again.":"Tap Refresh to load local temperature and forecast."}</p></div><button data-action="load-weather" ${ui.weatherBusy?"disabled":""}>${ui.weatherBusy?"Loading…":"Try again"}</button></div>`}
 <div class="v6-w-credit"><i class="${ui.weatherStale?"stale":""}"></i>${ui.weatherBusy?"Updating…":valid?(ui.weatherStale?"Saved forecast":"Forecast updated"):"Not loaded"}${updated?" · "+updated:""}<span>Open-Meteo · Forecast estimates</span></div></section>`;
}
function cachedForecast(){
 try{const x=JSON.parse(localStorage.getItem("sysmart-weather-v6")||"null");if(!x||x.city!==state.profile.city||!x.data?.current)return false;
 const age=Date.now()-Date.parse(x.fetchedAt);if(!Number.isFinite(age)||age<0||age>86400000)return false;
 ui.weather=x.data;ui.weatherCity=x.city;ui.weatherFetchedAt=x.fetchedAt;ui.weatherStale=age>900000;return true;}catch{return false;}
}
let weatherRequestId=0;
function weatherCityChanged(){weatherRequestId++;ui.weather=null;ui.weatherCity=null;ui.weatherBusy=false;ui.weatherError='';cachedForecast();render();loadForecast();}
function statusChip(feature='advisor'){const connected=ui.aiReady?.[feature];return !ui.aiChecked?'<span class="app-connection pending">Checking AI</span>':connected?'<span class="app-connection active">Gemini key set</span>':'<span class="app-connection off">Gemini key needed</span>'}
function onboardingGuide(){if(state.onboardingSeen)return '';return `<section class="getting-started" aria-label="Getting started with SYSMART AI">
<div class="start-head"><div><span class="v5-section-kicker">NEW TO SYSMART AI?</span><h2>Start farming smarter in 3 steps.</h2></div><button data-action="dismiss-guide" aria-label="Dismiss this guide">Got it ${icon('check',15)}</button></div>
<div class="start-steps"><button data-page="plant"><b>1</b><span><strong>Scan a plant</strong><small>Take a photo of your crop.</small></span>${icon('arrow',15)}</button>
<button data-page="farms"><b>2</b><span><strong>Add your farm</strong><small>Track crops and expenses.</small></span>${icon('arrow',15)}</button>
<button data-page="chat"><b>3</b><span><strong>Ask AI</strong><small>Get help making decisions.</small></span>${icon('arrow',15)}</button></div></section>`;}
async function loadAIStatus(){try{const res=await fetch('/api/status',{headers:{Accept:'application/json'},signal:AbortSignal.timeout(8000)});if(!res.ok)throw Error('Unavailable');const data=await res.json();ui.aiReady={advisor:data?.features?.advisor===true,plantDoctor:data?.features?.plantDoctor===true};ui.aiError='';}catch{ui.aiReady={advisor:false,plantDoctor:false};ui.aiError='AI connection status unavailable';}finally{ui.aiChecked=true;if(['dashboard','chat','plant','settings'].includes(ui.page))render();}}
function home(){
 const active=state.farms.filter(f=>!f.demo);
  const localHour=new Date().getHours();
 const greeting=localHour<12?'Good morning':localHour<17?'Good afternoon':'Good evening';
 return `<div class="v5-home" aria-label="SYSMART AI farming workspace">
   <div class="v5-main">
     <header class="v7-home-intro" aria-label="Farm overview">
       <div><span class="v7-home-kicker">${icon('leaf',14)} YOUR FARM OVERVIEW</span>
       <h1>${greeting}, ${firstName()}<span class="v7-home-title-dot">.</span></h1>
       <p>Everything your farm needs, beautifully organized.</p></div>
       <button class="v7-intro-link" data-page="farms" aria-label="Open your farms">${icon('farm',16)} My farms ${icon('arrow',15)}</button>
     </header>
     ${onboardingGuide()}
     ${weatherPanel()}
     <section class="v5-assistant" aria-labelledby="v5-assistant-title">
       <div class="v5-assistant-head"><div><span class="v5-section-kicker">SYSMART AI ADVISOR</span>
         <h2 id="v5-assistant-title">Ask about your farm</h2></div>${statusChip('advisor')}<span class="v5-assistant-mark">${icon('spark',20)}</span></div>
       <form id="home-ai-form" class="v5-prompt-form">
         <label class="sr-only" for="home-question">Ask SYSMART AI a farming question</label>
         <textarea id="home-question" rows="2" maxlength="3000" placeholder="Ask about crops, pests, irrigation, soil or your next harvest…"></textarea>
         <div class="v5-prompt-footer"><span>${icon('leaf',15)} SYSMART AI Advisor</span><button type="submit" aria-label="Send your question">Ask AI ${icon('arrow',17)}</button></div>
       </form>
       <div class="v5-prompt-suggestions" aria-label="Suggested farming questions">
         <button data-action="suggest" data-question="How can I prevent tomato leaf diseases during the rainy season?">Tomato leaf care ${icon('arrow',13)}</button>
         <button data-action="suggest" data-question="Help me plan irrigation for maize in Kano this month.">Irrigation planning ${icon('arrow',13)}</button>
       </div>
     </section>
     <section class="v5-services" aria-labelledby="v5-services-title">
       <div class="v5-section-head"><div><span class="v5-section-kicker">ESSENTIAL FARM TOOLS</span><h2 id="v5-services-title">Farm tools</h2></div><span class="v5-head-note"></span></div>
       <div class="v5-tool-grid">
         <button class="v5-tool" data-page="plant"><span class="v5-tool-icon">${icon('doctor',23)}</span><strong>Plant Doctor</strong><small>Understand crop problems from a photo</small><span class="v5-tool-more">${icon('arrow',17)}</span></button>
         <button class="v5-tool" data-page="planner"><span class="v5-tool-icon">${icon('calendar',23)}</span><strong>Crop Planner</strong><small>Plan planting dates and growing stages</small><span class="v5-tool-more">${icon('arrow',17)}</span></button>
         <button class="v5-tool" data-page="weather"><span class="v5-tool-icon">${icon('cloud',23)}</span><strong>Weather</strong><small>Get local weather and rainfall forecasts</small><span class="v5-tool-more">${icon('arrow',17)}</span></button>
         <button class="v5-tool" data-page="records"><span class="v5-tool-icon">${icon('finance',23)}</span><strong>Farm Records</strong><small>Keep track of costs and farm income</small><span class="v5-tool-more">${icon('arrow',17)}</span></button>
       </div>
     </section>
     <section class="v5-fields" aria-labelledby="v5-fields-title">
       <div class="v5-section-head"><div><span class="v5-section-kicker">YOUR WORKSPACE</span><h2 id="v5-fields-title">My farms ${active.length?`<span class="v5-count">${active.length}</span>`:''}</h2></div><button class="v5-text-link" data-page="farms">View all ${icon('arrow',16)}</button></div>
       ${active.length?`<div class="v5-farm-list">${active.slice(0,2).map(f=>`<button data-action="view-farm" data-id="${esc(f.id)}" class="v5-farm-row"><span class="v5-farm-thumb" style="background-image:url('${photoFor(f.crop)}')"></span><span><strong>${esc(f.name)}</strong><small>${cropName(f.crop)} · ${formatNumber(f.area)} ha · ${esc(f.location)}</small></span>${icon('chevron',17)}</button>`).join('')}</div>`:
       `<div class="v5-first-farm"><span class="v5-first-farm-icon">${icon('farm',23)}</span><div><strong>Your farm, all in one place.</strong><p>Add your first farm to organize crops, activities and records.</p></div><button type="button" data-action="add-farm">${icon('plus',16)} Add farm</button></div>`}
     </section>
     <div class="v5-trust">${icon('shield',15)} Farming recommendations are guidance, not a confirmed diagnosis. Verify important treatments locally. <span>from SYLUTION</span></div>
   </div>
 </div>`;
}
function heading(eyebrow,title,subtitle,action=''){return `<div class="page-heading"><div><span class="eyebrow green">${eyebrow}</span><h1>${title}</h1><p>${subtitle}</p></div>${action}</div>`}
function farms(){return `<div class="workspace-page">${heading('FARM MANAGEMENT','My Farms','Everything you need to keep your fields organized.',`<button class="primary-button" data-action="add-farm">${icon('plus',18)} Add New Farm</button>`)}<div class="summary-strip">${icon('leaf',22)}<div><strong>${state.farms.length} farms in your workspace</strong><p>View planting dates, crop types and saved farm details.</p></div></div><div class="farms-gallery">${state.farms.length?state.farms.map(farmCard).join(''):`<div class="empty-card"><h3>No farms added yet</h3><p>Add your first farm to get started.</p><button class="primary-button" data-action="add-farm">Add Farm</button></div>`}</div></div>`}
const activeChat=()=>state.chats.find(c=>c.id===state.activeChat)||state.chats[0];
function chat(){const c=activeChat();const visibleMessages=c.messages.filter(m=>!(m.role==='assistant'&&String(m.content||'').startsWith('AI service not available:')));return `<div class="chat-page"><div class="chat-heading"><div class="ai-emblem">${icon('leaf',25)}</div><div><h2>SYSMART AI Advisor</h2><p>Your intelligent agricultural assistant</p></div>${statusChip('advisor')}<button data-action="new-chat" class="outline-button">${icon('plus',17)} New Chat</button></div><div class="chat-layout"><aside class="chat-list"><span class="eyebrow">RECENT CONVERSATIONS</span>${state.chats.map(x=>`<button class="history-item ${x.id===state.activeChat?'active':''}" data-action="switch-chat" data-id="${esc(x.id)}">${icon('chat',17)}<span>${esc(x.title)}</span></button>`).join('')}</aside><div class="chat-main"><div id="messages" class="chat-messages">${visibleMessages.length?visibleMessages.map(m=>`<div class="chat-line ${m.role}"><span class="chat-speaker">${m.role==='assistant'?icon('leaf',17):esc(state.profile.name.charAt(0).toUpperCase())}</span><div class="chat-bubble">${esc(m.content).replaceAll('\n','<br>')}</div></div>`).join(''):`<div class="chat-empty"><span class="large-leaf">${icon('leaf',37)}</span><span class="eyebrow">FARMING INTELLIGENCE</span><h1>How can I help your farm today?</h1><p>Get help with crop care, growing plans, farm finances, irrigation and more.</p><div class="prompt-grid"><button data-action="suggest" data-question="How can I improve tomato production during the rainy season?">🍅 &nbsp;Improve tomato production</button><button data-action="suggest" data-question="Create a practical maize planting checklist for Kano.">🌽 &nbsp;Plan my maize season</button><button data-action="suggest" data-question="What signs of nutrient deficiencies should I check on vegetable leaves?">🌿 &nbsp;Recognize crop stress</button><button data-action="suggest" data-question="How do I calculate my farm's real profit?">📊 &nbsp;Understand farm profits</button></div></div>`}${ui.chatBusy?`<div class="chat-line user chat-live-pending"><span class="chat-speaker">${esc(state.profile.name.charAt(0).toUpperCase())}</span><div class="chat-bubble">${esc(ui.chatPendingQuestion)}</div></div><div class="chat-line assistant"><span class="chat-speaker">${icon('leaf',17)}</span><div class="chat-bubble chat-stream-bubble" id="chat-stream-output">${esc(ui.chatLiveText)||'<span class="chat-typing"><i></i><i></i><i></i></span>'}</div></div>`:''}</div>${ui.chatError?`<section class="chat-error-banner" role="alert"><strong>${ui.chatError.code==='AI_NETWORK_INTERRUPTED'?'Connection interrupted':ui.chatError.code==='GEMINI_QUOTA_LIMIT'?'Gemini usage limit':'Could not complete request'}</strong><p>${esc(ui.chatError.message)}</p><div>${ui.chatError.code==='GEMINI_QUOTA_LIMIT'?`<a href="https://aistudio.google.com/app/rate-limit" target="_blank" rel="noopener noreferrer">Gemini limits</a>`:''}<button type="button" data-action="retry-ai" ${!ui.chatInput?'disabled':''}>Retry question</button><button type="button" data-action="dismiss-ai-error">Dismiss</button></div></section>`:''}${c.messages.some(m=>m.role==='assistant'&&m.content.startsWith('AI service not available:'))?`<button class="chat-clear-old" data-action="clear-chat-errors" type="button">Clear old error messages</button>`:''}<form id="chat-form" class="chat-composer"><textarea id="chat-message" placeholder="Ask anything about your farm…" aria-label="Ask SYSMART AI" rows="2">${esc(ui.chatInput)}</textarea><div class="composer-foot"><span>${icon('shield',14)} Verify important decisions</span><div><button type="button" data-action="dictate" aria-label="Dictate question" class="icon-button">${icon('mic',20)}</button><button class="send-button" type="submit" ${ui.chatBusy?'disabled':''} aria-label="Send question">${icon('send',19)}</button></div></div></form></div></div></div>`}
function plant(){
 const preview=ui.photo
   ? `<div class="pd-selected-image"><img src="${ui.photo}" alt="Photo of the plant selected for AI assessment"><span>${icon('check',15)} Photo ready</span></div>`
   : `<div class="pd-drop-placeholder"><span class="pd-drop-symbol">${icon('leaf',36)}</span><strong>Your plant photo goes here</strong><small>Take a clear photo of the affected leaves or whole plant.</small></div>`;
 const result=ui.plantResult
   ? renderPlantReport(ui.plantResult,{esc,icon})
   : `<div class="pd-awaiting"><span>${icon('spark',27)}</span><h3>Your crop report will appear here</h3><p>Plant identity, health status, pest and weed checks, watering, soil, nutrients and next steps.</p></div>`;
 return `<div class="workspace-page pd-page">
  <header class="pd-intro"><span class="pd-eyebrow">${icon('leaf',15)} SYSMART AI PLANT DOCTOR</span><h1>Know your plant. Care with confidence.</h1><p>Just take a photo. SYSMART AI will help identify the plant and assess any visible health issues.</p></header>
  <div class="pd-layout">
    <section class="pd-card pd-upload" aria-labelledby="pd-upload-heading">
      <div class="pd-card-heading"><span class="pd-card-icon">${icon('image',21)}</span><div><h2 id="pd-upload-heading">Scan your plant</h2><p>No crop selection or forms required.</p></div></div>
      ${preview}
      <input id="plant-photo-camera" type="file" accept="image/*" capture="environment" hidden>
      <input id="plant-photo-gallery" type="file" accept="image/*" hidden>
      <div class="pd-upload-actions"><button type="button" class="pd-camera-button" data-action="plant-camera">${icon('image',18)} Take Photo</button><button type="button" class="pd-gallery-button" data-action="plant-gallery">${icon('upload',18)} Choose Photo</button></div>
      <button type="button" class="pd-analyze-button" data-action="analyze-plant" ${!ui.photo||ui.plantBusy?'disabled':''}>${icon('spark',18)} ${ui.plantBusy?'Analyzing your plant…':'Analyze Plant'} ${icon('arrow',17)}</button>
      ${ui.plantError?`<div class="pd-error" role="alert">${icon('info',17)} ${esc(ui.plantError)}</div>`:''}
      <p class="pd-help">${icon('info',15)} For best results: take one whole-plant photo, then a close-up of leaves in daylight. Avoid distant field screenshots.</p>
    </section>
    <section class="pd-card pd-assessment" id="plant-assessment" aria-label="Plant Doctor assessment">
      <div class="pd-card-heading"><span class="pd-card-icon">${icon('doctor',21)}</span><div><h2>Complete crop health report</h2><p>Crop identity, health, weeds, pests, care needs and safe next steps.</p></div>${statusChip('plantDoctor')}</div>
      ${ui.plantBusy?`<div class="pd-loading" role="status"><span class="pd-spinner"></span><strong>Examining your photo</strong><p>Checking plant characteristics and visible signs…</p></div>`:result}
      ${ui.plantResult&&!ui.plantBusy?`<div class="scan-save"><label>Save under farm<select id="report-farm"><option value="">Unassigned</option>${state.farms.map(f=>`<option value="${esc(f.id)}">${esc(f.name)}</option>`).join('')}</select></label><div class="scan-save-actions"><button class="pd-analyze-button" type="button" data-action="save-plant-report" ${ui.plantSaved?'disabled':''}>${icon('check',17)} ${ui.plantSaved?'Saved':'Save report'}</button><button class="pd-gallery-button" type="button" data-action="new-plant-scan">${icon('plus',17)} New scan</button></div></div>`:''}
    </section>
  </div>
  ${state.plantReports.length?`<section class="saved-scans" aria-label="Saved plant reports"><header><h2>Saved plant reports</h2><small>${state.plantReports.length} on this device</small></header><div class="saved-scans-list">${state.plantReports.slice(0,12).map(x=>`<div class="saved-scan"><span class="saved-scan-icon">${icon('leaf',17)}</span><div><strong>${esc(x.report?.plantName||'Plant scan')}</strong><small>${esc(x.report?.likelyProblem||'Health report')} · ${safeDate(x.date)}</small></div><button type="button" data-action="open-plant-report" data-id="${esc(x.id)}">Open</button><button type="button" data-action="delete-plant-report" aria-label="Delete report" data-id="${esc(x.id)}">${icon('trash',16)}</button></div>`).join('')}</div></section>`:''}
 </div>`;
}
function forecastDays(){const d=ui.weather?.daily;if(!d?.time?.length)return '';return `<div class="forecast-days">${d.time.map((day,i)=>`<div><span>${safeDate(day)}</span><strong>${Math.round(d.temperature_2m_max[i])}°</strong><small>${Math.round(d.temperature_2m_min[i])}° low</small><small>${d.precipitation_probability_max?.[i]??'—'}% rain chance</small></div>`).join('')}</div>`}
function weather(){const x=ui.weather;return `<div class="workspace-page">${heading('FARM WEATHER','Weather & Forecast','Make more informed field decisions using current weather forecasts.')}<div class="weather-settings widget"><label>Forecast city<select id="city-select">${CITIES.map(c=>`<option ${c.name===state.profile.city?'selected':''}>${esc(c.name)}</option>`).join('')}</select></label><button class="primary-button" data-action="load-weather">${icon('cloud',18)} ${ui.weatherBusy?'Loading…':'Get Forecast'}</button></div>${ui.weatherError?`<div class="error-box">${esc(ui.weatherError)}</div>`:''}<div class="weather-page-card"><div class="weather-gradient"><span>${icon('location',17)} ${esc(state.profile.city)}, Nigeria</span>${x?`<div class="temperature">${icon('sun',52)} ${Math.round(x.current.temperature_2m)}°C</div><p>${esc(weatherLabel(x.current.weather_code))}</p><div class="weather-page-meta"><span>${icon('drop',17)} Humidity ${x.current.relative_humidity_2m}%</span><span>${icon('wind',17)} Wind ${x.current.wind_speed_10m} km/h</span></div>`:`<h2>Forecasts you can plan around.</h2><p>Choose your location and load fresh conditions. No simulated live data.</p>`}</div>${x?forecastDays():`<div class="weather-intro-art" role="img" aria-label="Real farmland photograph"></div>`}</div><div class="mini-disclaimer">${icon('info',16)} Weather data: Open-Meteo. Forecasts may differ from conditions on your farm. Follow official severe-weather alerts.</div></div>`}
function planner(){return `<div class="workspace-page">${heading('CROP PLANNING','Plan Your Growing Season','Build an indicative planting schedule for your next crop.')}<div class="planner-grid"><div class="widget"><h2>Create a crop plan</h2><p class="panel-description">Provide a few details to generate key growing milestones.</p><form id="plan-form" class="form-stack"><label>Crop<select name="crop">${CROPS.map(x=>`<option value="${x.name}">${x.emoji} ${x.en}</option>`).join('')}</select></label><label>Farm area (hectares)<input name="area" required type="number" min="0.01" max="100000" step="0.01" value="1" /></label><label>Planting date<input required name="start" type="date" value="${new Date().toISOString().slice(0,10)}" /></label><label>Irrigation<select name="irrigation"><option value="rainfed">Rainfed</option><option value="drip">Drip irrigation</option><option value="sprinkler">Sprinkler</option><option value="manual">Manual watering</option></select></label><button class="primary-button full">${icon('calendar',18)} Generate Growing Plan</button></form></div><div class="widget"><h2>Your crop timeline</h2><p class="panel-description">Dates are estimates, not guaranteed outcomes.</p>${ui.plan?`<div class="plan-header"><strong>${cropName(ui.plan.crop)}</strong><span>Estimated harvest: ${safeDate(ui.plan.expectedHarvest)}</span></div><div class="milestones">${ui.plan.milestones.map(x=>`<div class="milestone"><span class="dot"></span><div><strong>${esc(x.title)}</strong><small>${safeDate(x.date)}</small><p>${esc(x.detail)}</p></div></div>`).join('')}</div><button class="outline-button" data-action="save-plan">Save Plan</button>`:`<div class="empty-timeline">${icon('calendar',42)}<h3>Ready for the next season?</h3><p>Generate a plan to see planting, inspections and estimated harvest milestones here.</p></div>`}</div></div>${state.plans.length?`<div class="widget saved-plans"><h2>Saved Plans</h2>${state.plans.slice().reverse().map(x=>`<div class="saved-plan"><strong>${cropName(x.crop)}</strong><span>${formatNumber(x.area)} ha · Harvest around ${safeDate(x.expectedHarvest)}</span></div>`).join('')}</div>`:''}</div>`}
function miniLine(values){const max=Math.max(1,...values),w=560,h=130;const pts=values.map((v,i)=>`${10+i*(w-20)/Math.max(1,values.length-1)},${h-10-(v/max)*(h-25)}`).join(' ');return `<svg class="mini-chart" viewBox="0 0 560 140" role="img" aria-label="Transaction values trend"><path d="M0 115H560M0 74H560M0 35H560" stroke="#e8f0e9" stroke-width="1"/><polyline fill="none" stroke="#148857" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" points="${pts}"/></svg>`}
function records(){const tx=ui.recordFilter==='all'?state.transactions:state.transactions.filter(t=>t.farmId===ui.recordFilter),sum=totals(tx);return `<div class="workspace-page">${heading('FARM ACCOUNTING','Farm Records & Analytics','Keep your income and expenses clear, organized and exportable.',`<button data-action="add-record" class="primary-button">${icon('plus',17)} Add Transaction</button>`)}<div class="record-toolbar"><label>Farm <select id="record-filter"><option value="all">All farms</option>${state.farms.map(f=>`<option value="${esc(f.id)}" ${ui.recordFilter===f.id?'selected':''}>${esc(f.name)}</option>`).join('')}</select></label><button data-action="csv" class="outline-button">${icon('download',16)} Export CSV</button></div><div class="stats-grid">${statTile('Revenue',money(sum.income),'Recorded income','wallet','mint')}${statTile('Expenses',money(sum.expenses),'Recorded costs','finance','peach')}${statTile('Net Balance',money(sum.profit),'Income minus costs','bars','mint')}${statTile('Transactions',String(tx.length),'Financial entries','calendar')}</div><div class="records-overview"><section class="widget"><h2>Transaction Activity</h2><p class="panel-description">Amounts from saved entries, not revenue forecasts.</p>${miniLine(tx.length?tx.slice(-9).map(x=>+x.amount):[0,0,0])}</section><section class="widget"><h2>Income & Expenses</h2><div class="finance-line"><span>Revenue</span><strong>${money(sum.income)}</strong><div><i style="width:${sum.income+sum.expenses?100*sum.income/(sum.income+sum.expenses):0}%;background:#0d965e"></i></div></div><div class="finance-line"><span>Expenses</span><strong>${money(sum.expenses)}</strong><div><i style="width:${sum.income+sum.expenses?100*sum.expenses/(sum.income+sum.expenses):0}%;background:#e6a559"></i></div></div></section></div><div class="widget transactions"><div class="section-label-row"><h2>Recent Transactions</h2><span>${tx.length} entries</span></div><div class="scroll-table"><table><thead><tr><th>Transaction</th><th>Farm</th><th>Date</th><th>Type</th><th>Amount</th><th></th></tr></thead><tbody>${tx.length?tx.slice().reverse().map(x=>`<tr><td><b>${esc(x.title)}</b> ${x.demo?'<small class="sample-chip">SAMPLE</small>':''}</td><td>${esc(state.farms.find(f=>f.id===x.farmId)?.name||'Deleted farm')}</td><td>${safeDate(x.date)}</td><td><span class="transaction-type ${x.type}">${x.type}</span></td><td><strong>${x.type==='income'?'+':'−'}${money(x.amount)}</strong></td><td><button class="icon-button" data-action="delete-record" data-id="${esc(x.id)}" aria-label="Delete transaction">${icon('trash',17)}</button></td></tr>`).join(''):'<tr><td colspan="6" class="no-results">No transactions recorded yet.</td></tr>'}</tbody></table></div></div></div>`}
function settings(){return `<div class="workspace-page">${heading('YOUR ACCOUNT','Settings & Profile','Personalize your workspace and manage locally saved information.')}<div class="settings-grid"><section class="widget"><h2>Profile Settings</h2><p class="panel-description">Your profile remains on this device in the current version.</p><form id="profile-form" class="form-stack"><label>Your name<input name="name" value="${esc(state.profile.name)}" required maxlength="80" /></label><label>App language<input value="English" disabled /><small>The interface is in English throughout.</small></label><label>Default location<select name="city">${CITIES.map(c=>`<option value="${c.name}" ${state.profile.city===c.name?'selected':''}>${c.name}, Nigeria</option>`).join('')}</select></label><button class="primary-button full">${icon('check',17)} Save Preferences</button></form></section><section class="widget"><h2>Data & Privacy</h2><p class="panel-description">Farms, chats and scans are stored in this browser, not synced to a cloud account. Download a backup regularly.</p>
<div class="backup-actions"><button type="button" class="primary-button" data-action="export-backup">${icon('download',17)} Download backup</button><button type="button" class="outline-button" data-action="import-backup">${icon('upload',17)} Restore backup</button><input id="backup-file" type="file" accept=".json,application/json" hidden></div>
<div class="setting-row"><div><strong>AI service</strong><p>${ui.aiError||'Live AI requires an API key on the hosting server.'}</p></div>${statusChip('advisor')}</div>
<div class="setting-row"><div><strong>New farmer guide</strong><p>See the three steps again on Home.</p></div><button class="outline-button" data-action="show-guide">Show guide</button></div><div class="setting-row"><div><strong>Local device storage</strong><p>Chats and farm records are not automatically synced across devices.</p></div><span class="pill-enabled">On</span></div><div class="setting-row"><div><strong>Reset workspace</strong><p>Permanently erase all locally saved farms, chats, plans, scans and transactions.</p></div><button class="outline-button danger" data-action="reset">Reset Data</button></div></section></div><div class="footer-brand">${brand()}<p>SYSMART AI Preview · from SYLUTION. AI image analysis and conversations require a secure provider connection. © SYLUTION.</p></div></div>`}
function modal(){if(!ui.modal)return '';let contents='';if(ui.modal==='add-farm')contents=`<div class="modal-heading"><h2>Add a New Farm</h2><button class="icon-button" data-action="close-modal" aria-label="Close dialog">${icon('close',21)}</button></div><form class="form-stack" id="farm-form"><label>Farm name<input name="name" required maxlength="90" placeholder="e.g. Green Valley Farm" /></label><label>Main crop<select name="crop">${CROPS.map(c=>`<option value="${c.name}">${c.emoji} ${c.en}</option>`).join('')}</select></label><div class="two-inputs"><label>Area (hectares)<input name="area" type="number" min="0.01" max="100000" step="0.01" required placeholder="1.5" /></label><label>Location<input name="location" required maxlength="90" value="${esc(state.profile.city)}" /></label></div><label>Planting date<input name="start" type="date" required value="${new Date().toISOString().slice(0,10)}" /></label><button class="primary-button full" type="submit">${icon('check',18)} Save Farm</button></form>`;
if(ui.modal==='add-record')contents=`<div class="modal-heading"><h2>Add Transaction</h2><button class="icon-button" data-action="close-modal" aria-label="Close dialog">${icon('close',21)}</button></div>${state.farms.length?`<form class="form-stack" id="record-form"><label>Description<input name="title" required maxlength="120" placeholder="e.g. Seed purchase" /></label><label>Farm<select name="farmId">${state.farms.map(f=>`<option value="${esc(f.id)}">${esc(f.name)}</option>`).join('')}</select></label><label>Transaction type<select name="type"><option value="expense">Expense</option><option value="income">Income</option></select></label><label>Amount (NGN)<input name="amount" type="number" min="1" max="100000000000" required /></label><label>Date<input name="date" type="date" value="${new Date().toISOString().slice(0,10)}" required /></label><button class="primary-button full" type="submit">Save Transaction</button></form>`:`<p>Create a farm before adding transactions.</p><button class="primary-button" data-action="add-farm">Add Farm</button>`}`;
if(ui.modal.startsWith('farm:')){const f=state.farms.find(x=>x.id===ui.modal.slice(5));if(f)contents=`<div class="modal-heading"><h2>${esc(f.name)}</h2><button class="icon-button" data-action="close-modal" aria-label="Close dialog">${icon('close',21)}</button></div><div class="modal-farm-cover" style="background-image:url('${photoFor(f.crop)}')"></div><div class="farm-detail-list"><p><strong>Crop</strong><span>${cropName(f.crop)}</span></p><p><strong>Location</strong><span>${esc(f.location)}</span></p><p><strong>Area</strong><span>${formatNumber(f.area)} hectares</span></p><p><strong>Planting date</strong><span>${safeDate(f.start)}</span></p><p><strong>Status</strong><span>${esc(f.status||'Growing')}</span></p></div>${state.plantReports.some(r=>r.farmId===f.id)?`<div class="farm-linked-reports"><h3>Plant health reports</h3>${state.plantReports.filter(r=>r.farmId===f.id).slice(0,5).map(r=>`<button type="button" data-action="open-plant-report" data-id="${esc(r.id)}">${icon('leaf',16)} ${esc(r.report?.plantName||'Plant report')} — ${safeDate(r.date)} ${icon('arrow',15)}</button>`).join('')}</div>`:''}<button class="outline-button danger full" data-action="delete-farm" data-id="${esc(f.id)}">${icon('trash',16)} Delete This Farm</button>`}
return `<div class="modal-backdrop" data-action="backdrop"><section class="modal-window" role="dialog" aria-modal="true">${contents}</section></div>`}
function render(){document.documentElement.lang='en';const pages={dashboard:home,farms,planner,chat,plant,weather,records,settings};const el=document.getElementById('app');el.innerHTML=`<div class="app-shell">${sidebar()}<div class="main-layout">${header()}<main id="main-content">${(pages[ui.page]||home)()}</main></div>${bottomNav()}${ui.sidebar?'<div class="nav-scrim" data-action="menu"></div>':''}${modal()}</div>`;const msgs=document.getElementById('messages');if(msgs)msgs.scrollTop=msgs.scrollHeight}
function navigate(to){const page=VALID_PAGES.has(to)?to:'dashboard';ui.page=page;storePage(page);ui.sidebar=false;ui.modal=null;render();window.scrollTo({top:0,behavior:'instant'});if(page==='weather'&&!ui.weather&&!ui.weatherBusy)loadForecast()}
async function askAI(question){
 const content=String(question||'').trim();
 if(!content||ui.chatBusy)return;
 let conversation=activeChat();
 if(!conversation){conversation={id:uid(),title:'New conversation',messages:[]};state.chats.unshift(conversation);state.activeChat=conversation.id}
 const previous=conversation.messages.slice();
 ui.chatInput=content;storeChatDraft(content);
 ui.chatError=null;ui.chatBusy=true;ui.chatLiveText='';ui.chatPendingQuestion=content;
 navigate('chat');
 const context=state.farms.map(f=>f.name+': '+cropName(f.crop)+', '+f.area+' ha, '+f.location).join('; ').slice(0,1100);
 const payload={messages:[...previous,{role:'user',content}].slice(-10),language:'en',farmContext:context};
 try{
  let result;
  try{
   result=await streamFarmAnswer('/api/chat-stream',payload,{
    onToken:(part,whole)=>{
     ui.chatLiveText=whole;
     const bubble=document.getElementById('chat-stream-output');
     if(bubble){bubble.textContent=whole;const scroller=document.getElementById('messages');if(scroller)scroller.scrollTop=scroller.scrollHeight}
    }
   });
  }catch(error){
   // Backward-compatible fallback only if the new endpoint is not deployed.
   if(['HTTP_404','HTTP_405','STREAM_NOT_AVAILABLE'].includes(error?.code)){
    const data=await postJsonWithRecovery('/api/chat',payload);
    result=data?.reply;
   }else throw error;
  }
  if(typeof result!=='string'||!result.trim())throw Object.assign(new Error('Gemini gave no answer. Tap Retry.'),{code:'AI_EMPTY_RESPONSE'});
  conversation.messages.push({role:'user',content},{role:'assistant',content:result.trim()});
  if(!previous.length)conversation.title=content.slice(0,46);
  if(ui.chatInput===content){ui.chatInput='';storeChatDraft('')}
 }catch(error){
  if(!ui.chatInput)ui.chatInput=content;
  storeChatDraft(ui.chatInput);
  ui.chatError={code:String(error?.code||'AI_NETWORK_INTERRUPTED'),message:String(error?.message||'Connection interrupted. Check your internet and retry.')};
 }finally{ui.chatBusy=false;ui.chatLiveText='';ui.chatPendingQuestion='';save();render()}
}
async function analyzePlant(){
 if(!ui.photo){notify('Take or choose a plant photo first.','error');return;}
 if(ui.plantBusy)return;
 const selectedPhoto=ui.photo;
 ui.plantError='';
 ui.plantResult=null;
 ui.plantSaved=false;
 ui.plantBusy=true;
 render();
 try{
  const response=await fetch('/api/plant-doctor',{
   method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({image:selectedPhoto,language:'en'})
  });
  let data;
  try{data=await response.json();}catch{throw Error('The Plant Doctor service returned an unexpected response.');}
  if(!response.ok)throw Error(data.error||'Plant analysis is temporarily unavailable.');
  if(ui.photo!==selectedPhoto)return;
  if(!data.report&&!data.analysis)throw Error('No plant assessment was returned.');
  ui.plantResult=data.report||data.analysis;
 }catch(error){
  if(ui.photo!==selectedPhoto)return;
  ui.plantError=String(error.message||'Unable to analyze this photo.');
 }finally{
  if(ui.photo===selectedPhoto){
   ui.plantBusy=false;
   render();
   if(ui.plantResult)document.getElementById('plant-assessment')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
 }
}
async function loadForecast(){
 const cityName=state.profile.city,city=CITIES.find(x=>x.name===cityName)||CITIES[0],request=++weatherRequestId;
 ui.weatherBusy=true;ui.weatherError='';render();
 try{
  let r;try{r=await fetch('/api/weather?lat='+city.lat+'&lon='+city.lon);}catch{}
  if(!r?.ok){const q=new URLSearchParams({latitude:String(city.lat),longitude:String(city.lon),current:'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code',daily:'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max',forecast_days:'5',timezone:'auto'});r=await fetch('https://api.open-meteo.com/v1/forecast?'+q);}
  if(!r.ok)throw Error('Weather service unavailable');
  const data=await r.json();
  if(data?.current?.temperature_2m===undefined||!Number.isFinite(Number(data.current.temperature_2m)))throw Error('Incomplete forecast');
  if(request!==weatherRequestId||cityName!==state.profile.city)return;
  const fetchedAt=new Date().toISOString();
  ui.weather=data;ui.weatherCity=cityName;ui.weatherFetchedAt=fetchedAt;ui.weatherStale=false;
  try{localStorage.setItem('sysmart-weather-v6',JSON.stringify({city:cityName,fetchedAt,data}));}catch{}
 }catch(error){
  if(request!==weatherRequestId)return;
  ui.weatherError=error.message;
  if(ui.weatherCity===cityName&&ui.weather)ui.weatherStale=true;
  else{ui.weather=null;ui.weatherCity=null;}
 }finally{if(request===weatherRequestId){ui.weatherBusy=false;render();}}
}
function readPhoto(file){
 if(!file)return;
 if(!file.type.startsWith('image/')||file.size>16*1024*1024){
  notify('Choose an image up to 16 MB. JPEG, PNG and WebP work best.','error');
  return;
 }
 const reader=new FileReader();
 reader.onerror=()=>notify('Unable to read this photo. Try another image.','error');
 reader.onload=()=>{
  const picture=new Image();
  picture.onerror=()=>notify('This image format cannot be opened here. Try JPEG or PNG.','error');
  picture.onload=()=>{
   try{
    const canvas=document.createElement('canvas');
    const ratio=Math.min(1,1800/Math.max(picture.width,picture.height));
    canvas.width=Math.max(1,Math.round(picture.width*ratio));
    canvas.height=Math.max(1,Math.round(picture.height*ratio));
    canvas.getContext('2d').drawImage(picture,0,0,canvas.width,canvas.height);
    let encoded=canvas.toDataURL('image/jpeg',.83);
    if(encoded.length>4_000_000)encoded=canvas.toDataURL('image/jpeg',.65);
    if(encoded.length>4_000_000){
     const secondRatio=Math.min(1,1350/Math.max(picture.width,picture.height));
     canvas.width=Math.max(1,Math.round(picture.width*secondRatio));
     canvas.height=Math.max(1,Math.round(picture.height*secondRatio));
     canvas.getContext('2d').drawImage(picture,0,0,canvas.width,canvas.height);
     encoded=canvas.toDataURL('image/jpeg',.62);
    }
    if(encoded.length>4_000_000){notify('This photo is too large after processing. Try another photo.','error');return;}
    ui.photo=encoded;
    ui.plantSaved=false;
    ui.plantResult=null;
    ui.plantError='';
    ui.plantBusy=false;
    render();
   }catch{notify('Unable to prepare this photo. Try another image.','error');}
  };
  picture.src=reader.result;
 };
 reader.readAsDataURL(file);
}

function exportBackup(){
 const backup={format:'sysmart-ai-backup',version:1,exportedAt:new Date().toISOString(),profile:state.profile,farms:state.farms,transactions:state.transactions,plans:state.plans,chats:state.chats,plantReports:state.plantReports};
 const data=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(data),a=document.createElement('a');a.href=url;a.download='sysmart-ai-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
async function importBackup(file){
 if(!file)return;
 if(file.size>3_000_000){notify('Choose a JSON backup under 3 MB.','error');return;}
 try{
  const input=JSON.parse(await file.text());
  if(input?.format!=='sysmart-ai-backup'||input.version!==1)throw Error('Not a valid SYSMART AI backup');
  for(const k of ['farms','transactions','plans','chats','plantReports'])if(!Array.isArray(input[k])||input[k].length>1500)throw Error('Invalid or oversized '+k);
  if(!input.profile||typeof input.profile.name!=='string')throw Error('Invalid profile');
  if(!confirm('Replace information stored in this browser with the backup? Export your existing data first.'))return;
  state.profile={name:input.profile.name.slice(0,80)||'Farmer',lang:'en',city:CITIES.some(c=>c.name===input.profile.city)?input.profile.city:'Kano'};
  state.farms=input.farms.filter(x=>x&&typeof x.id==='string'&&typeof x.name==='string').slice(0,500);
  state.transactions=input.transactions.filter(x=>x&&typeof x.id==='string').slice(0,1500);
  state.plans=input.plans.filter(x=>x&&typeof x==='object').slice(0,500);
  state.chats=input.chats.filter(x=>x&&typeof x.id==='string'&&Array.isArray(x.messages)).slice(0,100);
  if(!state.chats.length)state.chats=[{id:uid(),title:'New conversation',messages:[]}];
  state.activeChat=state.chats[0].id;
  state.plantReports=input.plantReports.filter(x=>x&&typeof x.id==='string'&&x.report&&typeof x.report==='object').slice(0,100);
  state.onboardingSeen=true;state.showDemo=false;save();navigate('dashboard');notify('Backup restored on this device.');
 }catch(error){notify('Restore failed: '+String(error.message).slice(0,120),'error');}
}

function savePlantReport(){
 if(!ui.plantResult||typeof ui.plantResult!=='object'||ui.plantSaved){notify('Analyze a new plant photo before saving again.','error');return;}
 if(state.plantReports.length>=100){notify('Export a backup or delete old reports before saving more.','error');return;}
 const report=JSON.parse(JSON.stringify(ui.plantResult));
 const farmId=document.getElementById('report-farm')?.value||'';
 state.plantReports.unshift({id:uid(),date:new Date().toISOString(),farmId,report});ui.plantSaved=true;save();render();notify('Plant report saved on this device.');
}

function csvExport(){const tx=ui.recordFilter==='all'?state.transactions:state.transactions.filter(x=>x.farmId===ui.recordFilter);const lines=[['Date','Transaction','Farm','Type','Amount (NGN)','Sample'],...tx.map(x=>[x.date,x.title,state.farms.find(f=>f.id===x.farmId)?.name||'',x.type,x.amount,x.demo?'YES':'NO'])];const csv=lines.map(row=>row.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\r\n');const obj=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=obj;a.download='sysmart-farm-records.csv';a.click();setTimeout(()=>URL.revokeObjectURL(obj),500)}
document.addEventListener('click',ev=>{const target=ev.target.closest('[data-page],[data-action]');if(!target)return;if(target.dataset.page){navigate(target.dataset.page);return}const action=target.dataset.action,id=target.dataset.id;if(action==='menu'){ui.sidebar=!ui.sidebar;render()}else if(action==='close-modal'){ui.modal=null;render()}else if(action==='backdrop'&&ev.target===target){ui.modal=null;render()}else if(action==='add-farm'){ui.modal='add-farm';render()}else if(action==='add-record'){ui.modal='add-record';render()}else if(action==='view-farm'){ui.modal='farm:'+id;render()}else if(action==='delete-farm'){if(confirm('Delete this farm and its financial records?')){state.farms=state.farms.filter(f=>f.id!==id);state.transactions=state.transactions.filter(t=>t.farmId!==id);state.plantReports=state.plantReports.map(x=>x.farmId===id?{...x,farmId:''}:x);save();ui.modal=null;render();notify('Farm removed.')}}else if(action==='delete-record'){if(confirm('Delete this transaction?')){state.transactions=state.transactions.filter(t=>t.id!==id);save();render()}}else if(action==='remove-demo'){removeDemo()}else if(action==='reset'){if(confirm('Delete all locally saved SYSMART AI data on this device?')){localStorage.removeItem(STORAGE_KEY);storeChatDraft('');state={...state,profile:{name:'Farmer',lang:'en',city:'Kano'},farms:[],transactions:[],plans:[],chats:[{id:uid(),title:'New conversation',messages:[]}],plantReports:[],onboardingSeen:false,showDemo:false};state.activeChat=state.chats[0].id;ui.chatInput='';save();navigate('dashboard');notify('Workspace reset.')}}else if(action==='retry-ai'){if(ui.chatInput)askAI(ui.chatInput)}else if(action==='dismiss-ai-error'){ui.chatError=null;render()}else if(action==='clear-chat-errors'){const chat=activeChat();chat.messages=chat.messages.filter(m=>!(m.role==='assistant'&&String(m.content).startsWith('AI service not available:')));save();render()}else if(action==='suggest'){askAI(target.dataset.question)}else if(action==='new-chat'){ui.chatError=null;ui.chatInput='';storeChatDraft('');const c={id:uid(),title:'New conversation',messages:[]};state.chats.unshift(c);state.activeChat=c.id;save();render()}else if(action==='switch-chat'){state.activeChat=id;ui.chatError=null;ui.chatInput='';storeChatDraft('');save();render()}else if(action==='plant-camera'){document.getElementById('plant-photo-camera')?.click()}else if(action==='plant-gallery'){document.getElementById('plant-photo-gallery')?.click()}else if(action==='analyze-plant'){analyzePlant()}else if(action==='save-plant-report'){savePlantReport()}else if(action==='new-plant-scan'){ui.photo=null;ui.plantResult=null;ui.plantSaved=false;ui.plantError='';render()}else if(action==='open-plant-report'){const selected=state.plantReports.find(x=>x.id===id);if(selected){ui.photo=null;ui.plantResult=selected.report;ui.plantSaved=true;navigate('plant');document.getElementById('plant-assessment')?.scrollIntoView({behavior:'smooth',block:'start'})}}else if(action==='delete-plant-report'){if(confirm('Delete this saved scan?')){state.plantReports=state.plantReports.filter(x=>x.id!==id);save();render()}}else if(action==='dismiss-guide'){state.onboardingSeen=true;save();render()}else if(action==='show-guide'){state.onboardingSeen=false;save();navigate('dashboard')}else if(action==='export-backup'){exportBackup()}else if(action==='import-backup'){document.getElementById('backup-file')?.click()}else if(action==='load-weather'){loadForecast()}else if(action==='save-plan'&&ui.plan){state.plans.push({...ui.plan,id:uid()});save();notify('Crop plan saved.')}else if(action==='csv'){csvExport()}else if(action==='dictate'){const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;if(!Speech){notify('Voice dictation is not supported in this browser.','error');return}const rec=new Speech();rec.lang='en-NG';rec.onresult=x=>{const field=document.getElementById('chat-message');if(field){field.value+=(field.value?' ':'')+x.results[0][0].transcript;ui.chatInput=field.value;field.focus()}};rec.onerror=()=>notify('Voice recognition failed.','error');rec.start()}});
document.addEventListener('submit',ev=>{const form=ev.target;if(!['chat-form','home-ai-form','farm-form','record-form','plan-form','profile-form'].includes(form.id))return;ev.preventDefault();const d=Object.fromEntries(new FormData(form));if(form.id==='home-ai-form')askAI(document.getElementById('home-question')?.value);else if(form.id==='chat-form')askAI(document.getElementById('chat-message')?.value);else if(form.id==='farm-form'){const area=Number(d.area);if(!Number.isFinite(area)||area<=0||area>100000){notify('Enter a valid farm area.','error');return}state.farms.push({id:uid(),name:d.name.trim(),crop:d.crop,location:d.location.trim(),area,start:d.start,status:'Growing',demo:false});save();ui.modal=null;navigate('farms');notify('Farm added successfully.')}else if(form.id==='record-form'){const amount=Number(d.amount);if(!Number.isFinite(amount)||amount<=0){notify('Enter a valid transaction amount.','error');return}state.transactions.push({id:uid(),title:d.title.trim(),farmId:d.farmId,type:d.type,amount,date:d.date,demo:false});save();ui.modal=null;navigate('records');notify('Transaction saved.')}else if(form.id==='plan-form'){try{ui.plan=createPlan(d.crop,d.area,d.start,d.irrigation);render();notify('Crop timeline generated.')}catch(err){notify(err.message,'error')}}else if(form.id==='profile-form'){state.profile.name=d.name.trim();state.profile.city=d.city;state.profile.lang='en';save();weatherCityChanged();notify('Preferences saved.')}});
document.addEventListener('change',ev=>{if(['plant-photo-camera','plant-photo-gallery'].includes(ev.target.id)){const file=ev.target.files?.[0];readPhoto(file);ev.target.value='';}if(ev.target.id==='city-select'){state.profile.city=ev.target.value;save();weatherCityChanged()}if(ev.target.id==='record-filter'){ui.recordFilter=ev.target.value;render()}if(ev.target.id==='backup-file'){importBackup(ev.target.files?.[0]);ev.target.value=''}});
document.addEventListener('input',ev=>{if(ev.target.id==='chat-message'){ui.chatInput=ev.target.value;storeChatDraft(ui.chatInput)}});
document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&ui.modal){ui.modal=null;render()}if(ev.key==='Enter'&&ev.target.id==='home-question'&&!ev.shiftKey){ev.preventDefault();document.getElementById('home-ai-form')?.requestSubmit()}if(ev.key==='Enter'&&ev.target.id==='chat-message'&&!ev.shiftKey){ev.preventDefault();document.getElementById('chat-form')?.requestSubmit()}});
cachedForecast();
render();
loadAIStatus();
if(!ui.weather||ui.weatherStale)loadForecast();
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('/sw.js').catch(()=>{});
