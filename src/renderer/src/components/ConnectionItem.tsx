import React, { useRef, useState } from 'react';
import { Button, Dropdown, Menu, Modal, Space, Tree, message } from 'antd';
import type { GetProps, MenuProps, TreeDataNode, UploadProps } from 'antd';
import { title } from 'process';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Schema } from 'electron-store';
import CreateDbForm from './CreateDbFrom';

type DirectoryTreeProps = GetProps<typeof Tree.DirectoryTree>;

const { DirectoryTree } = Tree;

const test: TreeDataNode[] = [
  {
    title: 'test 0',
    key: '0-1',
    children: [
      { title: 'leaf 0-0', key: '0-0-0', isLeaf: true },
      { title: 'leaf 0-1', key: '0-0-1', isLeaf: true },
    ],
  }
];

type pgConfig = {
  name: string
  config: any
  id: string
}

type selfProps = {
  connection: pgConfig
  key: number
  cid: number
  updateSlider: Function
  getTableDataByName: Function
}

interface NodeData extends TreeDataNode {
  children?: NodeData[]
}

let rightClickItemKey: string = ''
let backupDbName = null
let restoreType = 2 // 1-struct 2-struct and data

const ConnectionItem: React.FC<selfProps> = (props) => {
  const [messageApi, contextHolder] = message.useMessage();

  const selectSqlFile = useRef()

  const [showCreateFrom, setShowCreateFrom] = useState(false)
  const SP = '@'

  const [treeData, setTreeData] = useState<NodeData[]>([{
    title: props.connection.name,
    key: `connection${SP}${props.connection.name}${SP}${props.connection.id}`,
  }])

  const handleOk = () => {
    setShowCreateFrom(false)
  };
  const handleCancel = () => {
    setShowCreateFrom(false)
  };


  const onSelect: DirectoryTreeProps['onSelect'] = (keys, info) => {
    console.log('Trigger Select', keys, info, props.connection);
    console.log('treeData Select', treeData);

    let treeNow = treeData[0]

    let key = String(keys[0])

    let parseKeys = key.split(SP)

    let nodeType = parseKeys[0]
    console.log('node type: ', parseKeys)
    if (nodeType === 'connection') {
      window.api.getSchema(props.connection).then(tables => {
        treeNow.children = [{
          isLeaf: false,
          key: `schemas${SP}${props.connection.id}`,
          title: 'schemas',
          children: tables.map((el, index) => {
            return {
              isLeaf: true,
              key: `schema${SP}${el.name}${SP}${props.connection.name}${SP}${new Date().getTime()}`,
              title: el.name
            }
          })
        }]

        setTreeData([treeNow])

      })
    } else if (nodeType === 'schema') {
      window.api.getTables({ ...props.connection, schema: parseKeys[1] }).then(tables => {

        console.log('api getSchema tables ', tables)

        let schemas = treeNow.children

        console.log('schemas length ', schemas?.length, schemas)
        if (!schemas?.length) {
          return false
        }
        let schema = schemas[0].children?.find(el => el.key === key)
        console.log('now schema key: ', key)
        if (schema) {
          console.log('right shcema: ', schema)
          schema.isLeaf = false
          schema.children = tables.map((el, index) => {
            return {
              isLeaf: true,
              key: `table${SP}${el.table_name}${SP}${parseKeys[1]}${SP}${parseKeys[2]}${SP}${new Date().getTime()}`,
              title: el.table_name
            }
          })
        } else {
          console.log('not find schema')
        }
        setTreeData([treeNow])
      })

    } else if (nodeType === 'table') {

      const sql = `
      select * from ${parseKeys[1]}
      `

      console.log('table sql: ', sql)
      props.getTableDataByName({ tableName: parseKeys[1], type: 1, schema: parseKeys[2], dbName: parseKeys[3], sql })
      // window.api.getTableData(sql).then(data => {

      //   console.log('query sql res: ', data)
      // })

    }



  };

  const onExpand: DirectoryTreeProps['onExpand'] = (keys, info) => {
    console.log('Trigger Expand', keys, info);
    // fetch('http://localhost:3000/list')
    //   .then(response => response.json())
    //   .then(json => {
    //     console.log('fetch res: ', json.data)
    //     // setData({rows: json.data})
    //   })
  };

  function editConnection (node) {
    console.log('editConnection: ', node, node.key)
    // window.api.editStore(node)

    // props.getTableDataByName({})

    let parseKeys = node.key.split(SP)

    let nodeType = parseKeys[0]
    console.log('editConnection node type: ', parseKeys)
    if (nodeType === 'connection') {

    } else if (nodeType === 'table') {
      // tableName: parseKeys[1], type: 1, schema: parseKeys[2], dbName: parseKeys[3], sql
      props.getTableDataByName({ tableName: parseKeys[1], type: 2, schema: parseKeys[2], dbName: parseKeys[3] })
    }
  }

  function delConnection (node) {
    console.log('delConnection aa', node)

    window.api.delStore(node.key)

    props.updateSlider()

  }


  const upProps: UploadProps = {
    name: 'file',
    // action: 'https://660d2bd96ddfa2943b33731c.mockapi.io/api/upload',
    headers: {
      authorization: 'authorization-text',
    },
    onChange (info) {
      // if (info.file.status !== 'uploading') {
      //   console.log(info.file, info.fileList);
      // }
      // if (info.file.status === 'done') {
      //   message.success(`${info.file.name} file uploaded successfully`);
      // } else if (info.file.status === 'error') {
      //   message.error(`${info.file.name} file upload failed.`);
      // }
    },
  };

  function folderInput (e) {
    console.log('folderInput: ', e)
  }

  const items: MenuProps['items'] = [
    {
      label: 'Create Database',
      key: '10',
    },
    {
      type: 'divider',
    },
    {
      label: 'Backup',
      key: '20',
    },
    {
      type: 'divider',
    },
    {
      label: 'Restore struct',
      key: '30',
    },
    {
      label: 'Restore struct and data',
      key: '31',
    }

  ];

  //export PGPASSWORD='postgres' && pg_dump -U postgres -h 127.0.0.1 -p 5432 -Fc jogo_gaming_dev > /Users/apple/Documents/dbBackup/testdata.sql

  //export PGPASSWORD='postgres' && pg_restore -U postgres -h 127.0.0.1 -p 5432 --dbname=t2  /Users/apple/Documents/dbBackup/testdata1.sql
  //下面只恢复表结构
  //export PGPASSWORD='postgres' && pg_restore -U postgres -h 127.0.0.1 -p 5432 -s --dbname=t2  /Users/apple/Documents/dbBackup/testdata1.sql

  function rightMenuHandler (e) {
    console.log('rightMenuHandler e: ', e)
    e.domEvent.stopPropagation()
    console.log('rightClickItemKey: ', rightClickItemKey)

    if (!rightClickItemKey) {
      return
    }
    let keyArr = rightClickItemKey.split(SP)

    if (+e.key === 10) {
      setShowCreateFrom(true)


    } else if (+e.key === 20) {
      window.api.dbBackup({ type: 1, name: keyArr[1], config: props.connection }).then((res, a, b) => {
        console.log('client backup res: ', res, typeof res, res?.exitCode)
        if (res === 0) {
          message.success({
            type: 'success',
            content: 'Backup success',
          })
        } else {
          message.error({
            type: 'error',
            content: 'Backup error',
          });
        }
      })

    } else if (+e.key === 30) {
      console.log('select file: ')
      backupDbName = keyArr[1]
      restoreType = 1
      selectSqlFile.current.click()
    } else if (+e.key === 31) {
      console.log('select file: ')
      restoreType = 2
      backupDbName = keyArr[1]
      selectSqlFile.current.click()
    }
  }

  function selectFile (e) {
    console.log('selectFile: ', e)
    console.log('selectFile path: ', e.target.files[0]?.path)

    window.api.dbRestore({ type: restoreType, dbName: backupDbName, connection: props.connection, sqlPath: e.target.files[0]?.path }).then(res => {
      console.log('client dbRestore res: ', res)
    })
  }

  // node connection-jogo_gaming_dev-1720530577574
  function treeRightHandler ({ event, node }) {
    console.log('treeRightHandler: ', event, node)

    rightClickItemKey = node.key
  }

  function titleRender (nodeData) {
    console.log('title render: ', nodeData)

    let item = <div className='treeTitle'>
      <span>{nodeData.title}</span>
      <Space className='treeBtn'>

        <DeleteOutlined className='marginlr20' onClick={(e) => {
          //业务的处理函数
          //在这里处理拿到key 去处理一维数组，然后再转二维数组 ，再setState
          console.log('delete', e)
          e.stopPropagation()
          delConnection(nodeData)
        }} />
        <EditOutlined onClick={(e) => {
          console.log('edit connection: ', nodeData)
          e.stopPropagation()

          editConnection(nodeData)
          //业务的处理函数
          //在这里处理拿到key 去处理一维数组，然后再转二维数组 ，再setState
        }} />
      </Space>
    </div>
    if (/connection/.test(nodeData.key)) {
      item = <Dropdown menu={{ items, onClick: rightMenuHandler }} trigger={['contextMenu']}>
        {item}
      </Dropdown>
    }
    return (
      <div>

        <input ref={selectSqlFile} type="file" style={{ display: 'none' }} onChange={selectFile} />
        {item}
      </div>
    )
  }

  async function addOk (val) {
    console.log('crate db add ok.>>>', val)
    setShowCreateFrom(false)

    window.api.dbCreate({ dbName: val.name, connection: props.connection }).then(res => {
      console.log('client dbCreate res: ', res)
    })

    // window.api.addStore({
    //     name: val.name,
    //     config: {
    //         host: val.host,
    //         port: val.port,
    //         username: val.username,
    //         password: val.password,
    //         dialect: val.dialect,
    //         database: val.database
    //     }
    // })

    // props.updateSlider()

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
      />
      <Modal title="Create database" open={showCreateFrom}
        onOk={handleOk} onCancel={handleCancel}
        footer={[]}>
        <CreateDbForm createDatabase={addOk}></CreateDbForm>
      </Modal>
    </div>
  );
};

export default ConnectionItem;