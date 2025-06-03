const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  startScan: (folderPath) => ipcRenderer.invoke('scan:start', folderPath),
  onScanProgress: (callback) => ipcRenderer.on('scan:progress', (event, progress) => callback(progress))
});