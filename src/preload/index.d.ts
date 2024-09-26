import { ElectronAPI } from '@electron-toolkit/preload'

interface ApiFunction {
  addStore: Function
  editStore: Function
  delStore: Function
  getStore: Function
  getTables: Function
  getSchema: Function
  querySql: Function
  getTableData: Function
  updateDate: Function
  dbCreate: Function
  dbBackup: Function
  dbRestore: Function
  alterTable: Function
  editConnection: Function
  addRow: Function
  delRows: Function
  closeConnections: Function
  getIndexs: Function
  editIndex: Function
  getColums: Function
  editTable: Function
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: ApiFunction
  }
}
