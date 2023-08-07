import { hasPermission } from '../../../app/authorization/client';
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
		permissionGranted: (): boolean => hasPermission('view-livechat-current-chats'),
	},
	{
		href: '/omnichannel/reports',
		icon: 'file',
		i18nLabel: 'Reports',
		// TODO: Define necessary permissions
		// permissionGranted: (): boolean => hasPermission('?'),
	},
	{
		href: '/omnichannel/analytics',
		icon: 'dashboard',
		i18nLabel: 'Analytics',
		permissionGranted: (): boolean => hasPermission('view-livechat-analytics'),
	},
	{
		href: '/omnichannel/realtime-monitoring',
		icon: 'live',
		i18nLabel: 'Real_Time_Monitoring',
		permissionGranted: (): boolean => hasPermission('view-livechat-real-time-monitoring'),
	},
	{
		href: '/omnichannel/managers',
		icon: 'shield',
		i18nLabel: 'Managers',
		permissionGranted: (): boolean => hasPermission('manage-livechat-managers'),
	},
	{
		href: '/omnichannel/agents',
		icon: 'headset',
		i18nLabel: 'Agents',
		permissionGranted: (): boolean => hasPermission('manage-livechat-agents'),
	},
	{
		href: '/omnichannel/departments',
		icon: 'folder',
		i18nLabel: 'Departments',
		permissionGranted: (): boolean => hasPermission('view-livechat-departments'),
	},
	{
		href: '/omnichannel/customfields',
		icon: 'file-sheets',
		i18nLabel: 'Custom_Fields',
		permissionGranted: (): boolean => hasPermission('view-livechat-customfields'),
	},
	{
		href: '/omnichannel/triggers',
		icon: 'smart',
		i18nLabel: 'Livechat_Triggers',
		permissionGranted: (): boolean => hasPermission('view-livechat-triggers'),
	},
	{
		href: '/omnichannel/installation',
		icon: 'livechat',
		i18nLabel: 'Livechat_Installation',
		permissionGranted: (): boolean => hasPermission('view-livechat-installation'),
	},
	{
		href: '/omnichannel/appearance',
		icon: 'palette',
		i18nLabel: 'Livechat_Appearance',
		permissionGranted: (): boolean => hasPermission('view-livechat-appearance'),
	},
	{
		href: '/omnichannel/webhooks',
		icon: 'code',
		i18nLabel: 'Webhooks',
		permissionGranted: (): boolean => hasPermission('view-livechat-webhooks'),
	},
	{
		href: '/omnichannel/businessHours',
		icon: 'clock',
		i18nLabel: 'Business_Hours',
		permissionGranted: (): boolean => hasPermission('view-livechat-business-hours'),
	},
]);
