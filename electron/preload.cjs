const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),

  // Data storage
  loadData: (key) => ipcRenderer.invoke('load-data', key),
  saveData: (key, value) => ipcRenderer.invoke('save-data', key, value),

  // Dashboard order
  loadDashboardOrder: () => ipcRenderer.invoke('load-data', 'dashboardOrder'),
  saveDashboardOrder: (order) => ipcRenderer.invoke('save-data', 'dashboardOrder', order),

  // Platform info
  getPlatform: () => ipcRenderer.invoke('get-platform'),

  // Auto-update
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  onUpdateStatus: (callback) => {
    ipcRenderer.on('update-status', (event, data) => callback(data));
  },
  onUpdateReady: (callback) => {
    ipcRenderer.on('update-ready', (event, info) => callback(info));
  },
  removeUpdateListeners: () => {
    ipcRenderer.removeAllListeners('update-status');
    ipcRenderer.removeAllListeners('update-ready');
  },

  // Check if running in Electron
  isElectron: true
});

