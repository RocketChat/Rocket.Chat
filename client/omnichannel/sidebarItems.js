import { Meteor } from 'meteor/meteor';

import { hasPermission, hasRole } from '../../app/authorization/client';
import { createSidebarItems } from '../components/basic/Sidebar';

export const {
	registerSidebarItem: registerAdminSidebarItem,
	unregisterSidebarItem,
	itemsSubscription,
} = createSidebarItems([
	{
		href: 'omnichannel/current',
		pathGroup: 'current',
		i18nLabel: 'Current_Chats',
		icon: 'info-circled',
		permissionGranted: () => hasPermission('view-livechat-current-chats'),
	}, {
		href: 'omnichannel/analytics',
		pathGroup: 'analytics',
		i18nLabel: 'Analytics',
		icon: 'import',
		permissionGranted: () => hasPermission('view-livechat-analytics'),
	}, {
		href: 'omnichannel/real-time-monitoring',
		i18nLabel: 'Real_Time_Monitoring',
		icon: 'team',
		permissionGranted: () => hasPermission('view-livechat-real-time-monitoring'),
	}, {
		href: 'omnichannel/managers',
		i18nLabel: 'Managers',
		icon: 'hashtag',
		permissionGranted: () => hasPermission('manage-livechat-managers'),
	}, {
		href: 'omnichannel/agents',
		i18nLabel: 'Agents',
		icon: 'user-plus',
		permissionGranted: () => hasPermission('manage-livechat-agents'),
	}, {
		href: 'omnichannel/departments',
		i18nLabel: 'Departments',
		icon: 'cloud-plus',
		permissionGranted: () => hasPermission('view-livechat-departments'),
	}, {
		href: 'omnichannel/customfields',
		i18nLabel: 'Custom_Fields',
		icon: 'post',
		permissionGranted: () => hasPermission('view-livechat-customfields'),
	}, {
		href: 'omnichannel/triggers',
		i18nLabel: 'Livechat_Triggers',
		icon: 'volume',
		permissionGranted: () => hasPermission('view-livechat-triggers'),
	}, {
		href: 'omnichannel/installation',
		i18nLabel: 'Livechat_Installation',
		icon: 'discover',
		permissionGranted: () => hasPermission('view-livechat-installation'),
	}, {
		href: 'omnichannel/appearance',
		i18nLabel: 'Livechat_Appearance',
		icon: 'cube',
		permissionGranted: () => hasPermission('view-livechat-appearance'),
	}, {
		href: 'omnichannel/webhooks',
		i18nLabel: 'Webhooks',
		icon: 'cube',
		permissionGranted: () => hasPermission('view-livechat-webhooks'),
	}, {
		href: 'omnichannel/facebook',
		i18nLabel: 'Facebook Messenger',
		icon: 'cube',
		permissionGranted: () => hasPermission('view-livechat-facebook'),
	}, {
		href: 'omnichannel/businessHours',
		i18nLabel: 'Business_Hours',
		icon: 'cube',
		permissionGranted: () => hasPermission('view-livechat-business-hours'),
	},
]);
