
const menuBtn=document.querySelector('.menu-toggle'),nav=document.querySelector('.main-nav');
if(menuBtn&&nav){menuBtn.addEventListener('click',()=>{const open=nav.classList.toggle('open');menuBtn.setAttribute('aria-expanded',String(open));menuBtn.textContent=open?'×':'☰';});}
const KEY='gearforge-saved';
function getSaved(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){return []}}
function setSaved(v){try{localStorage.setItem(KEY,JSON.stringify(v))}catch(e){}}
function updateSaved(){const list=getSaved();const count=document.querySelector('#saved-count');if(count)count.textContent=list.length;document.querySelectorAll('[data-save]').forEach(b=>{const yes=list.includes(b.dataset.save);b.setAttribute('aria-pressed',String(yes));b.textContent=yes?'♥ Saved':'♡ Save';});}
document.querySelectorAll('[data-save]').forEach(b=>b.addEventListener('click',()=>{let v=getSaved();v=v.includes(b.dataset.save)?v.filter(x=>x!==b.dataset.save):[...v,b.dataset.save];setSaved(v);updateSaved();}));updateSaved();
const search=document.querySelector('#catalog-search'),filter=document.querySelector('#catalog-filter'),clear=document.querySelector('#clear-search');
function runFilter(){const q=(search?.value||'').toLowerCase().trim(),f=filter?.value||'all';let n=0;document.querySelectorAll('#catalog-grid .catalog-card').forEach(c=>{const ok=(c.dataset.title.includes(q)||c.textContent.toLowerCase().includes(q))&&(f==='all'||c.dataset.category===f);c.hidden=!ok;if(ok)n++;});const count=document.querySelector('#catalog-count');if(count)count.textContent=`Showing ${n} ${n===1?'item':'items'} · Demo catalogue`;const empty=document.querySelector('#empty-state');if(empty)empty.hidden=n>0;}
if(search)search.addEventListener('input',runFilter);if(filter)filter.addEventListener('change',runFilter);if(clear)clear.addEventListener('click',()=>{search.value='';filter.value='all';runFilter();});
const newsletter=document.querySelector('#newsletter-form');if(newsletter)newsletter.addEventListener('submit',e=>{e.preventDefault();document.querySelector('#newsletter-note').textContent='Thanks! This demo sign-up is not connected to an email service.';newsletter.reset();});
