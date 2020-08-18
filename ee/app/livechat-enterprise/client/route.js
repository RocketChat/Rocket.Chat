import { AccountBox } from '../../../../app/ui-utils';
import { livechatManagerRoutes, load } from '../../../../app/livechat/client/route';

AccountBox.addRoute({
	name: 'livechat-monitors',
	path: '/monitors',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Livechat_Monitors',
	pageTemplate: 'livechatMonitors',
}, livechatManagerRoutes);


AccountBox.addRoute({
	name: 'livechat-units',
	path: '/units',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Units',
	pageTemplate: 'livechatUnits',
}, livechatManagerRoutes);

AccountBox.addRoute({
	name: 'livechat-unit-edit',
	path: '/units/:_id/edit',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Edit_Unit',
	pageTemplate: 'livechatUnitForm',
}, livechatManagerRoutes);

AccountBox.addRoute({
	name: 'livechat-unit-new',
	path: '/units/new',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'New_Unit',
	pageTemplate: 'livechatUnitForm',
}, livechatManagerRoutes);

AccountBox.addRoute({
	name: 'livechat-tags',
	path: '/tags',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Tags',
	pageTemplate: 'livechatTags',
}, livechatManagerRoutes);

AccountBox.addRoute({
	name: 'livechat-tag-edit',
	path: '/tags/:_id/edit',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Edit_Tag',
	pageTemplate: 'livechatTagForm',
}, livechatManagerRoutes);

AccountBox.addRoute({
	name: 'livechat-tag-new',
	path: '/tags/new',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'New_Tag',
	pageTemplate: 'livechatTagForm',
}, livechatManagerRoutes);

// AccountBox.addRoute({
// 	name: 'livechat-priorities',
// 	path: '/priorities',
// 	sideNav: 'omnichannelFlex',
// 	i18nPageTitle: 'Priorities',
// 	pageTemplate: 'livechatPriorities',
// }, livechatManagerRoutes);

AccountBox.addRoute({
	name: 'livechat-priority-edit',
	path: '/priorities/:_id/edit',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Edit_Priority',
	pageTemplate: 'livechatPriorityForm',
}, livechatManagerRoutes);

AccountBox.addRoute({
	name: 'livechat-priority-new',
	path: '/priorities/new',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'New_Priority',
	pageTemplate: 'livechatPriorityForm',
}, livechatManagerRoutes);

AccountBox.addRoute({
	name: 'livechat-business-hour-edit',
	path: '/business-hours/:_id/:type/edit',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'Edit_Business_Hour',
	pageTemplate: 'livechatBusinessHoursForm',
}, livechatManagerRoutes, load);

AccountBox.addRoute({
	name: 'livechat-business-hour-new',
	path: '/business-hours/new',
	sideNav: 'omnichannelFlex',
	i18nPageTitle: 'New_Business_Hour',
	pageTemplate: 'livechatBusinessHoursForm',
}, livechatManagerRoutes, load);
