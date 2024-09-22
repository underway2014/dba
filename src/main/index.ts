import { app, shell, BrowserWindow, ipcMain, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { addConnection, delConnection, editConnection, getConnections } from '../server/lib/wrjson'
import updater from './updater'

import {
  addRow,
  alterTable,
  backup,
  closeConnection,
  createDb,
  delRows,
  getSchema,
  getTableData,
  getTables,
  query,
  restore,
  updateDate
} from '../server/db'
// import { menuTemplate } from './menuTemplate'
// require('@electron/remote/main').initialize()
// remoteMain.initialize()

function createWindow(): void {
  const { width, height } = screen.getPrimaryDisplay().bounds
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width,
    height,
    show: false,
    autoHideMenuBar: true,
    darkTheme: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
    // fullscreen: true,
    // maximizable
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('close', async () => {
    await closeConnection()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  mainWindow.webContents.openDevTools()

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  updater(mainWindow)
  // initMenu()
}

// function initMenu() {
//   const menu = Menu.buildFromTemplate(menuTemplate)
//     Menu.setApplicationMenu(menu)
// }

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // server()
  // Set app user model id for windows
  electronApp.setAppUserModelId('electron.viki.com')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => {
    console.log('pong')
  })

  ipcMain.handle('store:get', (_, val) => {
    console.log('store:get', val)

    const data = getConnections()
    console.log('connection data: ', data)

    return data
  })
  ipcMain.handle('store:add', (_, val) => {
    // console.log('store:set', event)
    console.log('store:add val', val)

    // return {name: 1, age: 3333}

    addConnection(val)
  })
  ipcMain.handle('store:edit', (_, val) => {
    // console.log('store:set', event)
    console.log('store:edit val', val)

    // return {name: 1, age: 3333}

    editConnection(val)
  })
  ipcMain.handle('store:del', (_, val) => {
    // console.log('store:set', event)
    console.log('store:del val', val)

    // return {name: 1, age: 3333}

    return delConnection(val)
  })
  ipcMain.handle('db:backup', async (_, val) => {
    return backup(val)
  })
  ipcMain.handle('db:restore', (_, val) => {
    return restore(val)
  })
  ipcMain.handle('db:create', (_, val) => {
    return createDb(val)
  })
  ipcMain.handle('getSchema', (_, val) => {
    return getSchema(val)
  })
  ipcMain.handle('getTables', (_, val) => {
    return getTables(val)
  })
  ipcMain.handle('querySql', (_, val) => {
    return query(val)
  })
  ipcMain.handle('updateDate', (_, val) => {
    return updateDate(val)
  })
  ipcMain.handle('getTableData', (_, val) => {
    return getTableData(val)
  })
  ipcMain.handle('alterTable', (_, val) => {
    return alterTable(val)
  })
  ipcMain.handle('addRow', (_, val) => {
    return addRow(val)
  })
  ipcMain.handle('delRows', (_, val) => {
    return delRows(val)
  })
  ipcMain.handle('connection:close', (_) => {
    return closeConnection()
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', async () => {
  // e.preventDefault()
  console.log('window-all-closed ', process.platform)
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// app.on('before-quit', e => {
//   console.log('before-quit: ', e)
// })

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
