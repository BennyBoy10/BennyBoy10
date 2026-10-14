"use strict";
const $=s=>document.querySelector(s);
const P={video:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9l5 3-5 3z"/>',audio:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',image:'<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5L6 20"/>',doc:'<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>',app:'<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>',archive:'<path d="M4 8h16v12H4zM3 4h18v4H3zM10 12h4"/>',download:'<path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14"/>',search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',play:'<path d="M8 5l11 7-11 7z" fill="currentColor"/>',pause:'<path d="M8 5v14M16 5v14" stroke-width="3.2"/>',close:'<path d="M6 6l12 12M18 6L6 18"/>',check:'<path d="M5 12l5 5 9-10"/>',full:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',grid:'<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',list:'<path d="M4 6h16M4 12h16M4 18h16"/>',back:'<path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"/>',fwd:'<path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5"/>'};
const ico=n=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;
const CI={Videos:'video',Audio:'audio',Images:'image',Documents:'doc',Applications:'app',Archives:'archive',Others:'doc'};
const PREVIEW=['Videos','Audio','Images'];
const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url=p=>p.split('/').map(encodeURIComponent).join('/');
const title=n=>n.replace(/\.[^.]+$/,'').replace(/\s*\[[\w-]{6,}\]\s*$/,'').trim()||n;
const tm=s=>{s=Math.floor(s||0);const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=String(s%60).padStart(2,'0');return h?`${h}:${String(m).padStart(2,'0')}:${x}`:`${m}:${x}`};
const bytes=b=>{const u=['B','KB','MB','GB'];let i=0;while(b>=1024&&i<3){b/=1024;i++}return(i?b.toFixed(2):b)+' '+u[i]};
const isNew=f=>Date.now()-new Date(f.added)<7*864e5;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const SORTS={new:(a,b)=>b.added.localeCompare(a.added)||a.name.localeCompare(b.name),old:(a,b)=>a.added.localeCompare(b.added),name:(a,b)=>a.name.localeCompare(b.name),big:(a,b)=>b.bytes-a.bytes,small:(a,b)=>a.bytes-b.bytes};
let all=[],cat='All',q='',sort='new',sm=false,m=null;const sel=new Set();

function toast(msg,ms=2600){const t=document.createElement('div');t.className='toast';t.textContent=msg;$('#toasts').append(t);requestAnimationFrame(()=>t.classList.add('in'));if(ms)setTimeout(()=>gone(t),ms);return t}
function gone(t){t.classList.remove('in');setTimeout(()=>t.remove(),300)}

const vis=()=>all.filter(f=>(cat==='All'||f.category===cat)&&f.name.toLowerCase().includes(q)).sort(SORTS[sort]);
function card(f,i){
  const thumb=f.thumb?`<img loading="lazy" src="${url(f.thumb)}" alt="">`:`<span class="fi">${ico(CI[f.category]||'doc')}</span>`;
  return `<article class="card${sel.has(f.path)?' sel':''}" style="--i:${Math.min(i,12)}" data-p="${esc(f.path)}">
<div class="th">${thumb}${f.duration?`<em class="dur">${tm(f.duration)}</em>`:''}${isNew(f)?'<em class="new">New</em>':''}<span class="ck">${ico('check')}</span></div>
<div class="bd"><h3 title="${esc(f.name)}">${esc(title(f.name))}</h3><div class="meta"><span>${f.size}</span>${f.resolution?`<span>${f.resolution}</span>`:''}${f.source?`<span>${f.source}</span>`:''}</div>
<a class="dl" href="${url(f.path)}" download="${esc(f.name)}">${ico('download')}Download</a></div></article>`}
function render(){
  const v=vis(),cs=['All',...Object.keys(CI).filter(c=>all.some(f=>f.category===c))];
  $('#chips').innerHTML=cs.map(c=>`<button class="chip${c===cat?' on':''}" data-c="${c}">${c}<i>${c==='All'?all.length:all.filter(f=>f.category===c).length}</i></button>`).join('');
  $('#grid').innerHTML=v.map(card).join('');
  $('#empty').hidden=!!v.length;
  $('#empty p').textContent=all.length?'No files match your search.':'No files yet. Check back soon.';
  $('#all span').textContent=`Download all (${v.length})`;$('#all').hidden=!v.length;
  bar();
}
function bar(){$('#bar').classList.toggle('show',sel.size>0);$('#bn').textContent=`${sel.size} selected`}

async function dlMany(fs){
  if(!fs.length)return;
  const t=toast('',0);
  for(let i=0;i<fs.length;i++){
    t.textContent=`Starting ${i+1} of ${fs.length}. Tap Allow if asked.`;
    const a=document.createElement('a');a.href=url(fs[i].path);a.download=fs[i].name;document.body.append(a);a.click();a.remove();
    await sleep(900);
  }
  t.textContent=`${fs.length} download${fs.length>1?'s':''} started. Check your Downloads.`;setTimeout(()=>gone(t),3800);
}

function open(f){
  const v=f.category==='Videos',a=f.category==='Audio',u=url(f.path);
  $('#stage').className='stage'+(a?' aud':'');
  $('#stage').innerHTML=v?`<video id="m" playsinline preload="metadata" ${f.thumb?`poster="${url(f.thumb)}"`:''} src="${u}"></video>`
    :a?`<div class="art">${f.thumb?`<img src="${url(f.thumb)}" alt="">`:ico('audio')}</div><audio id="m" preload="metadata" src="${u}"></audio>`
    :`<img src="${u}" alt="">`;
  m=$('#m');$('#ctl').hidden=!m;$('#bfs').hidden=!v;
  $('#mt').textContent=title(f.name);$('#mdl').href=u;$('#mdl').download=f.name;$('#mdl').innerHTML=ico('download')+'Download';
  $('#bp').innerHTML=ico('play');$('#seek').value=0;$('#cur').textContent='0:00';$('#dur').textContent=tm(f.duration);
  if(m){
    m.addEventListener('loadedmetadata',()=>$('#dur').textContent=tm(m.duration));
    m.addEventListener('timeupdate',()=>{$('#cur').textContent=tm(m.currentTime);if(m.duration)$('#seek').value=m.currentTime/m.duration*1000});
    m.addEventListener('play',()=>$('#bp').innerHTML=ico('pause'));
    m.addEventListener('pause',()=>$('#bp').innerHTML=ico('play'));
    if(v)m.addEventListener('click',()=>m.paused?m.play():m.pause());
    m.play().catch(()=>{});
  }
  $('#modal').hidden=false;document.body.classList.add('lock');
}
function shut(){if(m){m.pause();m.removeAttribute('src');m.load()}$('#stage').innerHTML='';m=null;$('#modal').hidden=true;document.body.classList.remove('lock')}

$('#yr').textContent=new Date().getFullYear();$('#i-search').innerHTML=ico('search');$('#mx').innerHTML=ico('close');$('#view').innerHTML=ico('list');
$('#all').insertAdjacentHTML('afterbegin',ico('download'));$('#bdl').innerHTML=ico('download')+'Download';
$('#b10').innerHTML=ico('back')+'<b>10</b>';$('#b5').innerHTML=ico('fwd')+'<b>5</b>';$('#bfs').innerHTML=ico('full');
$('#grid').innerHTML=Array(6).fill('<div class="card sk"><div class="th"></div><div class="bd"><h3></h3></div></div>').join('');
$('#chips').onclick=e=>{const b=e.target.closest('.chip');if(b){cat=b.dataset.c;render()}};
$('#q').oninput=e=>{q=e.target.value.toLowerCase().trim();render()};
$('#sort').onchange=e=>{sort=e.target.value;render()};
$('#view').onclick=()=>{const l=$('#grid').classList.toggle('list');$('#view').innerHTML=ico(l?'grid':'list')};
$('#select').onclick=()=>{sm=!sm;document.body.classList.toggle('sm',sm);$('#select').textContent=sm?'Done':'Select';if(!sm)sel.clear();render()};
$('#all').onclick=()=>dlMany(vis());
$('#bdl').onclick=async()=>{const fs=all.filter(f=>sel.has(f.path));sel.clear();render();await dlMany(fs)};
$('#bclr').onclick=()=>{sel.clear();render()};
$('#grid').onclick=e=>{
  const c=e.target.closest('.card');if(!c||c.classList.contains('sk'))return;
  const f=all.find(x=>x.path===c.dataset.p);if(!f)return;
  if(e.target.closest('.dl')){toast('Download started');return}
  if(sm||e.target.closest('.ck')){sel.has(f.path)?sel.delete(f.path):sel.add(f.path);c.classList.toggle('sel');bar();return}
  if(e.target.closest('.th')&&PREVIEW.includes(f.category))open(f);
};
$('#mx').onclick=shut;$('#modal').onclick=e=>{if(e.target.id==='modal')shut()};
$('#seek').oninput=e=>{if(m&&m.duration)m.currentTime=e.target.value/1000*m.duration};
$('#b10').onclick=()=>m&&(m.currentTime=Math.max(0,m.currentTime-10));
$('#b5').onclick=()=>m&&(m.currentTime=Math.min(m.duration||0,m.currentTime+5));
$('#bp').onclick=()=>m&&(m.paused?m.play():m.pause());
$('#bfs').onclick=()=>{const s=$('#stage'),r=s.requestFullscreen||s.webkitRequestFullscreen;r?r.call(s):m&&m.webkitEnterFullscreen&&m.webkitEnterFullscreen()};
addEventListener('keydown',e=>{if($('#modal').hidden)return;if(e.key==='Escape')shut();else if(m&&e.key==='ArrowLeft')$('#b10').click();else if(m&&e.key==='ArrowRight')$('#b5').click();else if(m&&e.key===' '){e.preventDefault();$('#bp').click()}});

fetch('Files.json',{cache:'no-store'}).then(r=>r.json()).then(d=>{
  all=d.files||[];
  $('#summary').textContent=all.length?`${all.length} file${all.length>1?'s':''} (${bytes(all.reduce((s,f)=>s+f.bytes,0))}) waiting for you.`:'Nothing here yet.';
  render();
}).catch(()=>{$('#grid').innerHTML='';$('#summary').textContent='Could not load the file list. Try refreshing the page.'});
