const { autoUpdater } = require('electron-updater');
const { dialog } = require('electron');

function checkUpdates() {
  // Silence auto-updater in local development configurations
  if (process.env.NODE_ENV === 'development') return;

  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on('update-available', () => {
    dialog.showMessageBox({
      type: 'info',
      title: 'AI Code Editor Update Available',
      message: 'A premium new release of the AI Code Editor is available on GitHub. Fetching package in the background...',
      buttons: ['OK']
    });
  });

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
      type: 'question',
      title: 'AI Code Editor Update Ready',
      message: 'A premium workspace update has finished downloading. Click restart to apply changes immediately.',
      buttons: ['Restart Now', 'Later']
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });
}

module.exports = { checkUpdates };
