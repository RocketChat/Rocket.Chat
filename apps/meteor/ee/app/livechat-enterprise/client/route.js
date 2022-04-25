import { AccountBox } from '../../../../app/ui-utils';
import { livechatManagerRoutes, load } from '../../../../app/livechat/client/route';

AccountBox.addRoute(
	{
		name: 'livechat-tag-edit',
		path: '/tags/:_id/edit',
		sideNav: 'omnichannelFlex',
		i18nPageTitle: 'Edit_Tag',
		pageTemplate: 'livechatTagForm',
	},
	livechatManagerRoutes,
);

AccountBox.addRoute(
	{
		name: 'livechat-tag-new',
		path: '/tags/new',
		sideNav: 'omnichannelFlex',
		i18nPageTitle: 'New_Tag',
		pageTemplate: 'livechatTagForm',
	},
	livechatManagerRoutes,
);

AccountBox.addRoute(
	{
		name: 'livechat-priority-edit',
		path: '/priorities/:_id/edit',
		sideNav: 'omnichannelFlex',
		i18nPageTitle: 'Edit_Priority',
		pageTemplate: 'livechatPriorityForm',
	},
	livechatManagerRoutes,
);

AccountBox.addRoute(
	{
		name: 'livechat-priority-new',
		path: '/priorities/new',
		sideNav: 'omnichannelFlex',
		i18nPageTitle: 'New_Priority',
		pageTemplate: 'livechatPriorityForm',
	},
	livechatManagerRoutes,
);

AccountBox.addRoute(
	{
		name: 'livechat-business-hour-edit',
		path: '/business-hours/:_id/:type/edit',
		sideNav: 'omnichannelFlex',
		i18nPageTitle: 'Edit_Business_Hour',
		pageTemplate: 'livechatBusinessHoursForm',
	},
	livechatManagerRoutes,
	load,
);

AccountBox.addRoute(
	{
		name: 'livechat-business-hour-new',
		path: '/business-hours/new',
		sideNav: 'omnichannelFlex',
		i18nPageTitle: 'New_Business_Hour',
		pageTemplate: 'livechatBusinessHoursForm',
	},
	livechatManagerRoutes,
	load,
);
