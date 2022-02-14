import { FlowRouter } from 'meteor/kadira:flow-router';

import { AccountBox } from '../../ui-utils';
import '../../../client/views/omnichannel/routes';

export const livechatManagerRoutes = FlowRouter.group({
	prefix: '/omnichannel',
	name: 'omnichannel',
});

export const load = () => import('./views/admin');

AccountBox.addRoute(
	{
		name: 'livechat-dashboard',
		path: '/dashboard',
		sideNav: 'omnichannelFlex',
		i18nPageTitle: 'Livechat_Dashboard',
		pageTemplate: 'livechatDashboard',
	},
	livechatManagerRoutes,
	load,
);

AccountBox.addRoute(
	{
		name: 'livechat-departments',
		path: '/departments',
		sideNav: 'omnichannelFlex',
		i18nPageTitle: 'Departments',
		pageTemplate: 'livechatDepartments',
	},
	livechatManagerRoutes,
	load,
);

AccountBox.addRoute(
	{
		name: 'livechat-department-edit',
		path: '/departments/:_id/edit',
		sideNav: 'omnichannelFlex',
		i18nPageTitle: 'Edit_Department',
		pageTemplate: 'livechatDepartmentForm',
		customContainer: true,
	},
	livechatManagerRoutes,
	load,
);

AccountBox.addRoute(
	{
		name: 'livechat-department-new',
		path: '/departments/new',
		sideNav: 'omnichannelFlex',
		i18nPageTitle: 'New_Department',
		pageTemplate: 'livechatDepartmentForm',
		customContainer: true,
	},
	livechatManagerRoutes,
	load,
);
