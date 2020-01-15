import { FlowRouter } from 'meteor/kadira:flow-router';

import { AccountBox } from '../../ui-utils';

export const livechatManagerRoutes = FlowRouter.group({
	prefix: '/omnichannel-manager',
	name: 'omnichannel-manager',
});

const load = () => import('./views/admin');

AccountBox.addRoute({
	name: 'omnichannel-dashboard',
	path: '/dashboard',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Livechat_Dashboard',
	pageTemplate: 'omnichannelDashboard',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'omnichannel-current-chats',
	path: '/current',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Current_Chats',
	pageTemplate: 'omnichannelCurrentChats',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'omnichannel-analytics',
	path: '/analytics',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Analytics',
	pageTemplate: 'omnichannelAnalytics',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'omnichannel-real-time-monitoring',
	path: '/real-time-monitoring',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Real_Time_Monitoring',
	pageTemplate: 'omnichannelRealTimeMonitoring',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'omnichannel-managers',
	path: '/managers',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Livechat_managers',
	pageTemplate: 'omnichannelManagers',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'omnichannel-agents',
	path: '/agents',
	sideNav: 'omnichannelFlex',
	pageTemplate: 'omnichannelAgents',
	customContainer: true,
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'omnichannel-departments',
	path: '/departments',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Departments',
	pageTemplate: 'omnichannelDepartments',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'omnichannel-department-edit',
	path: '/departments/:_id/edit',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Edit_Department',
	pageTemplate: 'omnichannelDepartmentForm',
	customContainer: true,
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'omnichannel-department-new',
	path: '/departments/new',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'New_Department',
	pageTemplate: 'omnichannelDepartmentForm',
	customContainer: true,
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'omnichannel-livechat-triggers',
	path: '/livechat-triggers',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Triggers',
	pageTemplate: 'omnichannelLivechatTriggers',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'omnichannel-livechat-trigger-edit',
	path: '/livechat-triggers/:_id/edit',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Edit_Trigger',
	pageTemplate: 'omnichannelLivechatTriggersForm',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'omnichannel-livechat-trigger-new',
	path: '/livechat-triggers/new',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'New_Trigger',
	pageTemplate: 'omnichannelLivechatTriggersForm',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'omnichannel-livechat-installation',
	path: '/livechat-installation',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Installation',
	pageTemplate: 'omnichannelLivechatInstallation',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'omnichannel-livechat-appearance',
	path: '/livechat-appearance',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Appearance',
	pageTemplate: 'omnichannelLivechatAppearance',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'omnichannel-officeHours',
	path: '/officeHours',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Office_Hours',
	pageTemplate: 'omnichannelOfficeHours',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'omnichannel-customfields',
	path: '/customfields',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Custom_Fields',
	pageTemplate: 'omnichannelCustomFields',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'omnichannel-customfield-edit',
	path: '/customfields/:_id/edit',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Edit_Custom_Field',
	pageTemplate: 'omnichannelCustomFieldForm',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'omnichannel-customfield-new',
	path: '/customfields/new',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'New_Custom_Field',
	pageTemplate: 'omnichannelCustomFieldForm',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'omnichannel-webhooks',
	path: '/webhooks',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Webhooks',
	pageTemplate: 'omnichannelIntegrationWebhook',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'omnichannel-facebook',
	path: '/facebook',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Facebook Messenger',
	pageTemplate: 'omnichannelIntegrationFacebook',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'omnichannel-queue',
	path: '/omnichannel-queue',
	i18nPageTitle: 'Livechat_Queue',
	pageTemplate: 'omnichannelQueue',
}, null, load);
