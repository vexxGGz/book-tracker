const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const { loadData, saveData } = require('./storage.cjs');
const { autoUpdater } = require('electron-updater');

let mainWindow;

// Configure auto-updater
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

// Logging for debugging
autoUpdater.logger = require('electron').app.isPackaged ? null : console;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    frame: false, // Custom titlebar
    transparent: true, // For glassmorphism
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '../build/icon.png'),
  });

  // In development, load from Vite dev server
  // In production, load from built files
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5174');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Remove default menu
  Menu.setApplicationMenu(createMenu());

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Export Data',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            mainWindow.webContents.send('export-data');
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            mainWindow.webContents.send('show-about');
          }
        }
      ]
    }
  ];

  return Menu.buildFromTemplate(template);
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  
  // Check for updates after window is ready (only in production)
  if (app.isPackaged) {
    // Delay update check slightly to let the app fully load
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch(err => {
        console.log('Update check failed:', err.message);
      });
    }, 3000);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Auto-updater event handlers
autoUpdater.on('checking-for-update', () => {
  sendUpdateStatus('checking', 'Checking for updates...');
});

autoUpdater.on('update-available', (info) => {
  sendUpdateStatus('available', `Update v${info.version} available`, info);
});

autoUpdater.on('update-not-available', (info) => {
  sendUpdateStatus('not-available', 'App is up to date', info);
});

autoUpdater.on('download-progress', (progress) => {
  sendUpdateStatus('downloading', `Downloading: ${Math.round(progress.percent)}%`, progress);
});

autoUpdater.on('update-downloaded', (info) => {
  sendUpdateStatus('ready', `Update v${info.version} ready to install`, info);
  // Show dialog to user asking if they want to restart
  if (mainWindow) {
    mainWindow.webContents.send('update-ready', info);
  }
});

autoUpdater.on('error', (err) => {
  sendUpdateStatus('error', `Update error: ${err.message}`, err);
});

function sendUpdateStatus(status, message, data = null) {
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { status, message, data });
  }
}

// Window controls IPC handlers
ipcMain.on('minimize-window', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('close-window', () => {
  if (mainWindow) mainWindow.close();
});

// Storage IPC handlers
ipcMain.handle('load-data', async (event, key) => {
  return await loadData(key);
});

ipcMain.handle('save-data', async (event, key, value) => {
  return await saveData(key, value);
});

// Platform info
ipcMain.handle('get-platform', () => {
  return process.platform;
});

// Auto-update IPC handlers
ipcMain.handle('check-for-updates', async () => {
  if (!app.isPackaged) {
    return { status: 'dev', message: 'Updates disabled in development' };
  }
  try {
    const result = await autoUpdater.checkForUpdates();
    return { status: 'checking', updateInfo: result?.updateInfo };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
});

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall(false, true);
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

