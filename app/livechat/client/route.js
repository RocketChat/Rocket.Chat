import { FlowRouter } from 'meteor/kadira:flow-router';

import { AccountBox } from '../../ui-utils';
import '../../../client/omnichannel/routes';

export const livechatManagerRoutes = FlowRouter.group({
	prefix: '/omnichannel',
	name: 'omnichannel',
});

export const load = () => import('./views/admin');

AccountBox.addRoute({
	name: 'livechat-dashboard',
	path: '/dashboard',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Livechat_Dashboard',
	pageTemplate: 'livechatDashboard',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'livechat-current-chats',
	path: '/current',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Current_Chats',
	pageTemplate: 'livechatCurrentChats',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'livechat-analytics',
	path: '/analytics',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Analytics',
	pageTemplate: 'livechatAnalytics',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'livechat-real-time-monitoring',
	path: '/real-time-monitoring',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Real_Time_Monitoring',
	pageTemplate: 'livechatRealTimeMonitoring',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'livechat-managers',
	path: '/managers',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Livechat_Managers',
	pageTemplate: 'livechatManagers',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'livechat-agents',
	path: '/agents',
	sideNav: 'omnichannelFlex',
	pageTemplate: 'livechatAgents',
	customContainer: true,
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'livechat-departments',
	path: '/departments',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Departments',
	pageTemplate: 'livechatDepartments',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'livechat-department-edit',
	path: '/departments/:_id/edit',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Edit_Department',
	pageTemplate: 'livechatDepartmentForm',
	customContainer: true,
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'livechat-department-new',
	path: '/departments/new',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'New_Department',
	pageTemplate: 'livechatDepartmentForm',
	customContainer: true,
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'livechat-triggers',
	path: '/triggers',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Triggers',
	pageTemplate: 'livechatTriggers',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'livechat-trigger-edit',
	path: '/triggers/:_id/edit',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Edit_Trigger',
	pageTemplate: 'livechatTriggersForm',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'livechat-trigger-new',
	path: '/triggers/new',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'New_Trigger',
	pageTemplate: 'livechatTriggersForm',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'livechat-business-hours',
	path: '/businessHours',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Business_Hours',
	pageTemplate: 'livechatMainBusinessHours',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'livechat-facebook',
	path: '/facebook',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Facebook Messenger',
	pageTemplate: 'livechatIntegrationFacebook',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'livechat-queue',
	path: '/livechat-queue',
	i18nPageTitle: 'Livechat_Queue',
	pageTemplate: 'livechatQueue',
}, null, load);
