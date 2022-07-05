import { hasPermission } from '../../../app/authorization/client';
import { createSidebarItems } from '../../lib/createSidebarItems';

export const {
	registerSidebarItem: registerOmnichannelSidebarItem,
	unregisterSidebarItem,
	getSidebarItems: getOmnichannelSidebarItems,
	subscribeToSidebarItems: subscribeToOmnichannelSidebarItems,
} = createSidebarItems([
	{
		href: 'omnichannel/current',
		i18nLabel: 'Current_Chats',
		permissionGranted: (): boolean => hasPermission('view-livechat-current-chats'),
	},
	{
		href: 'omnichannel-analytics',
		i18nLabel: 'Analytics',
		permissionGranted: (): boolean => hasPermission('view-livechat-analytics'),
	},
	{
		href: 'omnichannel-realTime',
		i18nLabel: 'Real_Time_Monitoring',
		permissionGranted: (): boolean => hasPermission('view-livechat-real-time-monitoring'),
	},
	{
		href: 'omnichannel/managers',
		i18nLabel: 'Managers',
		permissionGranted: (): boolean => hasPermission('manage-livechat-managers'),
	},
	{
		href: 'omnichannel/agents',
		i18nLabel: 'Agents',
		permissionGranted: (): boolean => hasPermission('manage-livechat-agents'),
	},
	{
		href: 'omnichannel/departments',
		i18nLabel: 'Departments',
		permissionGranted: (): boolean => hasPermission('view-livechat-departments'),
	},
	{
		href: 'omnichannel-customfields',
		i18nLabel: 'Custom_Fields',
		permissionGranted: (): boolean => hasPermission('view-livechat-customfields'),
	},
	{
		href: 'omnichannel-triggers',
		i18nLabel: 'Livechat_Triggers',
		permissionGranted: (): boolean => hasPermission('view-livechat-triggers'),
	},
	{
		href: 'omnichannel-installation',
		i18nLabel: 'Livechat_Installation',
		permissionGranted: (): boolean => hasPermission('view-livechat-installation'),
	},
	{
		href: 'omnichannel-appearance',
		i18nLabel: 'Livechat_Appearance',
		permissionGranted: (): boolean => hasPermission('view-livechat-appearance'),
	},
	{
		href: 'omnichannel-webhooks',
		i18nLabel: 'Webhooks',
		permissionGranted: (): boolean => hasPermission('view-livechat-webhooks'),
	},
	{
		href: 'omnichannel-facebook',
		i18nLabel: 'Facebook Messenger',
		permissionGranted: (): boolean => hasPermission('view-livechat-facebook'),
	},
	{
		href: 'omnichannel-businessHours',
		i18nLabel: 'Business_Hours',
		permissionGranted: (): boolean => hasPermission('view-livechat-business-hours'),
	},
]);
