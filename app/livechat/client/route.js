import { FlowRouter } from 'meteor/kadira:flow-router';

import { AccountBox } from '../../ui-utils';

export const livechatManagerRoutes = FlowRouter.group({
	prefix: '/livechat-manager',
	name: 'livechat-manager',
});

export const load = () => import('./views/admin');

AccountBox.addRoute({
	name: 'livechat-dashboard',
	path: '/dashboard',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'Livechat_Dashboard',
	pageTemplate: 'livechatDashboard',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'livechat-current-chats',
	path: '/current',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'Current_Chats',
	pageTemplate: 'livechatCurrentChats',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'livechat-analytics',
	path: '/analytics',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'Analytics',
	pageTemplate: 'livechatAnalytics',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'livechat-real-time-monitoring',
	path: '/real-time-monitoring',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'Real_Time_Monitoring',
	pageTemplate: 'livechatRealTimeMonitoring',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'livechat-managers',
	path: '/managers',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'Livechat_Managers',
	pageTemplate: 'livechatManagers',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'livechat-agents',
	path: '/agents',
	sideNav: 'livechatFlex',
	pageTemplate: 'livechatAgents',
	customContainer: true,
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'livechat-departments',
	path: '/departments',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'Departments',
	pageTemplate: 'livechatDepartments',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'livechat-department-edit',
	path: '/departments/:_id/edit',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'Edit_Department',
	pageTemplate: 'livechatDepartmentForm',
	customContainer: true,
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'livechat-department-new',
	path: '/departments/new',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'New_Department',
	pageTemplate: 'livechatDepartmentForm',
	customContainer: true,
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'livechat-triggers',
	path: '/triggers',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'Triggers',
	pageTemplate: 'livechatTriggers',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'livechat-trigger-edit',
	path: '/triggers/:_id/edit',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'Edit_Trigger',
	pageTemplate: 'livechatTriggersForm',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'livechat-trigger-new',
	path: '/triggers/new',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'New_Trigger',
	pageTemplate: 'livechatTriggersForm',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'livechat-installation',
	path: '/installation',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'Installation',
	pageTemplate: 'livechatInstallation',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'livechat-appearance',
	path: '/appearance',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'Appearance',
	pageTemplate: 'livechatAppearance',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'livechat-business-hours',
	path: '/businessHours',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'Business_Hours',
	pageTemplate: 'livechatMainBusinessHours',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'livechat-customfields',
	path: '/customfields',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'Custom_Fields',
	pageTemplate: 'livechatCustomFields',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'livechat-customfield-edit',
	path: '/customfields/:_id/edit',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'Edit_Custom_Field',
	pageTemplate: 'livechatCustomFieldForm',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'livechat-customfield-new',
	path: '/customfields/new',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'New_Custom_Field',
	pageTemplate: 'livechatCustomFieldForm',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'livechat-webhooks',
	path: '/webhooks',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'Webhooks',
	pageTemplate: 'livechatIntegrationWebhook',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'livechat-facebook',
	path: '/facebook',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'Facebook Messenger',
	pageTemplate: 'livechatIntegrationFacebook',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'livechat-queue',
	path: '/livechat-queue',
	i18nPageTitle: 'Livechat_Queue',
	pageTemplate: 'livechatQueue',
}, null, load);
