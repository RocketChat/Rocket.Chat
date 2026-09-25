import { registerOmnichannelSidebarItem, unregisterSidebarItem } from '../../../views/omnichannel/sidebarItems';
import { hasPermission, hasAtLeastOnePermission } from '../../authorization';
import type { Item } from '../../createSidebarItems';

const items: Item[] = [
	{
		href: '/omnichannel/reports',
		icon: 'file',
		i18nLabel: 'Reports',
		permissionGranted: (): boolean => hasPermission('view-livechat-reports'),
	},
	{
		href: '/omnichannel/monitors',
		icon: 'shield-blank',
		i18nLabel: 'Livechat_Monitors',
		permissionGranted: () => hasPermission('manage-livechat-monitors'),
	},
	{
		href: '/omnichannel/units',
		icon: 'business',
		i18nLabel: 'Units',
		permissionGranted: () => hasPermission('manage-livechat-units'),
	},
	{
		href: '/omnichannel/canned-responses',
		icon: 'canned-response',
		i18nLabel: 'Canned_Responses',
		permissionGranted: () => hasPermission('manage-livechat-canned-responses'),
	},
	{
		href: '/omnichannel/tags',
		icon: 'tag',
		i18nLabel: 'Tags',
		permissionGranted: () => hasPermission('manage-livechat-tags'),
	},
	{
		href: '/omnichannel/sla-policies',
		icon: 'flag',
		i18nLabel: 'SLA_Policies',
		permissionGranted: () => hasAtLeastOnePermission('manage-livechat-sla'),
	},
	{
		href: '/omnichannel/priorities',
		icon: 'chevron-double-up',
		i18nLabel: 'Priorities',
		permissionGranted: () => hasAtLeastOnePermission('manage-livechat-priorities'),
	},
];

export const registerLivechatEnterpriseSidebarItems = (): void => {
	items.forEach((item) => registerOmnichannelSidebarItem(item));
};

export const unregisterLivechatEnterpriseSidebarItems = (): void => {
	items.forEach(({ i18nLabel }) => unregisterSidebarItem(i18nLabel));
};
