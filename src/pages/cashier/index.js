import React from 'react';
import styles from './index.less';
import CashierModel from '@/models/cashier';
import { dispatchType } from '@/utils/model-utils';
import { connect } from 'dva';
import { history } from 'umi';
import moment from 'moment';
import { Avatar, Button, Descriptions, Divider, Empty, message, Modal, Radio, Space, Spin, Statistic } from 'antd';

let ci = null;

@connect(({ global, cashier, loading, ...rest }) => {
  return {
    cashier: cashier?.detail,
    isGetCashierLoading: loading.effects[dispatchType(CashierModel, CashierModel.effects.getCashier)],
    isGoPayLoading: loading.effects[dispatchType(CashierModel, CashierModel.effects.goPay)],
    isCloseTradeLoading: loading.effects[dispatchType(CashierModel, CashierModel.effects.closeTrade)],
  };
}, dispatch => ({
  $getCashier: (args = {}) => dispatch({ type: dispatchType(CashierModel, CashierModel.effects.getCashier), ...args }),
  $goPay: (args = {}) => dispatch({ type: dispatchType(CashierModel, CashierModel.effects.goPay), ...args }),
  $closeTrade: (args = {}) => dispatch({ type: dispatchType(CashierModel, CashierModel.effects.closeTrade), ...args }),
}))
class index extends React.Component {
  state = {
    payType: null,
  };

  componentDidMount() {
    this.startInterval();
  }

  componentWillUnmount() {
    clearInterval(ci);
  }

  render() {
    let { cashier, isGetCashierLoading, isGoPayLoading, isCloseTradeLoading } = this.props;
    let payTypes = cashier?.payTypes || [];
    return (<div className={styles.page}>
      {/* LOGO */}
      <div className={styles.cashier}>
        {isGetCashierLoading ? (<div className={styles.loading}><Spin size='large' /></div>)
          : (cashier ? (<>
            {/* 交易单详情 */}
            <Divider orientation='left'>订单详情</Divider>
            <Descriptions column={2}>
              <Descriptions.Item>
                <Statistic title='交易单号' value={cashier?.outTradeNo} />
              </Descriptions.Item>
              <Descriptions.Item>
                <Statistic title='收款方' value={cashier?.accessMchName} />
              </Descriptions.Item>
              <Descriptions.Item>
                <Statistic title='订单金额 (元)' value={cashier?.tradeAmt} precision={2} />
              </Descriptions.Item>
              <Descriptions.Item>
                <Statistic.Countdown title='支付剩余时间' format='Y 年 D 天 H 时 m 分 s 秒'
                                     value={moment(`${cashier?.planCloseAt}`).unix() * 1000} />
              </Descriptions.Item>
            </Descriptions>
            {/* 支付方式 */}
            <Divider orientation='left'>支付方式</Divider>
            <Radio.Group onChange={this.onChangePayType}>
              <Space direction='vertical'>
                {payTypes.map(({ payType, title = '未设置' }) => (
                  <Radio key={`${payType}`} value={`${payType}`}>{title}</Radio>))}
              </Space>
            </Radio.Group><br />
            {/* 操作按钮 */}
            <Divider />
            <div className={styles.toolbar}>
              <Button type='text' loading={isCloseTradeLoading} onClick={this.onClickCloseTrade}>取消交易</Button>
              <Divider type='vertical' />
              <Button type='primary' loading={isGoPayLoading} onClick={this.onClickGoPay}>确认付款</Button>
            </div>
          </>) : (<Empty description={'单据不存在或已过期'} />))
        }
      </div>
    </div>);
  }

  onChangePayType = (e) => {
    this.setState({ payType: e.target.value });
  };

  onClickCloseTrade = () => {
    let { $closeTrade, cashier } = this.props;
    $closeTrade({ payload: { tradeOrderId: cashier?.tradeOrderId }, callback: null });
  };

  onClickGoPay = () => {
    let { $goPay, cashier } = this.props;
    let { payType } = this.state;
    $goPay({
      payload: { tradeOrderId: cashier?.tradeOrderId, paySceneId: cashier?.paySceneId, payType: payType },
      callback: this.handlePay,
    });
  };

  handlePay = ({ data }) => {
    let type = data?.type;
    switch (type) {
      case 'redirect': {
        window.location.href = data?.redirect;
        break;
      }
      case 'qrCode': {
        Modal.info({
          title: '扫码支付',
          content: (<div className={styles.qrcode}><Avatar size={140} shape='square' src={data?.qrCode} /></div>),
        });
        break;
      }
      default: {
        message.error(`暂不支持:${type}`);
      }
    }
  };

  startInterval = () => {
    clearInterval(ci);
    ci = setInterval(() => {
      let { cashier, location: { query } } = this.props;
      if (cashier?.status !== 'processing') {
        history.push({
          pathname: '/cashier/result',
          query: { ...query },
        });
      }
    }, 1000);
  };

}

export default index;
