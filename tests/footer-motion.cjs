const {chromium}=require('playwright'),fs=require('fs'),assert=require('assert/strict');
(async()=>{
const b=await chromium.launch({headless:true,executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
const html=fs.readFileSync('index.html','utf8'),styles=[...html.matchAll(/<style\b[^>]*>[\s\S]*?<\/style>/g)].map(x=>x[0]).join('');
for(const width of [390,1440]){
const p=await b.newPage({viewport:{width,height:900}});
await p.route('http://127.0.0.1:4181/**',r=>{const name=new URL(r.request().url()).pathname.slice(1);return fs.existsSync(name)?r.fulfill({body:fs.readFileSync(name),contentType:name.endsWith('.js')?'application/javascript':'text/css'}):r.abort()});await p.route('**/fixture',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><head><link rel="stylesheet" href="/assets/community-glass.7013916ea0163d76.css">'+styles+'</head><body style="height:4000px"><button id="liquid-glass-toggle"></button><div id="modal-overlay"><div class="modal-content" style="position:relative;height:300px;overflow:auto"><button id="close-modal">X</button><div style="height:1200px">Content</div></div></div><script src="/js/community-glass.6218ac771ca6ae72.js"></script></body></html>'}));
await p.goto('http://127.0.0.1:4181/fixture');await p.waitForTimeout(400);
await p.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));await p.waitForTimeout(700);
const btn=p.locator('#footer-menu-toggle-btn'),menu=p.locator('#footer-expandable-menu');
await p.evaluate(()=>document.querySelector('#footer-menu-toggle-btn').click());await p.waitForTimeout(70);
let opacity=await menu.evaluate(e=>{e.getAnimations().forEach(a=>a.currentTime=15);return +getComputedStyle(e).opacity});assert(opacity>0&&opacity<1,'menu must visibly animate, opacity='+opacity);
await p.waitForTimeout(500);
await p.evaluate(()=>document.querySelector('#footer-menu-toggle-btn').click());await p.waitForTimeout(70);
opacity=await menu.evaluate(e=>{e.getAnimations().forEach(a=>a.currentTime=15);return +getComputedStyle(e).opacity});assert(opacity>0&&opacity<1,'close visibly animates '+opacity);
await p.waitForTimeout(350);assert(await menu.evaluate(e=>e.classList.contains('hidden')));
for(let i=0;i<7;i++)await btn.click();await p.keyboard.press('Escape');await p.waitForTimeout(400);assert(await menu.evaluate(e=>e.classList.contains('hidden')));
await p.evaluate(()=>{scrollTo(0,0);document.querySelector('.modal-content').scrollTop=800});await p.waitForTimeout(500);
const x=await p.locator('#close-modal').boundingBox();assert(x&&x.height>=44);
console.log('PASS footer motion/races and sticky X',width);await p.close();
}await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
