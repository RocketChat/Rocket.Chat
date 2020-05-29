import { AccountBox } from '../../../../app/ui-utils';
import { livechatManagerRoutes } from '../../../../app/livechat/client/route';

AccountBox.addRoute({
	name: 'livechat-monitors',
	path: '/monitors',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'Livechat_Monitors',
	pageTemplate: 'livechatMonitors',
}, livechatManagerRoutes);

AccountBox.addRoute({
	name: 'livechat-units',
	path: '/units',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'Units',
	pageTemplate: 'livechatUnits',
}, livechatManagerRoutes);

AccountBox.addRoute({
	name: 'livechat-unit-edit',
	path: '/units/:_id/edit',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'Edit_Unit',
	pageTemplate: 'livechatUnitForm',
}, livechatManagerRoutes);

AccountBox.addRoute({
	name: 'livechat-unit-new',
	path: '/units/new',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'New_Unit',
	pageTemplate: 'livechatUnitForm',
}, livechatManagerRoutes);

AccountBox.addRoute({
	name: 'livechat-tags',
	path: '/tags',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'Tags',
	pageTemplate: 'livechatTags',
}, livechatManagerRoutes);

AccountBox.addRoute({
	name: 'livechat-tag-edit',
	path: '/tags/:_id/edit',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'Edit_Tag',
	pageTemplate: 'livechatTagForm',
}, livechatManagerRoutes);

AccountBox.addRoute({
	name: 'livechat-tag-new',
	path: '/tags/new',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'New_Tag',
	pageTemplate: 'livechatTagForm',
}, livechatManagerRoutes);

AccountBox.addRoute({
	name: 'livechat-priorities',
	path: '/priorities',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'Priorities',
	pageTemplate: 'livechatPriorities',
}, livechatManagerRoutes);

AccountBox.addRoute({
	name: 'livechat-priority-edit',
	path: '/priorities/:_id/edit',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'Edit_Priority',
	pageTemplate: 'livechatPriorityForm',
}, livechatManagerRoutes);

AccountBox.addRoute({
	name: 'livechat-priority-new',
	path: '/priorities/new',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'New_Priority',
	pageTemplate: 'livechatPriorityForm',
}, livechatManagerRoutes);
