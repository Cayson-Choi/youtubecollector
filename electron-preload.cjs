const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  startServers: () => ipcRenderer.invoke('start-servers'),
  stopServers: () => ipcRenderer.invoke('stop-servers'),
  checkStatus: () => ipcRenderer.invoke('check-status'),
  openBrowser: () => ipcRenderer.invoke('open-browser'),
  deploy: (days) => ipcRenderer.invoke('deploy', days),
  fetchVideos: (days) => ipcRenderer.invoke('fetch-videos', days),
  getChannels: () => ipcRenderer.invoke('get-channels'),
  addChannel: (url) => ipcRenderer.invoke('add-channel', url),
  deleteChannel: (id) => ipcRenderer.invoke('delete-channel', id)
});
