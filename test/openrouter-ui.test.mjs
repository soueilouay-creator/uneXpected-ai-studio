import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { access } from 'node:fs/promises';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
async function freePort(){
  const server=createServer();
  server.listen(0,'127.0.0.1');
  await once(server,'listening');
  const {port}=server.address();
  await new Promise((done,reject)=>server.close(error=>error?reject(error):done()));
  return port;
}
const hasGateway=await access(resolve(root,'server.js')).then(()=>true,()=>false);
const hasPublic=await access(resolve(root,'public/index.html')).then(()=>true,()=>false);

test('Studio serves a visible OpenRouter test control without exposing provider secrets',
 {skip:(!hasGateway||!hasPublic)&&'The packaged public site is restored by the GitHub Actions integration workflow'},
 async t=>{
  const port=await freePort();
  const token='test-only-token-not-a-production-secret';
  const child=spawn(process.execPath,['server.js'],{
    cwd:root,
    env:{...process.env,PORT:String(port),NODE_ENV:'test',UNEXPECTED_ACCESS_TOKEN:token,OPENROUTER_API_KEY:''},
    stdio:['ignore','pipe','pipe']
  });
  let stderr='';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data',chunk=>stderr+=chunk);
  t.after(()=>{if(!child.killed)child.kill('SIGTERM')});
  const base='http://127.0.0.1:'+port;
  let health;
  for(let n=0;n<40;n++){
    try{health=await fetch(base+'/health');if(health.ok)break;}catch{}
    await delay(100);
  }
  assert.ok(health?.ok,'server did not start; stderr: '+stderr);

  const homepage=await fetch(base+'/');
  assert.equal(homepage.status,200);
  const html=await homepage.text();
  assert.match(html,/openrouter-ui\.js/,'homepage must load the OpenRouter test UI');

  const asset=await fetch(base+'/openrouter-ui.js');
  assert.equal(asset.status,200);
  const script=await asset.text();
  assert.match(script,/Test OpenRouter API/);
  assert.match(script,/\/test-provider/);
  assert.match(script,/sessionStorage/);
  assert.doesNotMatch(script,/sk-or-v1-[A-Za-z0-9]+/,'the UI must not contain an API key');

  const healthData=await health.json();
  assert.equal(healthData.providers.openrouter.configured,false);
  assert.equal(healthData.providers.openrouter.verified,false);

  const unauthorized=await fetch(base+'/test-provider',{
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({provider:'openrouter'})
  });
  assert.equal(unauthorized.status,401);

  const notConfigured=await fetch(base+'/test-provider',{
    method:'POST',
    headers:{'content-type':'application/json',authorization:'Bearer '+token},
    body:JSON.stringify({provider:'openrouter'})
  });
  assert.equal(notConfigured.status,502);
  const failure=await notConfigured.json();
  assert.match(failure.error,/OPENROUTER_API_KEY is not configured/);
 });
