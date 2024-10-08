import React, { useContext, useRef, useState } from 'react'
import { Dropdown, Modal, Space, Tree } from 'antd'
import type { GetProps, MenuProps, TreeDataNode } from 'antd'
import { EditOutlined, DeleteOutlined, ExclamationCircleFilled } from '@ant-design/icons'
import CreateDbForm from './CreateDbFrom'
import ConnectionForm from './ConnectionForm'
import CustomContext from '@renderer/utils/context'
import { LogAction, LogType, SliderRightMenu, TableMenu } from '@renderer/utils/constant'
import { addLog } from '@renderer/utils/logHelper'
import { IConnection, IGetTabData } from '@renderer/interface'
const { confirm } = Modal

type DirectoryTreeProps = GetProps<typeof Tree.DirectoryTree>

type CustomProps = {
  connection: IConnection
  key: string
  cid: number
  updateSlider: () => void
  getTableDataByName: (a: IGetTabData) => void
  setDbInfo: (a: string[]) => void
}

interface NodeData extends TreeDataNode {
  children?: NodeData[]
}

let rightClickItemKey: string = ''
let backupDbName = ''
let restoreType = 2 // 1-struct 2-struct and data

const ConnectionItem: React.FC<CustomProps> = (props) => {
  const { logList, setLogList } = useContext(CustomContext)
  const selectSqlFile = useRef<HTMLInputElement | null>(null)

  const [showCreateFrom, setShowCreateFrom] = useState(false)
  const [showEditConnectionForm, setShowEditConnectionForm] = useState(false)
  const SP = '@'

  const [treeData, setTreeData] = useState<NodeData[]>([
    {
      title: props.connection.name,
      key: `connection${SP}${props.connection.name}${SP}${props.connection.id}`
    }
  ])

  const handleOk = () => {
    setShowCreateFrom(false)
  }
  const handleCancel = () => {
    setShowCreateFrom(false)
  }
  const editHandleOk = () => {
    setShowEditConnectionForm(false)
  }
  const editHandleCancel = () => {
    setShowEditConnectionForm(false)
  }

  function addDbError({ error }) {
    addLog({
      logList,
      setLogList,
      text: error?.message,
      action: LogAction.DBCONNECTION,
      type: LogType.ERROR
    })
  }

  const onSelect: DirectoryTreeProps['onSelect'] = (keys) => {
    const treeNow = treeData[0]

    const key = String(keys[0])

    const parseKeys = key.split(SP)

    const nodeType = parseKeys[0]

    if (nodeType === 'connection') {
      window.api
        .getSchema(props.connection)
        .then((tables) => {
          treeNow.children = [
            {
              isLeaf: false,
              key: `schemas${SP}${props.connection.id}`,
              title: 'schemas',
              children: tables.map((el) => {
                return {
                  isLeaf: true,
                  key: `schema${SP}${el.name}${SP}${props.connection.name}${SP}${props.connection.id}`,
                  title: el.name
                }
              })
            }
          ]

          props.setDbInfo([props.connection.name, props.connection.config.database])

          setTreeData([treeNow])
        })
        .catch((error) => {
          addDbError({ error })
        })
    } else if (nodeType === 'schema') {
      window.api
        .getTables({ ...props.connection, schema: parseKeys[1] })
        .then((res) => {
          const schemas = treeNow.children

          if (!schemas?.length) {
            return false
          }
          const schema = schemas[0].children?.find((el) => el.key === key)

          if (schema) {
            schema.isLeaf = false
            schema.children = res.map((el) => {
              return {
                isLeaf: true,
                key: `table${SP}${el.table_name}${SP}${parseKeys[1]}${SP}${parseKeys[2]}${SP}${props.connection.id}`,
                title: el.table_name
              }
            })
          }

          props.setDbInfo([props.connection.name, props.connection.config.database, parseKeys[1]])
          setTreeData([treeNow])
        })
        .catch((error) => {
          addDbError({ error })
        })
    } else if (nodeType === 'table') {
      const sql = `
      select * from ${parseKeys[1]}
      `
      props.getTableDataByName({
        id: props.connection.id,
        tableName: parseKeys[1],
        type: 1,
        schema: parseKeys[2],
        dbName: parseKeys[3],
        sql
      })

      props.setDbInfo([props.connection.name, props.connection.config.database, parseKeys[2]])
    }
  }

  function editConnection(node) {
    const parseKeys = node.key.split(SP)
    const nodeType = parseKeys[0]

    if (nodeType === 'connection') {
      setShowEditConnectionForm(true)
    } else if (nodeType === 'table') {
      props.getTableDataByName({
        id: props.connection.id,
        tableName: parseKeys[1],
        type: 2,
        schema: parseKeys[2],
        dbName: parseKeys[3]
      })
    }
  }

  function delConnection(node) {
    confirm({
      title: `Do you want to delete the ${node.title} connection?`,
      icon: <ExclamationCircleFilled />,
      content: '',
      onOk() {
        window.api.delStore(node.key).then(() => {
          props.updateSlider()
        })
      }
    })
  }

  const tableMenuItems: MenuProps['items'] = [
    {
      label: 'Edit indexs',
      key: 10
    },
    {
      type: 'divider'
    },
    {
      label: 'Drop',
      key: 20
    },
    {
      label: 'Truncat table',
      key: 21
    }
  ]

  const items: MenuProps['items'] = [
    {
      label: 'Create Database',
      key: SliderRightMenu.CREATEDB
    },
    {
      type: 'divider'
    },
    {
      label: 'Disconnect',
      key: SliderRightMenu.DISCONNECT
    },
    {
      type: 'divider'
    },
    {
      label: 'Backup',
      key: SliderRightMenu.BACKUP
    },
    {
      type: 'divider'
    },
    {
      label: 'Restore struct',
      key: SliderRightMenu.RESTORESTRUCE
    },
    {
      label: 'Restore struct and data',
      key: SliderRightMenu.RESTOREDATA
    }
  ]

  //export PGPASSWORD='postgres' && pg_dump -U postgres -h 127.0.0.1 -p 5432 -Fc jogo_gaming_dev > /Users/apple/Documents/dbBackup/testdata.sql

  //export PGPASSWORD='postgres' && pg_restore -U postgres -h 127.0.0.1 -p 5432 --dbname=t2  /Users/apple/Documents/dbBackup/testdata1.sql
  //下面只恢复表结构
  //export PGPASSWORD='postgres' && pg_restore -U postgres -h 127.0.0.1 -p 5432 -s --dbname=t2  /Users/apple/Documents/dbBackup/testdata1.sql

  function tableRightMenuHandler(e, nodeData) {
    console.log('tableRightMenuHandler: ', e, nodeData)
    //nodeData.key = "table@affiliate_stats@public@m1-local@1727260565573"
    e.domEvent.stopPropagation()

    const keys = nodeData.key.split(SP)
    console.log('keys: ', keys)

    if (+e.key === TableMenu.EDITINDEX) {
      props.getTableDataByName({
        id: keys[4],
        tableName: keys[1],
        type: 3,
        schema: keys[2]
      })
    } else if ([TableMenu.TRUNCATE, TableMenu.DROPTABLE].includes(+e.key)) {
      confirm({
        title: `Do you want to ${+e.key === TableMenu.TRUNCATE ? 'truncate' : 'drop'} ${keys[1]}?`,
        icon: <ExclamationCircleFilled />,
        content: '',
        onOk() {
          let type = 1
          if (+e.key === TableMenu.TRUNCATE) {
            type = 2
          }

          window.api
            .editTable({ id: keys[4], schema: keys[2], tableName: keys[1], type })
            .then((res) => {
              console.log('getindexs drop res: ', res)
              addLog({
                logList,
                setLogList,
                text: `${+e.key === TableMenu.TRUNCATE ? 'truncate' : 'drop'} ${keys[1]} success`,
                type: LogType.SUCCESS,
                action: LogAction.EDITTABLE
              })
            })
            .catch((error) => {
              addLog({
                logList,
                setLogList,
                text: error.message,
                type: LogType.ERROR,
                action: LogAction.EDITTABLE
              })
            })
        },
        onCancel() {
          console.log('do nothing')
        }
      })
    }
  }
  function rightMenuHandler(e) {
    e.domEvent.stopPropagation()

    if (!rightClickItemKey) {
      return
    }
    const keyArr = rightClickItemKey.split(SP)

    console.log('keyArr: ', keyArr)

    if (+e.key === SliderRightMenu.CREATEDB) {
      setShowCreateFrom(true)
    } else if (+e.key === SliderRightMenu.BACKUP) {
      window.api
        .dbBackup({ type: 1, name: keyArr[1], config: props.connection })
        .then((res) => {
          if (res.code === 0) {
            addLog({
              logList,
              setLogList,
              text: `database: ${res.dbName} backup success, filePath: ${res.path}`,
              action: LogAction.DBBACKUP,
              type: LogType.SUCCESS
            })
          } else {
            addLog({
              logList,
              setLogList,
              text: `database: ${res.dbName} backup fail`,
              action: LogAction.DBBACKUP,
              type: LogType.ERROR
            })
          }
        })
        .catch((error) => {
          addLog({
            logList,
            setLogList,
            text: `database: ${props.connection.config.database} backup fail, ${error?.message}`,
            action: LogAction.DBBACKUP,
            type: LogType.ERROR
          })
        })
    } else if (+e.key === SliderRightMenu.RESTORESTRUCE) {
      backupDbName = keyArr[1]
      restoreType = 1
      selectSqlFile.current?.click()
    } else if (+e.key === SliderRightMenu.RESTOREDATA) {
      restoreType = 2
      backupDbName = keyArr[1]
      selectSqlFile.current?.click()
    } else if (+e.key === SliderRightMenu.DISCONNECT) {
      window.api.closeConnections({ id: keyArr[2] }).then((res) => {
        console.log('disconnect res: ', res)
        setTreeData([
          {
            title: props.connection.name,
            key: `connection${SP}${props.connection.name}${SP}${props.connection.id}`
            // children: []
          }
        ])
      })
    }
  }

  function selectFile(e) {
    window.api
      .dbRestore({
        type: restoreType,
        dbName: backupDbName,
        connection: props.connection,
        sqlPath: e.target.files[0]?.path
      })
      .then((res) => {
        addLog({
          logList,
          setLogList,
          text: `database: ${res.dbName} restore success, filePath: ${res.path}`,
          action: LogAction.DBRESTORE,
          type: LogType.SUCCESS
        })
      })
      .catch((error) => {
        addLog({
          logList,
          setLogList,
          text: `database: ${backupDbName} restore fail, ${error?.message}`,
          action: LogAction.DBRESTORE,
          type: LogType.ERROR
        })
      })
  }

  // node connection-jogo_gaming_dev-1720530577574
  function treeRightHandler({ event, node }) {
    event.stopPropagation()

    rightClickItemKey = node.key
  }

  function titleRender(nodeData) {
    let editButtons
    if (!/^schema/.test(nodeData.key)) {
      let delButton

      if (!/^table/.test(nodeData.key)) {
        delButton = (
          <DeleteOutlined
            className="marginlr20"
            onClick={(e) => {
              e.stopPropagation()
              delConnection(nodeData)
            }}
          />
        )
      }

      editButtons = (
        <Space className="treeBtn">
          {delButton}
          <EditOutlined
            onClick={(e) => {
              e.stopPropagation()

              editConnection(nodeData)
            }}
          />
        </Space>
      )
    }

    let item = (
      <div className="treeTitle">
        <span>{nodeData.title}</span>
        {editButtons}
      </div>
    )
    if (/connection/.test(nodeData.key)) {
      item = (
        <Dropdown menu={{ items, onClick: rightMenuHandler }} trigger={['contextMenu']}>
          {item}
        </Dropdown>
      )
    }

    if (/table/.test(nodeData.key)) {
      item = (
        <Dropdown
          menu={{ items: tableMenuItems, onClick: (e) => tableRightMenuHandler(e, nodeData) }}
          trigger={['contextMenu']}
        >
          {item}
        </Dropdown>
      )
    }
    return (
      <div>
        <input ref={selectSqlFile} type="file" style={{ display: 'none' }} onChange={selectFile} />
        {item}
      </div>
    )
  }

  async function editConnectionSumit(val) {
    window.api
      .editStore({
        name: val.name,
        id: props.connection.id,
        config: {
          host: val.host,
          port: val.port,
          username: val.username,
          password: val.password,
          dialect: val.dialect,
          database: val.database
        }
      })
      .then(() => {
        props.updateSlider()
        setShowEditConnectionForm(false)
      })
  }

  async function addOk(val) {
    setShowCreateFrom(false)

    window.api
      .dbCreate({ dbName: val.name, connection: props.connection })
      .then((res) => {
        if (res.code === 0) {
          addLog({
            logList,
            setLogList,
            text: `database: ${res.dbName} create success`,
            action: LogAction.DBCREATE,
            type: LogType.SUCCESS
          })
        }
      })
      .catch((error) => {
        addLog({
          logList,
          setLogList,
          text: `database: ${val.name} create fail, ${error?.message}`,
          action: LogAction.DBCREATE,
          type: LogType.ERROR
        })
      })
  }

  return (
    <div>
      <Tree
        showLine
        blockNode
        virtual={false}
        motion={false}
        // expandAction='doubleClick'
        // switcherIcon={<DownOutlined />}
        defaultExpandedKeys={['0-0-0']}
        onRightClick={treeRightHandler}
        onSelect={onSelect}
        treeData={treeData}
        titleRender={titleRender}
        rootStyle={{ borderRadius: 0 }}
      />
      <Modal
        title="Create database"
        open={showCreateFrom}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={[]}
      >
        <CreateDbForm createDatabase={addOk}></CreateDbForm>
      </Modal>

      <Modal
        title="Edit connection"
        open={showEditConnectionForm}
        onOk={editHandleOk}
        onCancel={editHandleCancel}
        footer={[]}
      >
        <ConnectionForm
          defautValues={{
            name: props.connection.name,
            ...props.connection.config,
            id: props.connection.id
          }}
          addConnection={editConnectionSumit}
        ></ConnectionForm>
      </Modal>
    </div>
  )
}

export default ConnectionItem
