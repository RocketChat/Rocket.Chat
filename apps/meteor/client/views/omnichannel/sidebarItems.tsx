import { hasAtLeastOnePermission } from '../../../app/authorization/client';
import { hasPermission } from '../../../app/authorization/client/hasPermission';
import { createSidebarItems } from '../../lib/createSidebarItems';

export const {
	registerSidebarItem: registerOmnichannelSidebarItem,
	unregisterSidebarItem,
	getSidebarItems: getOmnichannelSidebarItems,
	subscribeToSidebarItems: subscribeToOmnichannelSidebarItems,
} = createSidebarItems([
	{
		href: '/omnichannel/current',
		icon: 'message',
		i18nLabel: 'Current_Chats',
		permissionGranted: (): boolean => hasPermission(Meteor.user(), 'view-livechat-current-chats'),
	},
	{
		href: '/omnichannel/analytics',
		icon: 'dashboard',
		i18nLabel: 'Analytics',
		permissionGranted: (): boolean => hasPermission(Meteor.user(), 'view-livechat-analytics'),
	},
	{
		href: '/omnichannel/realtime-monitoring',
		icon: 'live',
		i18nLabel: 'Real_Time_Monitoring',
		permissionGranted: (): boolean => hasPermission(Meteor.user(), 'view-livechat-real-time-monitoring'),
	},
	{
		href: '/omnichannel/managers',
		icon: 'shield',
		i18nLabel: 'Managers',
		permissionGranted: (): boolean => hasPermission(Meteor.user(), 'manage-livechat-managers'),
	},
	{
		href: '/omnichannel/agents',
		icon: 'headset',
		i18nLabel: 'Agents',
		permissionGranted: (): boolean => hasPermission(Meteor.user(), 'manage-livechat-agents'),
	},
	{
		href: '/omnichannel/departments',
		icon: 'folder',
		i18nLabel: 'Departments',
		permissionGranted: (): boolean => hasPermission(Meteor.user(), 'view-livechat-departments'),
	},
	{
		href: '/omnichannel/customfields',
		icon: 'file-sheets',
		i18nLabel: 'Custom_Fields',
		permissionGranted: (): boolean => hasPermission(Meteor.user(), 'view-livechat-customfields'),
	},
	{
		href: '/omnichannel/triggers',
		icon: 'smart',
		i18nLabel: 'Livechat_Triggers',
		permissionGranted: (): boolean => hasPermission(Meteor.user(), 'view-livechat-triggers'),
	},
	{
		href: '/omnichannel/installation',
		icon: 'livechat',
		i18nLabel: 'Livechat_Installation',
		permissionGranted: (): boolean => hasPermission(Meteor.user(), 'view-livechat-installation'),
	},
	{
		href: '/omnichannel/appearance',
		icon: 'palette',
		i18nLabel: 'Livechat_Appearance',
		permissionGranted: (): boolean => hasPermission(Meteor.user(), 'view-livechat-appearance'),
	},
	{
		href: '/omnichannel/webhooks',
		icon: 'code',
		i18nLabel: 'Webhooks',
		permissionGranted: (): boolean => hasPermission(Meteor.user(), 'view-livechat-webhooks'),
	},
	{
		href: '/omnichannel/businessHours',
		icon: 'clock',
		i18nLabel: 'Business_Hours',
		permissionGranted: (): boolean => hasPermission(Meteor.user(), 'view-livechat-business-hours'),
	},
	{
		href: '/omnichannel/security-privacy',
		icon: 'shield-check',
		i18nLabel: 'Security_and_privacy',
		permissionGranted: () =>
			hasAtLeastOnePermission(Meteor.user(), ['view-privileged-setting', 'edit-privileged-setting', 'manage-selected-settings']),
	},
]);
