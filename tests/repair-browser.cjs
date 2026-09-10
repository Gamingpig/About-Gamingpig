const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const base='http://127.0.0.1:4181/';
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
 for(const viewport of [{width:390,height:844},{width:1440,height:900}]){
  for(const blur of [0,5,15]){
   const page=await browser.newPage({viewport});const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text())});
   await page.route('**/data/glass-config.json**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({enabled:true,blur,saturation:80,refraction:16,edge:.08})}));
   await page.route('https://**/*',r=>r.abort());
   await page.addInitScript(()=>{localStorage.setItem('app_language','de');localStorage.setItem('selectedLanguage','de');localStorage.setItem('onboarding_completed','true');localStorage.setItem('onboarding_completed_version','v24.159.0 · 2026-09-10');localStorage.setItem('liquidGlassMode','true');localStorage.setItem('gp_living_design_v1','{"asked":true}');});
   await page.goto(base+'index.html',{waitUntil:'domcontentloaded'});await page.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());document.querySelector('#ai-version-notice')?.remove();document.querySelectorAll('[aria-modal="true"]').forEach(e=>e.classList.add('hidden'));document.documentElement.classList.remove('needs-onboarding');document.body.classList.remove('overflow-hidden');document.body.style.overflow='';document.documentElement.style.overflow='';document.documentElement.style.scrollBehavior='auto';document.body.classList.add('liquid-glass-active')});await page.waitForTimeout(700);
   const card=page.locator('#main-music-card');assert(await card.count(),'music card');const shotCard=page.locator('.glass-card:visible').first();const style=await card.evaluate(e=>({filter:getComputedStyle(e).backdropFilter,border:getComputedStyle(e).borderColor}));assert.match(style.filter,new RegExp(`blur\\(${blur}px\\)`));assert.match(style.filter,/saturate\((80%|0\.8)\)/);assert.match(style.border,/0\.08|20|21/);
   if(blur===0){const on=path.join(os.tmpdir(),`refraction-${viewport.width}-16.png`),off=path.join(os.tmpdir(),`refraction-${viewport.width}-0.png`);await shotCard.screenshot({path:on});await page.evaluate(()=>{document.documentElement.style.setProperty('--gp-refraction','0');document.documentElement.style.setProperty('--gp-prism-opacity','0');document.querySelector('#gp-liquid-refraction feDisplacementMap')?.setAttribute('scale','0')});await shotCard.screenshot({path:off});assert.notEqual(fs.readFileSync(on).toString('base64'),fs.readFileSync(off).toString('base64'))}
   const social=page.locator('#socials-section');if(await social.count()){for(const y of [0,500,1500,3000,1000,99999])await page.evaluate(v=>scrollTo(0,v),y);const h=await social.evaluate(e=>e.getBoundingClientRect().height);assert(h>50,'social grid height')}
   if(blur===5){
    assert.equal(await page.locator('#settings-global-toggle').count(),1);await page.evaluate(()=>toggleStandaloneSettings());await page.waitForTimeout(50);assert.equal(await page.locator('#global-settings-menu').evaluate(e=>!e.classList.contains('hidden')),true);await page.evaluate(()=>toggleStandaloneSettings());
    assert.equal(await page.locator('#theme-toggle').count(),1);await page.locator('#theme-toggle').click({force:true});await page.locator('html').evaluate(e=>e.classList.add('dark'));assert.match(await card.evaluate(e=>getComputedStyle(e).backdropFilter),/blur\(5px\)/);await page.locator('html').evaluate(e=>e.classList.remove('dark'));assert.match(await card.evaluate(e=>getComputedStyle(e).backdropFilter),/blur\(5px\)/);
    assert.equal(await page.locator('#btn-lyrics-show').count(),1);await card.evaluate(e=>e.classList.add('lyrics-open'));assert.equal(await page.locator('#lyrics-overlay').count(),1);await card.evaluate(e=>e.classList.remove('lyrics-open'));
    await page.evaluate(()=>openEpicWhatsNewTour(false));assert.equal(await page.locator('#whats-new-epic-modal').evaluate(e=>!e.classList.contains('hidden')),true);
   }
   const unexpected=errors.filter(e=>!/Failed to fetch|showModal.*not in a Document/.test(e));assert.deepEqual(unexpected,[],unexpected.join('\n'));await page.close();console.log('OK',viewport.width,'blur',blur,style);
  }
  const footerPage=await browser.newPage({viewport});await footerPage.goto(base+'impressum.html',{waitUntil:'domcontentloaded'});await footerPage.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';scrollTo(0,document.documentElement.scrollHeight)});await footerPage.waitForTimeout(550);const ft=footerPage.locator('#footer-menu-toggle-btn');for(let i=0;i<10;i++){await ft.click();await footerPage.waitForTimeout(400);assert.equal(await ft.getAttribute('aria-expanded'),'true');await ft.click();await footerPage.waitForTimeout(260);assert.equal(await ft.getAttribute('aria-expanded'),'false')}for(let i=0;i<7;i++)await ft.click({force:true});await footerPage.keyboard.press('Escape');assert.equal(await ft.getAttribute('aria-expanded'),'false');await footerPage.close();console.log('FOOTER OK',viewport.width);
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
