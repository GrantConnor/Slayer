const {app}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const {execFile,spawn}=require('node:child_process');
const {promisify}=require('node:util');
const run=promisify(execFile);
const version=require('./package.json').version;
const root=__dirname, launcher=path.join(root,'Play-Slayer.cmd');
const expected=/^https:\/\/github\.com\/GrantConnor\/Slayer(?:\.git)?\/?$/i;
function setupUpdater(win){
 let checking=false,ready=false,restarting=false;
 const send=(message,canRestart=false)=>{if(!win.isDestroyed())win.webContents.send('update-status',{message,canRestart});};
 const git=(args)=>run('git',args,{cwd:root,windowsHide:true,timeout:45000,maxBuffer:1024*1024,env:{...process.env,GIT_TERMINAL_PROMPT:'0',GCM_INTERACTIVE:'never'}}).then(r=>r.stdout.trim());
 async function check(interactive=false){
  if(checking)return;checking=true;ready=false;
  try{
   if(interactive)send('Installed Alpha '+version+' · Checking GitHub…');
   const response=await fetch('https://raw.githubusercontent.com/GrantConnor/Slayer/main/package.json',{signal:AbortSignal.timeout(15000),cache:'no-store'});
   if(!response.ok)throw Error('GitHub returned '+response.status);
   const latest=(await response.json()).version;
   if(!/^\d+\.\d+\.\d+$/.test(latest))throw Error('Invalid remote version');
   const label='Installed Alpha '+version+' · Latest Alpha '+latest;
   if(app.isPackaged||!fs.existsSync(launcher)){send(label+' · Switch to the public GitHub launcher for updates.');return;}
   if(!expected.test(await git(['remote','get-url','origin']))||await git(['branch','--show-current'])!=='main'){send(label+' · Launch from a clean GrantConnor/Slayer checkout on main.');return;}
   if(await git(['status','--porcelain','--untracked-files=no'])){send(label+' · Local changes prevent automatic updates.');return;}
   const head=await git(['rev-parse','HEAD']);
   const remote=(await git(['ls-remote','origin','refs/heads/main'])).split(/\s+/)[0];
   if(!/^[a-f0-9]{40}$/i.test(remote))throw Error('No remote revision');
   ready=head!==remote;
   send(label+(ready?' · New revision available.':' · Up to date.'),ready);
  }catch(e){send('Installed Alpha '+version+' · Unable to verify GitHub updates. Reopen using Play-Slayer.cmd.');console.error('Update check:',e.message);}
  finally{checking=false;}
 }
 function restart(){if(!ready||checking||restarting||app.isPackaged||process.platform!=='win32')return;restarting=true;win.close();}
 function installOnClose(){
  if(!restarting)return false;
  restarting=false;
  try{
   const ps="Start-Sleep -Seconds 2; & (Join-Path $env:SLAYER_UPDATE_ROOT 'Play-Slayer.cmd')";
   const child=spawn('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-Command',ps],{cwd:root,detached:true,stdio:'ignore',windowsHide:true,env:{...process.env,SLAYER_UPDATE_ROOT:root}});
   child.on('error',e=>console.error('Restart failed:',e));child.unref();
  }catch(e){console.error('Restart failed:',e);}
  return false;
 }
 return {check,restart,installOnClose};
}
module.exports={setupUpdater};
