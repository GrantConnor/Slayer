const {app,BrowserWindow,Menu,ipcMain,dialog,protocol,net}=require('electron');
const path=require('node:path'),fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const {setupUpdater}=require('./updater');
protocol.registerSchemesAsPrivileged([{scheme:'slayer',privileges:{standard:true,secure:true,supportFetchAPI:true}}]);
function serveGame(request){
  try {
    const url=new URL(request.url);
    if(url.hostname!=='game'||url.username||url.password||url.port||request.method!=='GET')return new Response(null,{status:403});
    const name=decodeURIComponent(url.pathname).slice(1);
    if(name!=='Slayer.html'&&!/^assets\/[a-z0-9/.-]+\.(png|webp)$/.test(name))return new Response(null,{status:404});
    if(name.split('/').some(part=>!part||part==='.'||part==='..'))return new Response(null,{status:403});
    const target=path.resolve(__dirname,name);
    if(!target.startsWith(path.resolve(__dirname)+path.sep))return new Response(null,{status:403});
    return net.fetch(pathToFileURL(target).href);
  }catch(e){return new Response(null,{status:400});}
}

app.commandLine.appendSwitch('disable-renderer-backgrounding');app.commandLine.appendSwitch('disable-background-timer-throttling');app.setName('Slayer Hub');
const dir=path.join(app.getPath('appData'),'Slayer Hub','saves'),file=path.join(dir,'character.json'),backup=file+'.bak';
function read(p){const d=JSON.parse(fs.readFileSync(p,'utf8'));if(d.version!==1||!Array.isArray(d.inventory)||!Array.isArray(d.bank)||!Array.isArray(d.baseStats)||!d.equipment||!Number.isFinite(d.xp))throw Error('Invalid save');return d;}
function load(){for(const p of [file,backup])try{return {data:read(p)}}catch(e){}return {data:null, damaged:fs.existsSync(file)||fs.existsSync(backup)};}
function write(data){try{if(!data||data.version!==1)throw Error('Invalid data');fs.mkdirSync(dir,{recursive:true});const tmp=file+'.tmp';fs.writeFileSync(tmp,JSON.stringify(data,null,2),{flush:true});try{read(file);fs.copyFileSync(file,backup)}catch(e){}fs.renameSync(tmp,file);return {ok:true}}catch(e){return {ok:false,error:e.message}}}
if(!app.requestSingleInstanceLock())app.quit();else app.whenReady().then(()=>{protocol.handle('slayer',serveGame);Menu.setApplicationMenu(null);const win=new BrowserWindow({title:'Slayer Hub — Alpha 1.9.24',width:1440,height:900,minWidth:960,minHeight:600,show:false,resizable:true,backgroundColor:'#101010',webPreferences:{preload:path.join(__dirname,'preload.js'),backgroundThrottling:false,contextIsolation:true,nodeIntegration:false,sandbox:true}});const splash=new BrowserWindow({width:1440,height:900,minWidth:960,minHeight:600,resizable:true,backgroundColor:'#0e0e0e',title:'Slayer Hub — Loading',webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true}});splash.loadFile(path.join(__dirname,'Splash.html'));const updates=setupUpdater(win);ipcMain.on('update-check',e=>{if(e.sender===win.webContents)updates.check(true)});ipcMain.on('update-restart',e=>{if(e.sender===win.webContents)updates.restart()});let shown=false;function reveal(){if(shown||win.isDestroyed())return;shown=true;if(!splash.isDestroyed()){win.setBounds(splash.getBounds());if(splash.isMaximized())win.maximize();splash.destroy();}win.show();}ipcMain.on('game-ready',e=>{if(e.sender===win.webContents){reveal();updates.check()}});splash.on('closed',()=>{if(!shown&&!win.isDestroyed())win.destroy()});win.webContents.on('did-fail-load',()=>reveal());setTimeout(reveal,90000);let closing=false,allow=false,timer;ipcMain.on('save-load',e=>{e.returnValue=e.sender===win.webContents?load():{data:null}});ipcMain.on('save-write',(e,d)=>{e.returnValue=e.sender===win.webContents?write(d):{ok:false}});function finish(saved=false){clearTimeout(timer);allow=true;if(saved)updates.installOnClose();win.close()}ipcMain.on('save-close-done',(e,saved)=>{if(e.sender===win.webContents&&closing)finish(saved===true)});win.on('close',e=>{if(allow)return;e.preventDefault();if(closing)return;closing=true;win.webContents.send('save-close');timer=setTimeout(()=>{closing=false;const choice=dialog.showMessageBoxSync(win,{type:'warning',message:'The game did not confirm saving. Close anyway?',buttons:['Keep open','Close anyway'],defaultId:0,cancelId:0});if(choice===1)finish()},5000)});win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',e=>e.preventDefault());win.webContents.on('before-input-event',(e,input)=>{if(input.type==='keyDown'&&input.key==='F11'){win.setFullScreen(!win.isFullScreen());e.preventDefault();}});win.loadURL('slayer://game/Slayer.html');});app.on('window-all-closed',()=>app.quit());
