(()=>{'use strict';const root=document.documentElement,body=document.body,defaults={enabled:true,blur:7,saturation:128,refraction:3.4,edge:.28},reduced=matchMedia('(prefers-reduced-motion: reduce)');let config={...defaults};const material=/glass-card|glow-card|glass-stage|#main-music-card|#mini-player-toggle|#ui-controls|#footer-bubble|#footer-expandable-menu|#global-settings-menu|#lyrics-settings-menu|#tutorial-box|\.modal-content|\.card/;
function strip(sheet){let rules;try{rules=sheet.cssRules}catch(_){return}for(const rule of rules){if(rule.cssRules)strip(rule);if(!rule.selectorText||!material.test(rule.selectorText))continue;const s=rule.style;if(!s)continue;s.removeProperty('backdrop-filter');s.removeProperty('-webkit-backdrop-filter');if(/liquid-glass-active|gp-glass/.test(rule.selectorText)){s.removeProperty('background');s.removeProperty('background-color');s.removeProperty('background-image')}}}
function retire(){for(const sheet of document.styleSheets)if(sheet.ownerNode?.dataset?.gpGlassEngine!=='true')strip(sheet)}
function apply(value){config={...defaults,...value};const blur=Math.max(0,Number(config.blur)||0),sat=Math.max(0,Number(config.saturation)||0),ref=Math.max(0,Math.min(16,Number(config.refraction)||0)),edge=Math.max(0,Math.min(.8,Number(config.edge)||0));root.style.setProperty('--gp-blur',`${blur}px`);root.style.setProperty('--gp-saturation',`${sat}%`);root.style.setProperty('--gp-refraction',ref);root.style.setProperty('--gp-edge-alpha',edge);root.style.setProperty('--gp-prism-opacity',ref/16*.56);root.style.setProperty('--gp-prism-shift',`${ref*.18}px`);document.querySelector('#gp-liquid-refraction feDisplacementMap')?.setAttribute('scale',String(ref));root.classList.toggle('gp-glass-admin-disabled',config.enabled===false)}
function optics(){if(document.getElementById('gp-liquid-optics'))return;const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.id='gp-liquid-optics';svg.setAttribute('aria-hidden','true');svg.style.cssText='position:fixed;width:0;height:0;overflow:hidden;pointer-events:none';svg.innerHTML='<defs><filter id="gp-liquid-refraction" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".012 .018" numOctaves="1" seed="7" result="surface"/><feGaussianBlur in="surface" stdDeviation=".55" result="soft-surface"/><feDisplacementMap in="SourceGraphic" in2="soft-surface" scale="0" xChannelSelector="R" yChannelSelector="G"/></filter></defs>';body.append(svg);apply(config)}
async function load(){try{const r=await fetch(`data/glass-config.json?release=${Date.now()}`,{cache:'no-store'});if(r.ok)apply(await r.json())}catch(e){console.warn('[glass] configuration unavailable',e)}}
function sync(){root.classList.toggle('gp-glass',body.classList.contains('liquid-glass-active')||!document.getElementById('liquid-glass-toggle'))}
function footer(){
  if(body.hasAttribute('data-glass-overlay'))return;
  const isHomePage=!!document.getElementById('liquid-glass-toggle');
  let bubble=document.getElementById('footer-bubble');
  let menu=document.getElementById('footer-expandable-menu');

  if(!bubble){
    bubble=document.createElement('div');
    bubble.id='footer-bubble';
    bubble.className='gp-universal-footer';
    bubble.setAttribute('aria-hidden','true');
    bubble.innerHTML='<span id="footer-established">© 2026 GAMINGPIG</span><span aria-hidden="true">•</span><span id="footer-version-label">v24.182.0</span><span aria-hidden="true">•</span><button id="footer-menu-toggle-btn" type="button" aria-expanded="false"><span id="footer-more-label">Mehr</span> <span id="footer-menu-arrow">▲</span></button>';
    body.appendChild(bubble);
  }
  if(!menu){
    menu=document.createElement('div');
    menu.id='footer-expandable-menu';
    menu.className='gp-universal-footer-menu hidden';
    menu.setAttribute('aria-label','Footer navigation');
    menu.innerHTML='<div class="gp-footer-head"><span id="footer-menu-title">Navigation & Rechtliches</span><span id="footer-menu-hint">v24.182.0</span></div><div class="gp-footer-grid"><a class="gp-footer-link" href="index.html">⌂ <span data-gp-footer="home">Startseite</span></a><button class="gp-footer-link" id="footer-whats-new-btn" type="button">📜 <span data-gp-footer="news">Was ist neu?</span></button><a class="gp-footer-link" href="status.html">🟢 <span data-gp-footer="status">Live-Status</span></a><a class="gp-footer-link" href="privacy.html">🛡️ <span data-gp-footer="privacy">Datenschutz</span></a><a class="gp-footer-link" href="impressum.html">⚖️ <span data-gp-footer="legal">Impressum</span></a><a class="gp-footer-link" href="roadmap.html">🔮 <span data-gp-footer="roadmap">Roadmap</span></a><button class="gp-footer-link" id="footer-settings-btn" type="button">⚙️ <span data-gp-footer="settings">Einstellungen</span></button><a class="gp-footer-link" href="push-admin.html">🔐 <span data-gp-footer="admin">Admin</span></a></div>';
    body.appendChild(menu);
  }

  const toggle=document.getElementById('footer-menu-toggle-btn');
  if(!toggle||bubble.dataset.gpFooterInitialized)return;
  bubble.dataset.gpFooterInitialized='true';
  bubble.dataset.gpFooter=menu.dataset.gpFooter='true';
  toggle.removeAttribute('onclick');

  let shown=false,open=false,ba=null,ma=null;
  const motion=()=>!reduced.matches;

  const copy={
    de:{title:'Navigation & Rechtliches',more:'Mehr',home:'Startseite',news:'Was ist neu?',status:'Live-Status',privacy:'Datenschutz',legal:'Impressum',roadmap:'Roadmap',settings:'Einstellungen',admin:'Admin'},
    en:{title:'Navigation & Legal',more:'More',home:'Home',news:"What's New",status:'Live Status',privacy:'Privacy',legal:'Legal Notice',roadmap:'Roadmap',settings:'Settings',admin:'Admin'},
    es:{title:'Navegación y legal',more:'Más',home:'Inicio',news:'Novedades',status:'Estado',privacy:'Privacidad',legal:'Aviso legal',roadmap:'Hoja de ruta',settings:'Ajustes',admin:'Admin'},
    fr:{title:'Navigation et mentions',more:'Plus',home:'Accueil',news:'Nouveautés',status:'État',privacy:'Confidentialité',legal:'Mentions légales',roadmap:'Feuille de route',settings:'Réglages',admin:'Admin'},
    pt:{title:'Navegação e legal',more:'Mais',home:'Início',news:'Novidades',status:'Status',privacy:'Privacidade',legal:'Aviso legal',roadmap:'Roteiro',settings:'Ajustes',admin:'Admin'},
    tr:{title:'Gezinme ve yasal',more:'Daha',home:'Ana sayfa',news:'Yenilikler',status:'Canlı durum',privacy:'Gizlilik',legal:'Yasal bildirim',roadmap:'Yol haritası',settings:'Ayarlar',admin:'Yönetici'}
  };

  function translate(){
    const lang=((window.AppStorage||localStorage).getItem('app_language')||root.lang||'de').slice(0,2);
    const t=copy[lang]||copy.de;
    const titleEl=menu.querySelector('#footer-menu-title');
    const moreEl=bubble.querySelector('#footer-more-label');
    if(titleEl)titleEl.textContent=t.title;
    if(moreEl)moreEl.textContent=t.more;
    menu.querySelectorAll('[data-gp-footer]').forEach(e=>{if(t[e.dataset.gpFooter])e.textContent=t[e.dataset.gpFooter];});
  }

  function positionMenu(){
    const r=bubble.getBoundingClientRect();
    menu.style.bottom = Math.max(64, innerHeight - r.top + 12) + "px";
  }

  function expand(v){
    open=v;
    toggle.setAttribute('aria-expanded',String(v));
    const a=document.getElementById('footer-menu-arrow');
    if(a)a.style.transform=v?'rotate(180deg)':'rotate(0deg)';
  }

  function closeMenu(now=false){
    if(!open&&menu.classList.contains('hidden'))return;
    expand(false);
    if(ma){ma.cancel();ma=null;}
    const done=()=>{
      menu.classList.add('hidden');
      menu.classList.remove('footer-animating');
    };
    if(now||!motion())return done();
    menu.classList.add('footer-animating');
    ma=menu.animate([
      {opacity:1,transform:'translateX(-50%) translateY(0) scale(1)',filter:'blur(0)'},
      {opacity:0,transform:'translateX(-50%) translateY(14px) scale(.96)',filter:'blur(2px)'}
    ],{duration:240,easing:'cubic-bezier(.4,0,.2,1)'});
    ma.onfinish=done;
  }

  function openMenu(){
    if(open)return;
    expand(true);
    if(ma){ma.cancel();ma=null;}
    positionMenu();
    menu.classList.remove('hidden');
    menu.classList.add('footer-animating');
    if(!motion()){
      menu.classList.remove('footer-animating');
      return;
    }
    ma=menu.animate([
      {opacity:0,transform:'translateX(-50%) translateY(20px) scale(.94)',filter:'blur(4px)'},
      {opacity:1,transform:'translateX(-50%) translateY(0) scale(1)',filter:'blur(0)'}
    ],{duration:360,easing:'cubic-bezier(.16,1,.3,1)'});
    ma.onfinish=()=>{menu.classList.remove('footer-animating');};
  }

  function bubbleState(next){
    if(next===shown)return;
    shown=next;
    if(ba){ba.cancel();ba=null;}
    if(next){
      bubble.classList.add('footer-bubble-visible');
      bubble.removeAttribute('aria-hidden');
      if(motion()){
        ba=bubble.animate([
          {opacity:0,transform:'translateX(-50%) translateY(20px) scale(.94)',filter:'blur(3px)'},
          {opacity:1,transform:'translateX(-50%) translateY(0) scale(1)',filter:'blur(0)'}
        ],{duration:420,easing:'cubic-bezier(.16,1,.3,1)'});
      }
    } else {
      closeMenu(true);
      if(!motion()){
        bubble.classList.remove('footer-bubble-visible');
        bubble.setAttribute('aria-hidden','true');
        return;
      }
      ba=bubble.animate([
        {opacity:1,transform:'translateX(-50%) translateY(0) scale(1)'},
        {opacity:0,transform:'translateX(-50%) translateY(18px) scale(.94)',filter:'blur(3px)'}
      ],{duration:240,easing:'cubic-bezier(.4,0,.2,1)'});
      ba.onfinish=()=>{
        bubble.classList.remove('footer-bubble-visible');
        bubble.setAttribute('aria-hidden','true');
      };
    }
  }

  const update=()=>{
    const max=Math.max(0,document.documentElement.scrollHeight-innerHeight);
    const atEnd=(max<=120)||(max>0&&(max-scrollY<=320));
    bubbleState(atEnd&&!body.classList.contains('standby-mode'));
  };

  toggle.addEventListener('click',e=>{
    e.preventDefault();
    e.stopImmediatePropagation();
    open?closeMenu():openMenu();
  },true);

  document.addEventListener('pointerdown',e=>{
    if(open&&!menu.contains(e.target)&&!bubble.contains(e.target)){e.stopPropagation();closeMenu();}
  },true);

  document.addEventListener('keydown',e=>{
    if(e.key==='Escape')closeMenu();
  });

  const whatsNewBtn=menu.querySelector('#footer-whats-new-btn');
  if(whatsNewBtn){
    whatsNewBtn.addEventListener('click',()=>{
      closeMenu(false);
      if(isHomePage&&typeof window.openEpicWhatsNewTour==='function')window.openEpicWhatsNewTour(false);
      else location.href='release.html';
    });
  }

  const settingsBtn=menu.querySelector('#footer-settings-btn');
  if(settingsBtn){
    settingsBtn.addEventListener('click',e=>{
      closeMenu(false);
      if(isHomePage&&typeof window.toggleStandaloneSettings==='function')window.toggleStandaloneSettings(e);
      else location.href='index.html?openSettings=1';
    });
  }

  window.toggleFooterMenu=force=>(typeof force==='boolean'?force:!open)?openMenu():closeMenu();
  addEventListener('scroll',update,{passive:true});
  addEventListener('resize',()=>{positionMenu();update();},{passive:true});
  new MutationObserver(update).observe(body,{attributes:true,attributeFilter:['class']});
  new MutationObserver(translate).observe(root,{attributes:true,attributeFilter:['lang']});
  translate();
  update();
}
function admin(){if(!/push-admin\.html$/i.test(location.pathname))return;const host=document.getElementById('view-glass')||document.getElementById('admin-dashboard');if(!host||document.getElementById('gp-glass-admin'))return;const p=document.createElement('section');p.id='gp-glass-admin';p.className='glass-card';p.innerHTML='<h2>💎 Globales Liquid Glass</h2><label><input id="gp-admin-enabled" type="checkbox"> Aktiv</label><label>Unschärfe <input id="gp-admin-blur" type="range" min="0" max="24"></label><label>Sättigung <input id="gp-admin-saturation" type="range" min="80" max="200"></label><label>Lichtbrechung <input id="gp-admin-refraction" type="range" min="0" max="16" step=".2"></label><label>Glaskante <input id="gp-admin-edge" type="range" min="0" max=".8" step=".02"></label><button id="gp-admin-save" type="button">Für alle speichern</button><span id="gp-admin-state" role="status"></span>';host.append(p);const fields={enabled:'gp-admin-enabled',blur:'gp-admin-blur',saturation:'gp-admin-saturation',refraction:'gp-admin-refraction',edge:'gp-admin-edge'},syncFields=()=>Object.entries(fields).forEach(([k,id])=>document.getElementById(id)[k==='enabled'?'checked':'value']=config[k]);syncFields();p.querySelector('#gp-admin-save').onclick=async()=>{const state=p.querySelector('#gp-admin-state');try{const token=await window.AdminVault?.getToken();if(!token)throw Error('GitHub-Token fehlt im Tresor.');const value=Object.fromEntries(Object.entries(fields).map(([k,id])=>[k,k==='enabled'?document.getElementById(id).checked:Number(document.getElementById(id).value)]));value.updatedAt=new Date().toISOString();const url='https://api.github.com/repos/Gamingpig/About-Gamingpig/contents/data/glass-config.json',headers={Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','Content-Type':'application/json'},cur=await fetch(url,{headers,cache:'no-store'}),meta=cur.ok?await cur.json():{},content=btoa(unescape(encodeURIComponent(`${JSON.stringify(value,null,2)}\n`))),saved=await fetch(url,{method:'PUT',headers,body:JSON.stringify({message:'admin: update global liquid glass settings [skip ci]',content,sha:meta.sha})});if(!saved.ok)throw Error(`Speichern fehlgeschlagen: ${saved.status}`);apply(value);state.textContent='✓ Global gespeichert'}catch(e){state.textContent=e.message}}}
function boot(){retire();optics();sync();footer();admin();load();new MutationObserver(sync).observe(body,{attributes:true,attributeFilter:['class']})}document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot()})();
