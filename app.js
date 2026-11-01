'use strict';
const $=id=>document.getElementById(id);let mode='both';try{window.__UX_ACCESS_TOKEN=sessionStorage.getItem('ux_access_token')||'';}catch{}
if($('accessToken'))$('accessToken').value=window.__UX_ACCESS_TOKEN;
function status(id,text,cls=''){const e=$(id);e.textContent=text;e.className=cls;}
function card(title,tag,body){const el=document.createElement('article');el.className='answer';const head=document.createElement('div');head.className='answerhead';const strong=document.createElement('strong');strong.textContent=title;const pill=document.createElement('span');pill.className='pill';pill.textContent=tag;head.append(strong,pill);const content=document.createElement('div');content.className='answertext';content.textContent=body;el.append(head,content);return el;}
async function api(path,body){const res=await fetch(path,{method:body?'POST':'GET',headers:body?{'content-type':'application/json','authorization':'Bearer '+(window.__UX_ACCESS_TOKEN||'')}:{},body:body?JSON.stringify(body):undefined,cache:'no-store'});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error||`HTTP ${res.status}`);return data;}
function renderProvider(id,label,p){if(!p){status(id,'Not tested · see health endpoint');return;}if(p.verified)status(id,`Verified live · ${p.model||'provider'} `,'success');else if(p.configured)status(id,'Secret present · not yet verified');else status(id,'Not configured on server');}
async function refresh(){status('serverStatus','Checking backend…');try{const h=await api('/health');status('serverStatus',h.authConfigured?'Backend online · access token set':'Backend online · locked until access token is configured',h.authConfigured?'success':'error');renderProvider('openaiStatus','ChatGPT',h.providers?.openai);renderProvider('claudeStatus','Claude',h.providers?.anthropic);$('modeBadge').textContent=h.providers?.openai?.configured||h.providers?.anthropic?.configured?'● BACKEND ONLINE · PROVIDERS NEED TEST':'● BACKEND ONLINE · PROVIDERS NOT CONFIGURED';$('modeBadge').style.color='var(--cyan)';$('modeBadge').style.borderColor='#315b58';$('demoNotice').classList.toggle('hidden',Boolean(h.providers?.openai?.configured&&h.providers?.anthropic?.configured));}catch(e){status('serverStatus','Backend unavailable · '+e.message,'error');$('modeBadge').textContent='● BACKEND UNAVAILABLE';$('demoNotice').classList.remove('hidden');}}
document.querySelectorAll('.choice').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.mode;document.querySelectorAll('.choice').forEach(x=>x.classList.toggle('active',x===b));}));
$('prompt').addEventListener('input',()=>{$('charCount').textContent=$('prompt').value.length.toLocaleString()+' / 16,000 characters';});$('health').addEventListener('click',refresh);async function testProvider(provider,buttonId,label){const button=$(buttonId),msg=$('providerTestMessage');button.disabled=true;const old=button.textContent;button.textContent='Testing…';status('serverStatus','Testing '+label+' with a real API request…');msg.textContent='Sending a real provider test. API usage may be billed.';try{const d=await api('/test-provider',{provider});msg.textContent=label+' verified · '+(d.model||'model')+' · '+d.latencyMs+' ms · response: '+d.text;msg.className='hint success';await refresh();}catch(e){msg.textContent=label+' test failed: '+e.message;msg.className='hint error';status('serverStatus',label+' test failed · '+e.message,'error');}finally{button.disabled=false;button.textContent=old;}}if($('testOpenAI'))$('testOpenAI').addEventListener('click',()=>testProvider('openai','testOpenAI','ChatGPT'));if($('testClaude'))$('testClaude').addEventListener('click',()=>testProvider('anthropic','testClaude','Claude'));if($('settingsToggle'))$('settingsToggle').addEventListener('click',()=>$('config').classList.toggle('open'));if($('saveToken'))$('saveToken').addEventListener('click',()=>{window.__UX_ACCESS_TOKEN=$('accessToken').value.trim();try{sessionStorage.setItem('ux_access_token',window.__UX_ACCESS_TOKEN);}catch{}$('configMessage').textContent='Token set for this tab. Refresh status to verify access.';});

const pendingExcelFiles = [];
function renderRootExcelAttachments(){
 const host=$('excelAttachmentList');
 if(!host)return;
 host.replaceChildren();
 for(const file of pendingExcelFiles){
  const chip=document.createElement('span');
  chip.className='hint';
  chip.textContent=file.name+' · '+Math.round(file.sizeBytes/1024)+' KB ';
  const remove=document.createElement('button');
  remove.type='button';remove.textContent='×';remove.title='Remove from next request';
  remove.addEventListener('click',()=>{const i=pendingExcelFiles.findIndex(x=>x.id===file.id);if(i>=0)pendingExcelFiles.splice(i,1);renderRootExcelAttachments();});
  chip.append(remove);host.append(chip);
 }
}
(function addRootExcelControls(){
 const promptField=$('prompt');
 if(!promptField || $('excelAttachmentControls'))return;
 const host=document.createElement('div');
 host.id='excelAttachmentControls';
 host.style.cssText='display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:9px 0;color:#94a3b8;font-size:12px';
 const picker=document.createElement('input');
 picker.type='file';picker.accept='.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';picker.multiple=true;picker.hidden=true;
 const button=document.createElement('button');
 button.type='button';button.className='choice';button.textContent='Attach .xlsx';
 button.addEventListener('click',()=>{if(!window.__UX_ACCESS_TOKEN){status('serverStatus','Set the gateway access token before uploading a workbook.','error');$('accessToken')?.focus();return;}picker.click();});
 const note=document.createElement('span');
 note.textContent='XLSX only · 20 MiB each · temporary upload expires after 30 minutes';
 const list=document.createElement('div');list.id='excelAttachmentList';list.style.cssText='display:flex;gap:6px;flex-wrap:wrap;width:100%';
 picker.addEventListener('change',async()=>{
  const files=[...(picker.files||[])];picker.value='';
  if(files.length+pendingExcelFiles.length>8){status('serverStatus','Attach no more than 8 workbooks per request.','error');return;}
  for(const file of files){
   if(!file.name.toLowerCase().endsWith('.xlsx')||!file.size||file.size>20*1024*1024){status('serverStatus',file.name+' must be an .xlsx file no larger than 20 MiB.','error');continue;}
   if(!window.__UX_ACCESS_TOKEN){status('serverStatus','Gateway token is missing.','error');break;}
   try{
    status('serverStatus','Uploading '+file.name+'…');
    const response=await fetch('/excel/upload',{method:'POST',headers:{authorization:'Bearer '+window.__UX_ACCESS_TOKEN,'content-type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','x-file-name':encodeURIComponent(file.name)},body:file,cache:'no-store'});
    const payload=await response.json().catch(()=>({}));
    if(!response.ok||!payload.file?.id)throw new Error(payload.error||'Upload failed ('+response.status+').');
    pendingExcelFiles.push(payload.file);renderRootExcelAttachments();
    status('serverStatus',file.name+' attached. Bounded sheet previews will be shared with the selected AI provider.','success');
   }catch(error){status('serverStatus','Upload failed · '+error.message,'error');}
  }
 });
 const disclosure=document.createElement('span');
 disclosure.style.cssText='flex-basis:100%;font-size:10px;opacity:.8';
 disclosure.textContent='Bounded sheet previews are sent to the selected AI provider. Do not upload confidential data unless its provider terms allow it.';
 host.append(button,picker,note,list,disclosure);
 promptField.insertAdjacentElement('afterend',host);
})();
async function downloadRootExcelArtifact(artifact){
 if(!artifact?.id||!/^[0-9a-f-]{36}$/i.test(artifact.id))return;
 const response=await fetch('/excel/download/'+artifact.id,{headers:{authorization:'Bearer '+(window.__UX_ACCESS_TOKEN||'')},cache:'no-store'});
 if(!response.ok){const payload=await response.json().catch(()=>({}));throw new Error(payload.error||'Workbook download failed ('+response.status+').');}
 const blob=await response.blob(),url=URL.createObjectURL(blob),anchor=document.createElement('a');
 anchor.href=url;anchor.download=artifact.fileName||'uneXpected-workbook.xlsx';document.body.append(anchor);anchor.click();anchor.remove();URL.revokeObjectURL(url);
}

$('run').addEventListener('click',async()=>{
 const files=[...pendingExcelFiles];
 const task=$('prompt').value.trim()||(files.length?'Inspect the attached workbook and summarize its structure and notable data-quality issues.':'');
 if(!task){$('prompt').focus();return;}
 if(files.length&&mode==='openrouter'){status('serverStatus','Choose ChatGPT, Claude or Compare for uploaded workbooks. OpenRouter has no Excel tools.','error');return;}
 const button=$('run'),out=$('results');out.replaceChildren();button.disabled=true;button.textContent='Working…';
 try{
  const d=await api('/orchestrate',{task,mode,excelFiles:files.map(file=>file.id)});
  for(const k of ['openai','anthropic','openrouter','synthesis']){
   const x=d.results?.[k],provenance=x?.provider==='openrouter'?'FALLBACK · ':'';
   const model=x?.model?' · model '+x.model:'',route=x?.requestedModel&&x.requestedModel!==x.model?' · route '+x.requestedModel:'';
   if(x?.text)out.append(card(x.label||k.toUpperCase(),`${provenance}${x.status||'LIVE'}${x.latencyMs?' · '+x.latencyMs+' ms':''}${model}${route}`,x.text));
   else if(x?.error)out.append(card(x.label||k.toUpperCase(),`${provenance}${x.status||'FAILED'}`,x.error));
  }
  if(Array.isArray(d.excelArtifacts)&&d.excelArtifacts.length){
   const downloads=document.createElement('section');downloads.className='answer';
   const title=document.createElement('strong');title.textContent='Generated Excel workbooks';downloads.append(title);
   for(const artifact of d.excelArtifacts){
    const row=document.createElement('div');row.style.cssText='display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:8px';
    const label=document.createElement('span');label.textContent=(artifact.fileName||'Workbook')+' · expires in '+(artifact.expiresInSeconds||0)+' seconds';
    const download=document.createElement('button');download.type='button';download.className='choice';download.textContent='Download .xlsx';
    download.addEventListener('click',async()=>{download.disabled=true;try{await downloadRootExcelArtifact(artifact);}catch(error){status('serverStatus','Download failed · '+error.message,'error');}finally{download.disabled=false;}});
    row.append(label,download);downloads.append(row);
   }
   out.append(downloads);
  }
  if(!out.children.length)throw new Error('No provider responses were returned.');
  if(d.ok&&files.length){const used=new Set(files.map(file=>file.id));for(let i=pendingExcelFiles.length-1;i>=0;i--)if(used.has(pendingExcelFiles[i].id))pendingExcelFiles.splice(i,1);renderRootExcelAttachments();}
  const completion=d.fallback?.status==='succeeded'?`Task completed · OpenRouter fallback · ${d.fallback.model||d.fallback.requestedModel}`:d.ok?'Task completed with at least one real provider response':'No provider returned a successful answer';
  status('serverStatus',completion,d.ok?'success':'error');
 }catch(e){out.append(card('Request status','ERROR',e.message+'\\n\\nNo simulated response was presented as a real model answer.'));status('serverStatus','Request failed · '+e.message,'error');}
 finally{button.disabled=false;button.textContent='Run orchestration ↗';}
});
refresh();
