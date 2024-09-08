import React, { useEffect, useState, useRef } from 'react';
import { Breadcrumb, Drawer, Dropdown, FloatButton, Layout, List, MenuProps, Modal } from 'antd';
import ConnectionItem from './ConnectionItem';
import TabelContent from './TabelContent';
import { Header } from 'antd/es/layout/layout';
import ConnectionForm from './ConnectionForm';
import CreateDbForm from './CreateDbFrom';
import * as _ from 'lodash'
import { FileTextOutlined } from '@ant-design/icons';
import moment from 'moment';
import CustomContext from '@renderer/utils/context';
import { ILogItem } from '../interface'
import { LogAction } from '@renderer/utils/constant';
const { Content, Sider } = Layout;

// const items = [UserOutlined, VideoCameraOutlined, UploadOutlined, UserOutlined].map(
//   (icon, index) => ({
//     key: String(index + 1),
//     icon: React.createElement(icon),
//     label: `nav ${index + 1}`,
//   }),
// );

// const headerStyle: React.CSSProperties = {
//   textAlign: 'center',
//   color: '#fff',
//   height: 30,
//   paddingInline: 48,
//   lineHeight: '64px',
//   backgroundColor: '#4096ff',
// };

type SqlRef = {

}
const CLayout: React.FC = () => {
  // const {
  //   token: { colorBgContainer, borderRadiusLG },
  // } = theme.useToken();

  const [connections, setConnections] = useState([])
  const [data, setData] = useState({
    showForm: false, connections: [
      // {
      //   "name": "local-pg233",
      //   "config": {
      //     "host": "127.0.0.1",
      //     "port": 5432,
      //     "username": "postgres",
      //     "password": "postgres",
      //     "dialect": "postgres",
      //     "database": "jogo_gaming_dev"
      //   }
      // }
    ],
    connectionForm: false,
    createdbFrom: false,
    dbInfo: [
      // {
      //   title: 'Home',
      // },
      // {
      //   title: 'Application Center',
      //   href: '',
      // }
    ]
  })


  const tabsRef = useRef<any>()

  useEffect(() => {
    console.log('useEffect')
    updateSlider()
  }, [])

  function updateSlider () {
    window.api.getStore().then(connections => {

      console.log('updateSlider begin connections: ', connections)
      // let tmp = _.cloneDeep(data)
      // tmp.connections = connections
      // setData(null)
      setConnections(connections)
    })
  }

  function getTableDataByName (val) {
    console.log('layout getTableDataByName: ', val)

    // let tableName = getTableName(val)

    // window.api.getTableData(val).then(data => {

    //   console.log('getTableDataByName query sql res: ', data)
    //   // listRef.current.updateList({ listData: data, tableName })
    // })
    // type 1-查看表数据 2-编辑表
    tabsRef.current.updateList(val)
  }

  function rightMenuHandler (e) {
    console.log('rightMenuHandler e: ', e)
    e.domEvent.stopPropagation()

    if (+e.key === 5) {
      setData({ ...data, connectionForm: true })

    } else if (+e.key === 10) {

      setData({ ...data, createdbFrom: true })
    }

  }


  const items: MenuProps['items'] = [
    {
      label: 'Add Connection',
      key: '5',
    },
    // {
    //   label: 'Create Database',
    //   key: '10',
    // }
  ];

  function conOk () {
    setData({ ...data, connectionForm: false })
  }

  function conCancel () {
    setData({ ...data, connectionForm: false })
  }

  function createdbCacel () {
    setData({ ...data, createdbFrom: false })
  }

  function createdbOk () {
    setData({ ...data, createdbFrom: false })
  }

  function conAddOk (val) {
    window.api.addStore({
      name: val.name,
      config: {
        host: val.host,
        port: val.port,
        username: val.username,
        password: val.password,
        dialect: val.dialect,
        database: val.database
      }
    })

    setData({ ...data, connectionForm: false })
    updateSlider()
  }
  function addDbOk (val) {
    console.log('add db ok val: ', val)
    // window.api.dbCreate({ dbName: val.name, connection: props.connection }).then(res => {
    //   console.log('client dbCreate res: ', res)
    // })

    setData({ ...data, createdbFrom: false })
  }

  function setDbInfo (val) {
    console.log('set db info: ', val)
    let a = val.map(el => {
      return {
        title: el
      }
    })
    setData({ ...data, dbInfo: a })
  }

  const [logOpen, setLogOpen] = useState(false)
  function logClose () {
    setLogOpen(false)
  }

  function showLog () {
    setLogOpen(true)
  }

  const [logList, setLogList] = useState<ILogItem[]>([
    {
      date: moment().format('YYYY-MM-DD hh:mm:ss'),
      action: LogAction.DBCONNECTION,
      type: 1,
      text: `Racing car sprays burning fuel into crowd.Racing car sprays burning fuel into crowd.Racing car sprays burning fuel into crowd.Racing car sprays burning fuel into crowd.`
    }
  ])

  return (
    <div>
      <CustomContext.Provider value={{ logList, setLogList }}>
        <Header style={{ backgroundColor: 'white', height: '30px' }}>

          <Breadcrumb
            style={{ marginLeft: '250px' }}
            separator=">"
            items={data.dbInfo}
          />
        </Header>

        <Layout>
          <Dropdown menu={{ items, onClick: rightMenuHandler }} trigger={['contextMenu']}>
            <div style={{ height: window.screen.height - 64 - 60 + 'px', overflow: 'auto' }}>
              <Sider
                breakpoint="lg"
                collapsedWidth="0"
                onBreakpoint={(broken) => {
                  console.log(broken);
                }}
                width={300}
                onCollapse={(collapsed, type) => {
                  console.log(collapsed, type);
                }}
                style={{ backgroundColor: 'white' }}
              >
                {
                  connections.map((el, index) => {
                    return <ConnectionItem setDbInfo={setDbInfo} getTableDataByName={getTableDataByName} cid={index} key={index} connection={el} updateSlider={updateSlider}></ConnectionItem>
                  })
                }
              </Sider>
            </div>
          </Dropdown>
          <Layout>


            <Content style={{ height: window.screen.height - 64 - 60 - 200 + 'px' }}>
              <TabelContent ref={tabsRef}></TabelContent>
            </Content>

          </Layout>
        </Layout>

        <Drawer
          title={`LOG`}
          placement="right"
          size={'large'}
          onClose={logClose}
          open={logOpen}
        // extra={
        //   <Space>
        //     <Button onClick={onClose}>Cancel</Button>
        //     <Button type="primary" onClick={onClose}>
        //       OK
        //     </Button>
        //   </Space>
        // }

        >
          <List
            size="small"
            // bordered
            dataSource={logList}
            renderItem={(item) => {
              return <p style={{ fontSize: 14, margin: 0 }}>[{item.type}] [{item.date}] {item.text}</p>
            }}
          />

        </Drawer>

        <FloatButton
          icon={<FileTextOutlined />}
          description="LOG"
          shape="square"
          style={{ insetInlineEnd: 164 }}
          onClick={showLog}
        />

        <Modal title="Add connection" open={data.connectionForm}
          onOk={conOk} onCancel={conCancel}
          footer={[]}>
          <ConnectionForm addConnection={conAddOk}></ConnectionForm>
        </Modal>

        <Modal title="Create database" open={data.createdbFrom}
          onOk={createdbOk} onCancel={createdbCacel}
          footer={[]}>
          <CreateDbForm createDatabase={addDbOk}></CreateDbForm>
        </Modal>

      </CustomContext.Provider>
    </div >
  );
};

export default CLayout;