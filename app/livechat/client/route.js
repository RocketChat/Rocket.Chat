import { FlowRouter } from 'meteor/kadira:flow-router';

import { AccountBox } from '../../ui-utils';

export const omnichannelManagerRoutes = FlowRouter.group({
	prefix: '/omnichannel-manager',
	name: 'omnichannel-manager',
});

const load = () => import('./views/admin');

AccountBox.addRoute({
	name: 'omnichannel-dashboard',
	path: '/dashboard',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Dashboard',
	pageTemplate: 'omnichannelDashboard',
}, omnichannelManagerRoutes, load);

AccountBox.addRoute({
	name: 'omnichannel-current-chats',
	path: '/current',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Current_Chats',
	pageTemplate: 'omnichannelCurrentChats',
}, omnichannelManagerRoutes, load);

AccountBox.addRoute({
	name: 'omnichannel-analytics',
	path: '/analytics',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Analytics',
	pageTemplate: 'omnichannelAnalytics',
}, omnichannelManagerRoutes, load);

AccountBox.addRoute({
	name: 'omnichannel-real-time-monitoring',
	path: '/real-time-monitoring',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Real_Time_Monitoring',
	pageTemplate: 'omnichannelRealTimeMonitoring',
}, omnichannelManagerRoutes, load);

AccountBox.addRoute({
	name: 'omnichannel-managers',
	path: '/managers',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Livechat_managers',
	pageTemplate: 'omnichannelManagers',
}, omnichannelManagerRoutes, load);

AccountBox.addRoute({
	name: 'omnichannel-agents',
	path: '/agents',
	sideNav: 'omnichannelFlex',
	pageTemplate: 'omnichannelAgents',
	customContainer: true,
}, omnichannelManagerRoutes, load);

AccountBox.addRoute({
	name: 'omnichannel-departments',
	path: '/departments',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Departments',
	pageTemplate: 'omnichannelDepartments',
}, omnichannelManagerRoutes, load);

AccountBox.addRoute({
	name: 'omnichannel-department-edit',
	path: '/departments/:_id/edit',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Edit_Department',
	pageTemplate: 'omnichannelDepartmentForm',
	customContainer: true,
}, omnichannelManagerRoutes, load);

AccountBox.addRoute({
	name: 'omnichannel-department-new',
	path: '/departments/new',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'New_Department',
	pageTemplate: 'omnichannelDepartmentForm',
	customContainer: true,
}, omnichannelManagerRoutes, load);

AccountBox.addRoute({
	name: 'livechat-triggers',
	path: '/triggers',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Triggers',
	pageTemplate: 'livechatTriggers',
}, omnichannelManagerRoutes, load);

AccountBox.addRoute({
	name: 'livechat-trigger-edit',
	path: '/triggers/:_id/edit',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Edit_Trigger',
	pageTemplate: 'livechatTriggersForm',
}, omnichannelManagerRoutes, load);

AccountBox.addRoute({
	name: 'livechat-trigger-new',
	path: '/triggers/new',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'New_Trigger',
	pageTemplate: 'livechatTriggersForm',
}, omnichannelManagerRoutes, load);

AccountBox.addRoute({
	name: 'livechat-installation',
	path: '/installation',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Installation',
	pageTemplate: 'livechatInstallation',
}, omnichannelManagerRoutes, load);

AccountBox.addRoute({
	name: 'livechat-appearance',
	path: '/appearance',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Appearance',
	pageTemplate: 'livechatAppearance',
}, omnichannelManagerRoutes, load);

AccountBox.addRoute({
	name: 'omnichannel-officeHours',
	path: '/officeHours',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Office_Hours',
	pageTemplate: 'omnichannelOfficeHours',
}, omnichannelManagerRoutes, load);

AccountBox.addRoute({
	name: 'omnichannel-customfields',
	path: '/customfields',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Custom_Fields',
	pageTemplate: 'omnichannelCustomFields',
}, omnichannelManagerRoutes, load);

AccountBox.addRoute({
	name: 'omnichannel-customfield-edit',
	path: '/customfields/:_id/edit',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Edit_Custom_Field',
	pageTemplate: 'omnichannelCustomFieldForm',
}, omnichannelManagerRoutes, load);

AccountBox.addRoute({
	name: 'omnichannel-customfield-new',
	path: '/customfields/new',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'New_Custom_Field',
	pageTemplate: 'omnichannelCustomFieldForm',
}, omnichannelManagerRoutes, load);

AccountBox.addRoute({
	name: 'omnichannel-webhooks',
	path: '/webhooks',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Webhooks',
	pageTemplate: 'omnichannelIntegrationWebhook',
}, omnichannelManagerRoutes, load);

AccountBox.addRoute({
	name: 'omnichannel-facebook',
	path: '/facebook',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Facebook Messenger',
	pageTemplate: 'omnichannelIntegrationFacebook',
}, omnichannelManagerRoutes, load);

AccountBox.addRoute({
	name: 'omnichannel-queue',
	path: '/omnichannel-queue',
	i18nPageTitle: 'Omnichannel_Queue',
	pageTemplate: 'omnichannelQueue',
}, null, load);
