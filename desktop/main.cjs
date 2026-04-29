const { app, BrowserWindow, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

if (!app.isPackaged) {
  app.setPath('userData', path.join(__dirname, '..', '.electron-user-data'));
}

function getRendererUrl() {
  if (process.env.ELECTRON_RENDERER_URL) {
    return process.env.ELECTRON_RENDERER_URL;
  }

  const distIndexPath = path.join(__dirname, '..', 'frontend', 'dist', 'index.html');
  const lifecycleEvent = process.env.npm_lifecycle_event;
  if (!app.isPackaged && lifecycleEvent === 'dev') {
    return 'http://localhost:5173';
  }

  if (fs.existsSync(distIndexPath)) {
    return pathToFileURL(distIndexPath).toString();
  }

  return 'http://localhost:5173';
}

function createMainWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  win.once('ready-to-show', () => win.show());

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  win.loadURL(getRendererUrl());
}

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
