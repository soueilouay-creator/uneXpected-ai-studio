import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
async function freePort(){const server=createServer();server.listen(0,'127.0.0.1');await once(server,'listening');const {port}=server.address();await new Promise((done,reject)=>server.close(e=>e?reject(e):done()));return port}
const hasGateway=await access(resolve(root,'server.js')).then(()=>true,()=>false);
test('gateway serves the phone app without weakening its existing authorization',{skip:!hasGateway&&'server.js is supplied by the host repository; HTTP smoke test runs in GitHub Actions'},async t=>{
 const port=await freePort(),token='test-only-token-not-a-production-secret';
 const child=spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,PORT:String(port),NODE_ENV:'test',UNEXPECTED_ACCESS_TOKEN:token},stdio:['ignore','pipe','pipe']});
 let stderr='';child.stderr.setEncoding('utf8');child.stderr.on('data',chunk=>stderr+=chunk);t.after(()=>{if(!child.killed)child.kill('SIGTERM')});
 const base='http://127.0.0.1:'+port;let health;
 for(let n=0;n<40;n++){try{health=await fetch(base+'/health');if(health.ok)break}catch{}await delay(100)}
 assert.ok(health?.ok,'server did not start; stderr: '+stderr);
 const homepage=await fetch(base);assert.equal(homepage.status,200);assert.match(await homepage.text(),/uneXpected/i);
 const app=await fetch(base+'/mobile/');assert.equal(app.status,200);assert.match(app.headers.get('content-type'),/text\/html/);assert.match(app.headers.get('content-security-policy')||'','/default-src/');assert.match(await app.text(),/uneXpected · Phone/);
 const manifest=await fetch(base+'/mobile/manifest.webmanifest');assert.equal(manifest.status,200);assert.match(manifest.headers.get('content-type'),/manifest\+json/);const m=await manifest.json();assert.equal(m.start_url,'/mobile/');assert.equal(m.scope,'/mobile/');
 const sw=await fetch(base+'/mobile/sw.js');assert.equal(sw.status,200);assert.match(await sw.text(),/\/orchestrate/);
 const roles=await fetch(base+'/mobile/agents.json');assert.equal(roles.status,200);assert.equal((await roles.json()).count,40);
 const icon=await fetch(base+'/mobile/icon.svg');assert.equal(icon.status,200);assert.match(icon.headers.get('content-type'),/image\/svg\+xml/);
 assert.equal((await fetch(base+'/mobile/%2e%2e/server.js')).status,404);
 const unauthorized=await fetch(base+'/orchestrate',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({task:'must not be executed',mode:'openai'})});assert.equal(unauthorized.status,401);
 const invalid=await fetch(base+'/orchestrate',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer wrong-token'},body:JSON.stringify({task:'must not be executed',mode:'openai'})});assert.equal(invalid.status,401);
});
