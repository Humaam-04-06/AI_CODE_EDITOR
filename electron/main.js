const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { fork } = require('child_process');
const { checkUpdates } = require('./update');

// Recursively traverse directory to extract all valid text/code files
// Recursively traverse directory to extract all valid text/code files
async function readDirRecursive(dirPath, fileList = [], baseDir = dirPath) {
  try {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      // Ignore hidden files and standard project dependencies to avoid crashing/freezing
      if (entry.name.startsWith('.')) {
        if (entry.name !== '.gitignore' && entry.name !== '.env') {
          continue;
        }
      }
      
      if (entry.isDirectory()) {
        const ignoredDirs = [
          'node_modules', 'git', '.git', 'dist', 'build', '.next', '.nuxt',
          'target', 'out', 'venv', '.venv', 'env', '.env', 'obj', 'bin'
        ];
        if (ignoredDirs.includes(entry.name)) {
          continue;
        }
        await readDirRecursive(fullPath, fileList, baseDir);
      } else {
        try {
          const stats = await fs.promises.stat(fullPath);
          // Limit size to prevent hanging on large logs or data files
          if (stats.size > 2 * 1024 * 1024) {
            continue;
          }

          const ext = path.extname(entry.name).toLowerCase();
          // Block known binary and media formats
          const binaryExtensions = [
            '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.pdf', '.zip', '.tar', '.gz', 
            '.7z', '.rar', '.exe', '.dll', '.so', '.dylib', '.class', '.pyc', '.db', '.sqlite', 
            '.woff', '.woff2', '.ttf', '.eot', '.mp3', '.mp4', '.wav', '.avi', '.mov', '.dmg',
            '.iso', '.bin', '.dat', '.pkg', '.jar', '.war', '.pdb'
          ];
          
          if (binaryExtensions.includes(ext)) {
            continue;
          }

          const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
          const content = await fs.promises.readFile(fullPath, 'utf-8');
          
          const langMap = {
            js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
            py: 'python', css: 'css', html: 'html', json: 'json', md: 'markdown',
            txt: 'plaintext', yaml: 'yaml', yml: 'yaml', ini: 'ini', env: 'plaintext',
            sh: 'shell', bat: 'bat', rs: 'rust', go: 'go', c: 'c', cpp: 'cpp', h: 'c',
            java: 'java', cs: 'csharp', php: 'php', rb: 'ruby', pl: 'perl', sql: 'sql',
            xml: 'xml', svg: 'xml', gitignore: 'plaintext', dockerignore: 'plaintext',
            dockerfile: 'dockerfile', makefile: 'makefile'
          };
          const extName = ext.startsWith('.') ? ext.substring(1) : ext;
          const language = langMap[extName] || 'plaintext';
          
          fileList.push({
            id: 'local_' + Math.random().toString(36).substring(2, 9),
            name: relativePath,
            absolutePath: fullPath,
            language,
            content
          });
        } catch (fileErr) {
          console.warn(`[Electron Directory Reader] Skip file: ${fullPath}`, fileErr);
        }
      }
    }
  } catch (err) {
    console.error(`[Electron Directory Reader] Directory scan error: ${dirPath}`, err);
  }
  return fileList;
}

// IPC handler to open folder picker and read contents natively
ipcMain.handle('dialog:openDirectory', async (event) => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Open Workspace Folder',
    properties: ['openDirectory', 'createDirectory']
  });
  
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  
  const dirPath = result.filePaths[0];
  const files = await readDirRecursive(dirPath);
  
  return {
    folderName: path.basename(dirPath),
    files
  };
});

// IPC handler to save file contents natively
ipcMain.handle('file:save', async (event, absolutePath, content) => {
  try {
    await fs.promises.writeFile(absolutePath, content, 'utf-8');
    return { success: true };
  } catch (err) {
    console.error(`[Electron File Writer] Failed to write file: ${absolutePath}`, err);
    return { success: false, error: err.message };
  }
});


let mainWindow;
let serverProcess = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function startExpressServer() {
  if (!isDev) {
    try {
      // In production mode, spawn the Express backend as a background fork process
      const serverPath = path.join(__dirname, '../server/index.js');
      serverProcess = fork(serverPath, [], {
        env: { ...process.env, PORT: 5000, NODE_ENV: 'production' }
      });

      serverProcess.on('error', (err) => {
        console.error('Failed to spawn Express Backend Subprocess:', err);
      });

      console.log('[Electron Main] Launched Express backend child process.');
    } catch (e) {
      console.error('[Electron Main] Error spawning Express child process:', e);
    }
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'default', // Standard OS window borders for robust cross-platform compat
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Load appropriate client URL depending on environment
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    // Open Developer Tools automatically in dev mode
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../client/dist/index.html'));
  }

  // Check for auto-updates via GitHub Releases
  checkUpdates();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Spawns backend and builds BrowserWindow on load
app.whenReady().then(() => {
  Menu.setApplicationMenu(null); // Clear native application menu bar to let premium custom UI shine!
  startExpressServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Enforce graceful quit procedures
app.on('window-all-closed', () => {
  // Kill the backend Express process when Electron closes
  if (serverProcess) {
    serverProcess.kill();
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
