import React, { forwardRef, useContext, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Button, Flex, Form, Input, Table } from 'antd';
import { DownloadOutlined, CaretRightOutlined, EditFilled } from '@ant-design/icons';

import type { FormInstance, InputRef, TableColumnsType, TableProps } from 'antd';
import SqlContent from './SqlContent';
import TextArea from 'antd/es/input/TextArea';

type TableRowSelection<T> = TableProps<T>['rowSelection'];
const EditableContext = React.createContext<FormInstance<any> | null>(null);

interface DataType {
  key: React.Key;
  name: string;
  age: number;
  address: string;
}


interface EditableCellProps {
  title: React.ReactNode;
  editable: boolean;
  dataIndex: any;
  record: any;
  handleSave: (record: any) => void;
}

// const columns: TableColumnsType<DataType> = [
//   {
//     title: 'Name',
//     dataIndex: 'name',
//   },
//   {
//     title: 'Age',
//     dataIndex: 'age',
//   },
//   {
//     title: 'Address',
//     dataIndex: 'address',
//   },
// ];

// const data: DataType[] = [];
// for (let i = 0; i < 46; i++) {
//   data.push({
//     key: i,
//     name: `Edward King ${i}`,
//     age: 32,
//     address: `London, Park Lane no. ${i}`,
//   });
// }
const scroll = {
  x: '100vw', y: 240
}

const currentData = {
  rows: [],
  columns: [],
  table: '',
  sql: ''
}

type selfProps = {
  tabData: any
}

const DataList: React.FC<selfProps> = (props, parentRef) => {
  const inputRef = useRef(null);
  const [sqlTxt, setSqlTxt] = useState(`select * from ${props.tabData.tableName}`)

  console.log('datalist props.tabData: ', props.tabData)
  // console.log('init current sql: ', currentSql)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  console.log('aaa')
  const [data, setData] = useState<React.Key[]>([]);

  useEffect(() => {
    console.log('use effect sqlTxt: ', sqlTxt)
    window.api.getTableData(sqlTxt).then(data => {

      console.log('executeSql query sql res: ', data)
      updateList({ listData: data, tableName: props.tabData.tableName })
    })
  }, [])


  const [columns, setColumns] = useState<React.Key[]>([]);
  console.log('bbb')

  const handleSave = ({ row, opt }) => {
    const newData = [...currentData.rows];
    currentData.table = props.listData.tableName
    currentData.rows = props.listData.rows
    console.log('handleSave row: ', row, opt)
    console.log('handleSave newData: ', currentData.rows, data)
    const index = newData.findIndex((item) => row.id === item.id);
    const item = newData[index];
    console.log('handleSave item: ', item, index)
    newData.splice(index, 1, {
      ...item,
      ...row
    });

    window.api.updateDate({ tableName: currentData.table, id: row.id, data: opt }).then(data => {

      console.log('query sql res: ', data)
      setData(newData);

    })
  };


  function updateList ({ listData, tableName }) {
    currentData.table = tableName

    console.log('useImperativeHandle data: ', data)

    listData.rows.forEach(el => el.key = `${new Date().getTime()}_${(Math.random() + '').replace('.', '')}`)

    console.log('column rows: ', listData.columns, listData.rows)
    setData(listData.rows)
    currentData.rows = listData.rows

    console.log('update data:', data)

    setColumns(listData.columns.map(el => {
      return {
        title: el.column_name,
        dataIndex: el.column_name,
        with: '100px',
        onCell: (record: DataType) => ({
          record,
          editable: true,
          dataIndex: el.column_name,
          title: el.column_name,
          handleSave,
        })
      }
    }))
  }

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    console.log('selectedRowKeys changed: ', newSelectedRowKeys);
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection: TableRowSelection<DataType> = {
    selectedRowKeys,
    onChange: onSelectChange,
    selections: [
      Table.SELECTION_ALL,
      Table.SELECTION_INVERT,
      Table.SELECTION_NONE,
      {
        key: 'odd',
        text: 'Select Odd Row',
        onSelect: (changeableRowKeys) => {
          let newSelectedRowKeys = changeableRowKeys.filter((_, index) => {
            if (index % 2 !== 0) {
              return false;
            }
            return true;
          });
          setSelectedRowKeys(newSelectedRowKeys);
        },
      },
      {
        key: 'even',
        text: 'Select Even Row',
        onSelect: (changeableRowKeys) => {
          let newSelectedRowKeys = changeableRowKeys.filter((_, index) => {
            if (index % 2 !== 0) {
              return true;
            }
            return false;
          });
          setSelectedRowKeys(newSelectedRowKeys);
        },
      },
    ],
  };


  interface EditableRowProps {
    index: number;
  }

  const EditableRow: React.FC<EditableRowProps> = ({ index, ...props }) => {
    const [form] = Form.useForm();
    return (
      <Form form={form} component={false}>
        <EditableContext.Provider value={form}>
          <tr {...props} />
        </EditableContext.Provider>
      </Form>
    );
  };


  const EditableCell: React.FC<React.PropsWithChildren<EditableCellProps>> = ({
    title,
    editable,
    children,
    dataIndex,
    record,
    handleSave,
    ...restProps
  }) => {
    const [editing, setEditing] = useState(false);
    const inputRef = useRef<InputRef>(null);
    const form = useContext(EditableContext)!;

    useEffect(() => {
      if (editing) {
        inputRef.current?.focus();
      }
    }, [editing]);

    const toggleEdit = () => {
      setEditing(!editing);
      form.setFieldsValue({ [dataIndex]: record[dataIndex] });
    };

    const save = async () => {
      try {
        const values = await form.validateFields();

        console.log('values: ', values)

        toggleEdit();
        handleSave({ row: { ...record, ...values }, opt: values });
      } catch (errInfo) {
        console.log('Save failed:', errInfo);
      }
    };

    let childNode = children;

    if (editable) {
      childNode = editing ? (
        <Form.Item
          style={{ margin: 0 }}
          name={dataIndex}
          rules={[
            {
              required: true,
              message: `${title} is required.`,
            },
          ]}
        >
          <Input ref={inputRef} onPressEnter={save} onBlur={save} />
        </Form.Item>
      ) : (
        <div className="editable-cell-value-wrap" style={{ paddingRight: 24 }} onDoubleClick={toggleEdit}>
          {children}
        </div>
      );
    }

    return <td {...restProps}>{childNode}</td>;
  }

  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  };

  function runSql () {
    sqlHandler()
  }


  function getTableName (sql) {
    if (!sql) {
      throw new Error(`${sql} error`)
    }

    let a = sql.replaceAll('\n', '').split('from')
    let b = a[1].split(' ')

    return b.find(el => !!el)
  }

  function sqlHandler () {
    console.log('sqlHandler: ', sqlTxt)

    // if(sqlTxtRef && sqlTxtRef.current && sqlTxtRef.current.getTxt === 'function') {
    setSqlTxt(sqlTxt)
    let tableName = getTableName(sqlTxt)
    window.api.getTableData(sqlTxt).then(data => {

      console.log('query sql res: ', data)
      updateList({ listData: data, tableName })
    })
  }

  return (
    <div>
      <Flex gap="small" align="flex-start" vertical>
        <Flex gap="small" wrap>
          <Button type="primary" onClick={() => runSql()} shape="circle" icon={<CaretRightOutlined />} size='large' />
        </Flex>
      </Flex>
      <TextArea rows={4} value={sqlTxt} onChange={e => {
        console.log('sql txt:', e.target.value)
        setSqlTxt(e.target.value)
        // currentSql = e.target.value
      }} />
      <Table scroll={{ x: 'max-content' }} components={components} rowSelection={rowSelection} columns={columns} dataSource={data} ref={inputRef} />;
    </div >
  )
};

// export default DataList;
export default forwardRef(DataList);