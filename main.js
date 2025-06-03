const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 820,
    height: 700,
    icon: path.join(__dirname, 'build', 'icon.ico'), // ✅ Icon for the app window
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: 'RooxScanner',
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('dialog:openFolder', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory', 'dontAddToRecent', 'showHiddenFiles']
  });
  if (canceled) return null;
  return filePaths[0];
});

async function scanFilesRecursive(dir, onProgress) {
  const files = [];
  let scannedCount = 0;

  async function walk(folder) {
    try {
      const entries = await fs.readdir(folder, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(folder, entry.name);
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile()) {
          try {
            const stats = await fs.stat(fullPath);
            files.push({ path: fullPath, size: stats.size });
          } catch {}
        }
        scannedCount++;
        if (scannedCount % 100 === 0) {
          onProgress?.(scannedCount);
        }
      }
    } catch {}
  }

  await walk(dir);
  return files;
}

ipcMain.handle('scan:start', async (event, folderPath) => {
  let lastProgress = 0;

  const files = await scanFilesRecursive(folderPath, (count) => {
    const progress = Math.min(90, 10 + count / 1000);
    if (progress - lastProgress > 0.5) {
      mainWindow.webContents.send('scan:progress', progress);
      lastProgress = progress;
    }
  });

  mainWindow.webContents.send('scan:progress', 100);

  files.sort((a, b) => b.size - a.size);
  const largestFiles = files.slice(0, 10);

  files.sort((a, b) => a.size - b.size);
  const smallestFiles = files.slice(0, 10);

  return { largestFiles, smallestFiles };
});