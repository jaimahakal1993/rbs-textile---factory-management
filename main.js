
const { app, BrowserWindow, screen, Menu } = require('electron');
const path = require('path');

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  const mainWindow = new BrowserWindow({
    width: width,
    height: height,
    minWidth: 1100,
    minHeight: 800,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: false // Production mode: Disable dev tools
    },
    title: "RBS Textile - Enterprise Factory ERP",
    autoHideMenuBar: true,
    backgroundColor: '#eaeff5',
    show: false // Don't show until ready to prevent white flicker
  });

  mainWindow.loadFile('index.html');
  
  // Custom context menu (disable right-click "Inspect")
  Menu.setApplicationMenu(null);

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
