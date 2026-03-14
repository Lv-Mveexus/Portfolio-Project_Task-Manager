const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const waitOn = require('wait-on');

const isDev = !app.isPackaged;
const SERVER_PORT = 5000;

let mainWindow = null;
let serverProcess = null;

// ── Spawn the Express server ──────────────────────────────────────────────────
function startServer() {
  const serverPath = isDev
    ? path.join(__dirname, '../server')
    : path.join(process.resourcesPath, 'server');

  const serverEntry = path.join(serverPath, 'index.js');

  // SQLite database lives in the OS user-data folder — writable on all platforms.
  // app.getPath('userData') resolves to:
  //   Windows : %APPDATA%\TaskFlow
  //   macOS   : ~/Library/Application Support/TaskFlow
  //   Linux   : ~/.config/TaskFlow
  const dbPath = path.join(app.getPath('userData'), 'taskflow.db');

  serverProcess = spawn('node', [serverEntry], {
    cwd: serverPath,
    env: {
      ...process.env,
      NODE_ENV:  isDev ? 'development' : 'production',
      DB_PATH:   dbPath,
      PORT:      String(SERVER_PORT),
    },
    stdio: isDev ? 'inherit' : 'ignore',
  });

  serverProcess.on('error', (err) => {
    console.error('Server process error:', err);
  });
}

// ── Create the main window ────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width:           1100,
    height:          720,
    minWidth:        800,
    minHeight:       560,
    titleBarStyle:   process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#0F0F11',
    show:            false,
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
    },
  });

  // Open external links in the system browser, not inside Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' });
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  startServer();

  // Wait for the Express server to be ready before loading the UI
  try {
    await waitOn({
      resources: [`http://localhost:${SERVER_PORT}/api/health`],
      timeout:   15000,
      interval:  300,
    });
  } catch {
    console.warn('Server did not respond in time — loading UI anyway.');
  }

  createWindow();

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../client/dist/index.html'));
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) { serverProcess.kill(); serverProcess = null; }
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (serverProcess) { serverProcess.kill(); serverProcess = null; }
});

// ── IPC ───────────────────────────────────────────────────────────────────────
ipcMain.handle('get-version', () => app.getVersion());
