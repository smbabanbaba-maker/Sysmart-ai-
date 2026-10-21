export const CITIES = [
  { name: 'Kano', lat: 12.0022, lon: 8.5920 },
  { name: 'Kaduna', lat: 10.5105, lon: 7.4165 },
  { name: 'Katsina', lat: 12.9908, lon: 7.6018 },
  { name: 'Abuja', lat: 9.0765, lon: 7.3986 },
  { name: 'Lagos', lat: 6.5244, lon: 3.3792 },
  { name: 'Jos', lat: 9.8965, lon: 8.8583 },
  { name: 'Maiduguri', lat: 11.8333, lon: 13.1500 },
  { name: 'Port Harcourt', lat: 4.8156, lon: 7.0498 }
];
export const CROPS = [
  { name: 'Tumatir', en: 'Tomato', emoji: '🍅', color: '#fbe5db', cycle: 110 },
  { name: 'Masara', en: 'Maize', emoji: '🌽', color: '#fff1c8', cycle: 110 },
  { name: 'Shinkafa', en: 'Rice', emoji: '🌾', color: '#eaf2d2', cycle: 120 },
  { name: 'Albasa', en: 'Onion', emoji: '🧅', color: '#f1e2ed', cycle: 130 },
  { name: 'Barkono', en: 'Pepper', emoji: '🌶️', color: '#ffebe2', cycle: 110 },
  { name: 'Kokwamba', en: 'Cucumber', emoji: '🥒', color: '#e1f2df', cycle: 70 },
  { name: 'Wake', en: 'Beans', emoji: '🫘', color: '#f3e9d9', cycle: 90 },
  { name: 'Dankali', en: 'Potato', emoji: '🥔', color: '#f7efdd', cycle: 110 }
];
export function money(n) {
  const value=Number(n)||0;
  return '₦'+new Intl.NumberFormat('en-NG',{maximumFractionDigits:0}).format(value);
}
export function escapeHtml(input='') {
  return String(input).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
export function totals(transactions=[],farmId=null) {
  return transactions.filter(x=>farmId===null||x.farmId===farmId).reduce((acc,x)=>{
    const amount=Math.max(0,Number(x.amount)||0);
    if(x.type==='income')acc.income+=amount;
    if(x.type==='expense')acc.expenses+=amount;
    acc.profit=acc.income-acc.expenses;
    return acc;
  },{income:0,expenses:0,profit:0});
}
export function safeDate(value) {
  if(!value)return '';
  const d=new Date(value);
  return Number.isNaN(d.getTime())?'':d.toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'});
}
export function createPlan(crop,area,start,irrigation) {
  const selected=CROPS.find(c=>c.name===crop)||CROPS[0];
  const date=new Date(`${start}T12:00:00`);
  if(!Number.isFinite(date.getTime()))throw new Error('Select a valid planting date');
  const hectares=Number(area);
  if(!Number.isFinite(hectares)||hectares<=0||hectares>100000)throw new Error('Farm area must be positive');
  const add=days=>{const d=new Date(date);d.setDate(d.getDate()+days);return d.toISOString().slice(0,10)};
  return {
    crop:selected.name, area:hectares, irrigation, start, expectedHarvest:add(selected.cycle),
    milestones:[
      {day:0,date:add(0),title:'Shirya ƙasa da shuka / Prepare land and plant',detail:'Confirm soil test, seed quality, season and planting spacing locally.'},
      {day:14,date:add(14),title:'Duba tsiro / Check emergence',detail:'Inspect emergence, weeds and crop stand; keep a photo record.'},
      {day:Math.round(selected.cycle*.35),date:add(Math.round(selected.cycle*.35)),title:'Duba lafiyar shuka / Crop health inspection',detail:'Scout for pests, symptoms and moisture stress. Test before nutrient application.'},
      {day:Math.round(selected.cycle*.68),date:add(Math.round(selected.cycle*.68)),title:'Shirin girbi / Harvest readiness',detail:'Check market demand, produce maturity and storage/transport plans.'},
      {day:selected.cycle,date:add(selected.cycle),title:'Kimanta lokacin girbi / Estimate harvest window',detail:'Indicative timing only: cultivar, weather and management can change harvest dates.'}
    ]
  };
}
export function weatherLabel(code){
  if(code===0)return 'Sunny / Sarari';
  if([1,2,3].includes(code))return 'Partly cloudy / Gizagizai';
  if([45,48].includes(code))return 'Fog / Hazo';
  if([51,53,55,56,57].includes(code))return 'Drizzle / Yayafi';
  if([61,63,65,66,67,80,81,82].includes(code))return 'Rain / Ruwa';
  if([95,96,99].includes(code))return 'Thunderstorm / Hadari';
  return 'Weather / Yanayi';
}
export function uid(){return Math.random().toString(36).slice(2,10)+Date.now().toString(36)}
