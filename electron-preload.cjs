const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  startServers: () => ipcRenderer.invoke('start-servers'),
  stopServers: () => ipcRenderer.invoke('stop-servers'),
  checkStatus: () => ipcRenderer.invoke('check-status'),
  openBrowser: () => ipcRenderer.invoke('open-browser'),
  deploy: () => ipcRenderer.invoke('deploy'),
  fetchVideos: () => ipcRenderer.invoke('fetch-videos'),
  getChannels: () => ipcRenderer.invoke('get-channels'),
  addChannel: (url) => ipcRenderer.invoke('add-channel', url),
  deleteChannel: (id) => ipcRenderer.invoke('delete-channel', id)
});
