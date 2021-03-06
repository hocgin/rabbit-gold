import * as React from 'react';
import useUrlState from '@ahooksjs/use-url-state';
import styles from './index.less';
import { useEffect, useState } from 'react';
import { useRequest } from 'ahooks';
import { history } from 'umi';
import { Money } from '@hocgin/ui';
import TitleSpec from '@/components/TitleSpec';
import bmwService from '@/services/bmw';
import { Spin, Avatar, Row, Col, Space, Button, Modal, message } from 'antd';
import classnames from 'classnames';
import { TrophyOutlined, PayCircleOutlined } from '@ant-design/icons';

const RadioOption: React.FC<{ src?: string, title?: string, checked?: boolean, onClick: any }> = ({
                                                                                                    src =
                                                                                                      <PayCircleOutlined
                                                                                                        className={styles.payIcon} />,
                                                                                                    title,
                                                                                                    checked = false,
                                                                                                    onClick,
                                                                                                  }, ref) => {
  return <div onClick={onClick} className={classnames(styles.radioOption, {
    [styles.checked]: checked,
  })}>
    <Avatar className={styles.image} src={src} shape={'square'} size={24} />
    <div className={styles.title}>{title}</div>
  </div>;
};


const Index: React.FC<{}> = (props, ref) => {
  const [params, setParams] = useUrlState({ u: undefined });
  let [more, setMore] = useState<boolean>(false);
  let [data, setData] = useState<any>(undefined);
  let [check, setCheck] = useState(0);
  let getCashier = useRequest(bmwService.getCashier, {
    manual: true,
    onSuccess: (data: any) => {
      if (!data) {
        history.push({ pathname: '/404', query: { ...params } });
      }
      if (data?.status !== 'processing') {
        history.push({ pathname: '/result', query: { ...params } });
      }
      setData(data);
    },
    onError: (err: any) => {
      // todo ??????????????????
    },
  });
  let goPay = useRequest(bmwService.goPay, {
    manual: true, onSuccess: (data: any) => {
      switch (data?.type) {
        case 'redirect': {
          window.location.href = data?.redirect;
          break;
        }
        case 'qrCode': {
          Modal.info({
            title: '????????????',
            content: (<div className={styles.qrcode}><Avatar size={140} shape='square' src={data?.qrCode} /></div>),
          });
          break;
        }
        default: {
          message.error(`????????????:${data?.type}`);
        }
      }
    },
  });
  let closeTrade = useRequest(bmwService.closeTrade, {
    manual: true, onSuccess: () => message.success('????????????'),
  });

  useEffect(() => {
    let u = params?.u;
    if (!u) history.push({ pathname: '/404', query: { ...params } });
    getCashier.runAsync({ u });
    let interval = setInterval(() => data && getCashier.run({ u }), 2.5 * 1000);
    return () => clearInterval(interval);
  }, [params?.u]);

  if (!data && getCashier?.loading) {
    return <div className={classnames(styles.cashier, styles.center)}><Spin /></div>;
  }
  let payTypes = (data?.payTypes || []).map((item: any, index: number) => ({
    ...item,
    checked: check === index,
  }));

  let checked = payTypes.filter(({ checked }: any) => checked);

  let onSubmit = () => {
    goPay.run({ tradeOrderId: data?.tradeOrderId, paySceneId: data?.paySceneId, payType: checked[0]?.payType });
  };

  let onClose = () => {
    Modal.confirm({
      title: '???????????????????',
      onOk: () => closeTrade.run({ tradeOrderId: data?.tradeOrderId }),
    });
  };

  return (<div className={styles.cashier}>
    <div className={styles.info}>
      <div className={styles.head}>
        <div className={styles.image}>
          <Avatar shape={'square'} size={100} src={data?.imageUrl} icon={<TrophyOutlined />} />
        </div>
        <div className={styles.order}>
          <TitleSpec title='????????????'>{data?.accessMchName}</TitleSpec>
          <TitleSpec title='????????????'>{data?.orderTitle}</TitleSpec>
          <TitleSpec title='????????????'> <Money value={data?.tradeAmt} /></TitleSpec>
          <TitleSpec title='????????????'> {data?.userName}</TitleSpec>
          {more && (<>
            <TitleSpec title='????????????'>{data?.orderDesc}</TitleSpec>
            <TitleSpec title='????????????'> {data?.createdAt}</TitleSpec>
            <TitleSpec title='????????????'>{data?.planCloseAt}</TitleSpec>
            <TitleSpec title='?????????'>{data?.tradeNo}</TitleSpec>
          </>)}
          <a className={styles.toolbar} onClick={() => setMore(!more)}>{more ? '??????' : '??????'}</a>
        </div>
      </div>
    </div>
    <div className={styles.methods}>
      <div className={styles.title}>????????????</div>
      <div className={styles.options}>
        <Row gutter={[10, 10]}>
          {payTypes.map((item: any, index: number) => <Col md={6} xs={24}>
            <RadioOption src={item.imageUrl} title={item.title} checked={item.checked}
                         onClick={() => setCheck(index)} />
          </Col>)}
        </Row>
      </div>
      <div className={styles.methodsToolbar}>
        <Space>
          <Button type='link' loading={closeTrade?.loading} onClick={onClose} disabled={data === undefined}>????????????</Button>
          <Button type='primary' loading={goPay?.loading} onClick={onSubmit} disabled={data === undefined}>????????????</Button>
        </Space>
      </div>
    </div>
  </div>);
};

export default Index;
