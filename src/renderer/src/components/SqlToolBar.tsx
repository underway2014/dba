import React, { useState } from 'react';
import { DownloadOutlined, CaretRightOutlined,EditFilled } from '@ant-design/icons';
import { Button, Divider, Flex, Radio } from 'antd';
import type { ConfigProviderProps } from 'antd';

type SizeType = ConfigProviderProps['componentSize'];


type selfProps = {
    sqlToolHandler: Function
}

const SqlToolBar: React.FC<selfProps> = (pro) => {
  const [size, setSize] = useState<SizeType>('large'); // default is 'middle'
  function excute(val) {
    pro.sqlToolHandler(val)
  }
  return (
    <>
      <Flex gap="small" align="flex-start" vertical>
        <Flex gap="small" wrap>
          <Button type="primary" onClick={() => excute(1)} shape="circle" icon={<CaretRightOutlined />} size={size} />
          <Button type="primary" shape="round" icon={<DownloadOutlined />} size={size} />
          <Button type="primary" shape="round" icon={<EditFilled />} size={size}>
            Download
          </Button>
          <Button type="primary" icon={<DownloadOutlined />} size={size}>
            Download
          </Button>
        </Flex>
      </Flex>
    </>
  );
};

export default SqlToolBar;