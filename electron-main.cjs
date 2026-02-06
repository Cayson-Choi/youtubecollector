const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const axios = require('axios');

let mainWindow;
let apiServer = null;
let viteServer = null;
let tray = null;

// Create the browser window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 650,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'electron-preload.cjs')
    }
  });

  mainWindow.loadFile('electron-renderer.html');

  // Open DevTools in development
  mainWindow.webContents.openDevTools();

  // Disable cache for development
  mainWindow.webContents.session.clearCache();

  mainWindow.on('close', (event) => {
    if (apiServer || viteServer) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

// Create system tray icon
function createTray() {
  // Use a simple icon or create one
  tray = new Tray(path.join(__dirname, 'public/icon.png'));

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open', click: () => mainWindow.show() },
    { label: 'Quit', click: () => {
      stopServers();
      app.quit();
    }}
  ]);

  tray.setToolTip('AI Insight Collector');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    mainWindow.show();
  });
}

// Helper to start servers
async function startServers() {
  try {
    const isWindows = process.platform === 'win32';
    console.log('🚀 Auto-starting servers...');

    // Start API Server
    if (!apiServer) {
      apiServer = spawn('node', ['server.js'], {
        cwd: __dirname,
        shell: isWindows,
        windowsHide: true
      });

      apiServer.stdout.on('data', (data) => console.log(`API: ${data}`));
      apiServer.stderr.on('data', (data) => console.error(`API Error: ${data}`));
    }

    // Wait for API
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Start Vite Server
    if (!viteServer) {
        viteServer = spawn('npm', ['run', 'dev'], {
            cwd: __dirname,
            shell: true,
            windowsHide: true
        });
        
        viteServer.stdout.on('data', (data) => console.log(`Vite: ${data}`));
        viteServer.stderr.on('data', (data) => console.error(`Vite Error: ${data}`));
    }

    return { success: true };
  } catch (error) {
    console.error('Server start error:', error);
    return { success: false, error: error.message };
  }
}

app.whenReady().then(async () => {
  createWindow();
  
  // Auto-start servers on launch
  await startServers();
  
  // Optional: Reload window to ensure connection
  if (mainWindow) mainWindow.reload();
});

// Manual start handler (keep for backward compatibility)
ipcMain.handle('start-servers', async () => {
  return await startServers();
});

// Stop servers
ipcMain.handle('stop-servers', async () => {
  stopServers();
  return { success: true };
});

function stopServers() {
  if (apiServer) {
    apiServer.kill();
    apiServer = null;
  }
  if (viteServer) {
    viteServer.kill();
    viteServer = null;
  }
}

// Check server status
ipcMain.handle('check-status', async () => {
  try {
    await axios.get('http://localhost:3001/api/channels', { timeout: 1000 });
    return { running: true };
  } catch (error) {
    return { running: false };
  }
});

// Open browser
ipcMain.handle('open-browser', async () => {
  const { shell } = require('electron');
  await shell.openExternal('http://localhost:5173');
  return { success: true };
});

// Deploy
ipcMain.handle('deploy', async (event, days = 7) => {
  try {
    const response = await axios.post('http://localhost:3001/api/deploy', { days: parseInt(days) });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
});

// Fetch videos
ipcMain.handle('fetch-videos', async (event, days = 7) => {
  try {
    const response = await axios.post('http://localhost:3001/api/fetch', { days: parseInt(days) });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
});

// Get channels
ipcMain.handle('get-channels', async () => {
  try {
    const response = await axios.get('http://localhost:3001/api/channels');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
});

// Add channel
ipcMain.handle('add-channel', async (event, url) => {
  try {
    const response = await axios.post('http://localhost:3001/api/channels', { url });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
});

// Delete channel
ipcMain.handle('delete-channel', async (event, id) => {
  try {
    const response = await axios.delete(`http://localhost:3001/api/channels/${id}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
});
