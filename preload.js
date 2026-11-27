const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('slayerSave',{ready:()=>ipcRenderer.send("game-ready"),load:()=>ipcRenderer.sendSync('save-load'),write:data=>ipcRenderer.sendSync('save-write',data),onClose:fn=>ipcRenderer.on('save-close',()=>{let saved=false;try{saved=fn()===true}finally{ipcRenderer.send('save-close-done',saved)}})});

contextBridge.exposeInMainWorld('slayerUpdates',{check:()=>ipcRenderer.send('update-check'),onStatus:fn=>ipcRenderer.on('update-status',(_e,status)=>fn(status))});
