import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFile(resolve(root,p),'utf8');
test('mobile page and manifest use the same install scope',async()=>{
 const html=await read('mobile/index.html'),manifest=JSON.parse(await read('mobile/manifest.webmanifest'));
 assert.match(html,/href="\/mobile\/manifest\.webmanifest"/);assert.equal(manifest.start_url,'/mobile/');assert.equal(manifest.scope,'/mobile/');assert.equal(manifest.display,'standalone');
});
test('embedded application script parses as JavaScript',async()=>{
 const html=await read('mobile/index.html'),script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];assert.ok(script);assert.doesNotThrow(()=>new vm.Script(script));
});
test('phone includes all 40 v7.1 role references and two workflow skills',async()=>{
 const registry=JSON.parse(await read('mobile/agents.json')),skills=JSON.parse(await read('mobile/skills.json'));assert.equal(registry.count,40);assert.equal(registry.agents.length,40);assert.ok(registry.agents.some(a=>a.id==='self-improvement-governor'));assert.ok(registry.agents.some(a=>a.id==='creative-media-studio'));assert.ok(registry.agents.some(a=>a.id==='skill-engineering'));assert.equal(skills.skills.length,2);
});
test('gateway uses a session-only bearer token and never saves it with local workspace data',async()=>{
 const html=await read('mobile/index.html');assert.match(html,/authorization':'Bearer '\s*\+\s*token\(\)/);assert.match(html,/sessionStorage\.setItem\(TOKEN,value\)/);assert.doesNotMatch(html,/localStorage\.setItem\(TOKEN/);assert.match(html,/JSON\.stringify\(\{version:1,workspace:data\}/);
});
test('context sharing is opt-in and improvement approvals are limited to planning',async()=>{
 const html=await read('mobile/index.html');assert.match(html,/id="share"/);assert.match(html,/\$\('share'\)\.checked=false/);assert.match(html,/approved for planning only/);assert.match(html,/does not execute code changes/);
});
test('voice interaction supports recognition, spoken replies and language selection',async()=>{
 const html=await read('mobile/index.html');assert.match(html,/window\.SpeechRecognition\|\|window\.webkitSpeechRecognition/);assert.match(html,/new SpeechSynthesisUtterance/);assert.match(html,/\$\('listen'\)\.onclick/);assert.match(html,/id="voiceLang"/);assert.match(html,/\$\('voiceToggle'\)\.onclick/);
});
test('offline service worker never caches authenticated model endpoints',async()=>{
 const worker=await read('mobile/sw.js');assert.match(worker,/\/orchestrate/);assert.match(worker,/\/test-provider/);assert.match(worker,/\/health/);assert.match(worker,/if \(req\.method !== 'GET'\) return/);
});
test('gateway status renders untrusted status text as text, not HTML',async()=>{
 const html=await read('mobile/index.html');assert.match(html,/el\.textContent='';const dot=document\.createElement\('span'\)/);assert.doesNotMatch(html,/gatewayState'\)\.innerHTML/);
});
