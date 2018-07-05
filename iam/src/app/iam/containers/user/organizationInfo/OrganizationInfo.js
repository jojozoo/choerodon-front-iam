/**
 * Created by hulingfangzi on 2018/7/2.
 */
import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { Button, Form, Table, Icon, Modal, Tooltip } from 'choerodon-ui';
import { injectIntl, FormattedMessage } from 'react-intl';
import { withRouter } from 'react-router-dom';
import { Action, axios, Content, Header, Page, Permission } from 'choerodon-front-boot';
import querystring from 'query-string';
const intlPrefix = 'user.orginfo';
const { Sidebar } = Modal;

@inject('AppState')
@observer

class OrganizationInfo extends Component {
  state = this.getInitState();

  getInitState() {
    return {
      totalCount: false,
      loading: true,
      visible: false,
      content: null,
      pagination: {
        current: 1,
        pageSize: 10,
        total: 0,
      },
      filters: {},
      params: [],
      perpagination: {
        current: 1,
        pageSize: 10,
        total: 0,
      },
      perfilters: {},
      perparams: [],
      percontent: null,
      perloading: true,
      roleId: null,
      roleName: '',
    }
  }

  componentWillMount() {
    this.loadInitData();
  }


  loadInitData(paginationIn, filtersIn, paramsIn) {
    const {
      pagination: paginationState,
      params: paramsState,
      filters: filtersState,
    } = this.state;
    const pagination = paginationIn || paginationState;
    const params = paramsIn || paramsState;
    const filters = filtersIn || filtersState;
    this.fetch(pagination, filters, params).then(data => {
      this.setState({
        pagination: {
          current: data.number + 1,
          pageSize: data.size,
          total: data.totalElements,
        },
        content: data.content,
        loading: false,
        filters,
        params,
      });
    });
  }

  fetch({ current, pageSize }, { name, code }, params) {
    this.setState({
      loading: true,
    });
    const { AppState } = this.props;
    const id = AppState.getUserInfo.id;
    const queryObj = {
      page: current - 1,
      size: pageSize,
      name,
      code,
      params,
    };
    return axios.get(`/iam/v1/users/${id}/organization_roles?${querystring.stringify(queryObj)}`);
  }

  handlePageChange = (pagination, filters, {}, params) => {
    this.loadInitData(pagination, filters, params);
  };


  /* 打开sidebar */
  openSidebar = (record) => {
    this.setState({
      roleId: record.id,
      roleName: record.name,
      totalCount: false,
      perpagination: {
        current: 1,
        pageSize: 10,
        total: 0,
      },
      perfilters: {},
      perparams: [],
      percontent: null,
    }, () => {
      this.loadPermissionData();
    })
  }

  //关闭sidebar
  closeSidebar = () => {
    this.setState({
      visible: false,
    });
  };


  loadPermissionData(paginationIn, filtersIn, paramsIn) {
    const {
      perpagination: paginationState,
      perparams: paramsState,
      perfilters: filtersState,
    } = this.state;
    const pagination = paginationIn || paginationState;
    const params = paramsIn || paramsState;
    const filters = filtersIn || filtersState;
    this.permissionFetch(pagination, filters, params).then(data => {
      if (this.state.totalCount === false) {
        this.setState({
          totalCount: data.totalElements,
        })
      }
      this.setState({
        perpagination: {
          current: data.number + 1,
          pageSize: data.size,
          total: data.totalElements,
        },
        percontent: data.content,
        perloading: false,
        perfilters: filters,
        perparams: params,
        visible: true,
      });
    });
  }

  permissionFetch({ current, pageSize }, { code, description }, params) {
    this.setState({
      perloading: true,
    });
    const id = this.state.roleId;
    const queryObj = {
      page: current - 1,
      size: pageSize,
      code,
      description,
      params,
    };
    return axios.get(`/iam/v1/roles/${id}/permissions?${querystring.stringify(queryObj)}`);
  }

  handlePerPageChange = (pagination, filters, {}, params) => {
    this.loadPermissionData(pagination, filters, params);
  };

  renderSidebarContent() {
    const { intl } = this.props;
    const { percontent, perpagination, perloading, perparams, roleName, totalCount } = this.state;
    const columns = [{
      title: '权限',
      dataIndex: 'code',
      key: 'code',
    }, {
      title: '描述',
      dataIndex: 'description',
      key: 'description'
    }]
    return (
      <Content
        className="sidebar-content"
        code={`${intlPrefix}.detail`}
        values={{ name: roleName }}
      >
        <p style={{ fontSize: '18px', marginBottom: '8px' }}>{totalCount}个已分配权限</p>
        <Table
          loading={perloading}
          style={{ width: '512px' }}
          columns={columns}
          pagination={perpagination}
          filterBarPlaceholder={intl.formatMessage({ id: 'filtertable' })}
          dataSource={percontent}
          filters={perparams}
          onChange={this.handlePerPageChange}
        />
      </Content>
    )
  }

  getRowKey = (record, id) => {
    if ('roles' in record) {
      return record.id;
    } else {
      return `${id}-${record.id}`;
    }
  }

  handleRefresh = () => {
    this.setState(this.getInitState(), () => {
      this.loadInitData();
    });
  };

  render() {
    const { content, visible, pagination, loading, params } = this.state;
    const { AppState, intl } = this.props;
    let orgId;
    const columns = [{
      title: <FormattedMessage id={`${intlPrefix}.name`} />,
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => {
        let icon = '';
        if (record.hasOwnProperty('projects')) {
          icon = 'domain'
        } else {
          icon = 'person';
        }
        return (
          <span><Icon type={icon} style={{ verticalAlign: 'text-bottom' }} /> {text}</span>
        )
      }
    }, {
      title: <FormattedMessage id="code" />,
      dataIndex: 'code',
      key: 'code',
    }, {
      title: <FormattedMessage id="type" />,
      dataIndex: 'type',
      key: 'type',
      render: (text, record) => {
        return (
          record.hasOwnProperty('projects') ? '组织' : '角色'
        )
      }
    }, {
      title: '',
      width: 100,
      key: 'action',
      align: 'right',
      render: (text, record) => {
        if (!record.hasOwnProperty('projects')) {
          return (
          <Permission service={['iam-service.role.listPermissionById']}>
            <Tooltip
              title={<FormattedMessage id="detail" />}
              placement="bottom"
            >
              <Button
                shape="circle"
                icon="find_in_page"
                size="small"
                onClick={this.openSidebar.bind(this, record)}
              />
            </Tooltip>
          </Permission>
          )
        }
      }
    }];

    return (
      <Page>
        <Header title={<FormattedMessage id={`${intlPrefix}.header.title`} />}
        >
          <Button
            onClick={this.handleRefresh}
            icon="refresh"
          >
            <FormattedMessage id="refresh" />
          </Button>
        </Header>
        <Content
          code={intlPrefix}
          values={{ name: AppState.getUserInfo.loginName }}
        >
          <Table
            loading={loading}
            dataSource={content}
            pagination={pagination}
            columns={columns}
            filters={params}
            childrenColumnName="roles"
            rowKey={(record) => {
              orgId = this.getRowKey(record, orgId);
              return orgId;
            }}
            onChange={this.handlePageChange}
            filterBarPlaceholder={intl.formatMessage({ id: 'filtertable' })}
          />
          <Sidebar
            title={<FormattedMessage id={`${intlPrefix}.detail.header.title`} />}
            visible={visible}
            onOk={this.closeSidebar}
            okText={<FormattedMessage id="close" />}
            okCancel={false}
          >
            {this.renderSidebarContent()}
          </Sidebar>
        </Content>
      </Page>
    )
  }
}

export default withRouter(injectIntl(OrganizationInfo));

