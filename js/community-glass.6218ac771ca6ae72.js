(()=>{
'use strict';
const root=document.documentElement,body=document.body;
const read=k=>{try{return (window.AppStorage||localStorage).getItem(k);}catch(_){return null;}};
const write=(k,v)=>{try{(window.AppStorage||localStorage).setItem(k,v);}catch(_){}};
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const home=!!document.getElementById('liquid-glass-toggle');
let toggle;
function sync(){
 const on=home?body.classList.contains('liquid-glass-active'):read('liquidGlassMode')==='true';
 const saving=body.classList.contains('low-end')||(!home&&read('perfMode')==='true');
 let motion=false;try{motion=JSON.parse(read('gp_living_design_v1')||'{}').motion===true;}catch(_){}
 root.classList.toggle('gp-glass',on);root.classList.toggle('gp-glass-saving',saving);root.classList.toggle('gp-glass-motion',motion&&!saving&&!reduced.matches);
 if(toggle)toggle.setAttribute('aria-pressed',String(on));
}
if(!home&&!body.hasAttribute('data-glass-overlay')){
 const header=document.querySelector('header');
 if(header){toggle=document.createElement('button');toggle.id='gp-glass-toggle';toggle.type='button';toggle.textContent='◈ Liquid Glass';toggle.onclick=()=>{write('liquidGlassMode',String(read('liquidGlassMode')!=='true'));sync();};header.append(toggle);}
}
new MutationObserver(sync).observe(body,{attributes:true,attributeFilter:['class']});
window.addEventListener('storage',sync);window.addEventListener('pageshow',sync);document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);
sync();
})();
