const {app,dialog}=require('electron');
const fs=require('node:fs'), path=require('node:path');
// Only the NSIS installed build contains this generated update feed.
function setupUpdater(win) {
  let updater, state='idle', manual=false, downloaded=false;
  const send=(message)=>{if(!win.isDestroyed())win.webContents.send('update-status',message);};
  const supported=process.platform==='win32'&&app.isPackaged&&fs.existsSync(path.join(process.resourcesPath,'app-update.yml'));
  if(supported){try{updater=require('electron-updater').autoUpdater;}catch(e){console.error('Updater unavailable:',e);}}
  function check(interactive=false){
    if(!updater){if(interactive)send('For private Git updates, close the game and reopen using Play-Slayer.cmd. Installed-release updates require a published feed.');return;}
    if(downloaded){send('Update ready. Close and reopen Slayer Hub to install.');return;}
    if(state==='checking'||state==='downloading'){if(interactive)send('Update check/download already running.');return;}
    manual=interactive;state='checking';send('Checking for updates…');
    Promise.resolve().then(()=>updater.checkForUpdates()).catch(fail);
  }
  function fail(error){if(state==='idle')return;state='idle';send('Update unavailable — you can continue playing.');console.error('Slayer Hub update:',error);manual=false;}
  if(updater){
    updater.autoDownload=true;updater.autoInstallOnAppQuit=false;updater.allowPrerelease=false;updater.allowDowngrade=false;
    updater.on('update-available',info=>{state='downloading';send('Downloading Alpha '+info.version+'…');});
    updater.on('update-not-available',()=>{state='idle';send(manual?'You have the latest version.':'Up to date.');manual=false;});
    updater.on('download-progress',p=>{state='downloading';send('Downloading update: '+Math.floor(p.percent)+'%');});
    updater.on('update-downloaded',info=>{state='ready';downloaded=true;send('Alpha '+info.version+' ready — close and reopen to update.');});
    updater.on('error',fail);
  }
  return {check, installOnClose(){if(!updater||!downloaded)return false;try{updater.quitAndInstall(true,false);return true;}catch(e){console.error('Install failed:',e);return false;}}};
}
module.exports={setupUpdater};
