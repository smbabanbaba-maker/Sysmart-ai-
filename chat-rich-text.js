// Safe, dependency-free Markdown renderer; escape all AI HTML before styling.
const escapeHtml=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const tick=String.fromCharCode(96);
export function formatInline(v){
 return String(v??'').split(new RegExp('('+tick+'[^'+tick+'\\n]+'+tick+')','g')).map(p=>{
  if(p[0]===tick&&p.at(-1)===tick)return '<code>'+escapeHtml(p.slice(1,-1))+'</code>';
  return escapeHtml(p).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
   .replace(/__(.+?)__/g,'<strong>$1</strong>').replace(/~~(.+?)~~/g,'<s>$1</s>')
   .replace(/(^|[^\w*])\*([^*\n]+)\*(?=$|[^\w*])/g,'$1<em>$2</em>');
 }).join('');
}
export function formatChatAnswer(value){
 const lines=String(value??'').replace(/\r\n?/g,'\n').split('\n'),html=[];
 let paragraph=[],items=[],kind='',code=null;
 const flushText=()=>{if(paragraph.length){html.push('<p>'+paragraph.map(formatInline).join(' ')+'</p>');paragraph=[]}};
 const flushList=()=>{if(items.length){html.push('<'+kind+'>'+items.map(x=>'<li>'+formatInline(x)+'</li>').join('')+'</'+kind+'>');items=[];kind=''}};
 for(const line of lines){
  const t=line.trim();
  if(code!==null){if(t.startsWith(tick+tick+tick)){html.push('<pre><code>'+escapeHtml(code.join('\n'))+'</code></pre>');code=null}else code.push(line);continue;}
  if(t.startsWith(tick+tick+tick)){flushText();flushList();code=[];continue;}
  if(!t){flushText();flushList();continue;}
  if(/^([-*_])(?:\s*\1){2,}\s*$/.test(t)){flushText();flushList();html.push('<hr>');continue;}
  const title=t.match(/^(#{1,6})\s+(.+)$/);
  if(title){flushText();flushList();html.push('<h3>'+formatInline(title[2])+'</h3>');continue;}
  const bullet=t.match(/^[-*•]\s+(.+)$/),number=t.match(/^\d+[.)]\s+(.+)$/);
  if(bullet||number){flushText();const k=number?'ol':'ul';if(kind&&kind!==k)flushList();kind=k;items.push((bullet||number)[1]);continue;}
  if(items.length&&/^\s{2,}\S/.test(line)){items[items.length-1]+=' '+t;continue;}
  flushList();paragraph.push(t);
 }
 if(code!==null)html.push('<pre><code>'+escapeHtml(code.join('\n'))+'</code></pre>');
 flushText();flushList();return '<div class="premium-answer">'+html.join('')+'</div>';
}
export function plainAnswer(v){
 return String(v??'').replace(/\r\n?/g,'\n').replace(/^\s{0,3}#{1,6}\s+/gm,'')
  .replace(/^\s*([-*_]\s*){3,}$/gm,'').replace(/\*\*(.*?)\*\*/g,'$1')
  .replace(/__(.*?)__/g,'$1').replace(/~~(.*?)~~/g,'$1')
  .replace(/(^|[^\w])\*([^*\n]+)\*/g,'$1$2').split(tick).join('')
  .replace(/\n{3,}/g,'\n\n').trim();
}
