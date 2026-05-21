const { contextBridge, ipcRenderer } = require('electron');

// Secure context isolation bridge mapping OS properties to React client sandbox
contextBridge.exposeInMainWorld('desktopAPI', {
  platform: process.platform,
  isDesktop: true,
  environment: process.env.NODE_ENV || 'production',
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  saveFile: (absolutePath, content) => ipcRenderer.invoke('file:save', absolutePath, content)
});
