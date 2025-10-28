import { registerOmnichannelSidebarItem } from '../../../../client/views/omnichannel/sidebarItems';
import { hasPermission, hasAtLeastOnePermission } from '../../../authorization/client';

registerOmnichannelSidebarItem({
	href: '/omnichannel/reports',
	icon: 'file',
	i18nLabel: 'Reports',
	permissionGranted: (): boolean => hasPermission('view-livechat-reports'),
});

registerOmnichannelSidebarItem({
	href: '/omnichannel/monitors',
	icon: 'shield-blank',
	i18nLabel: 'Livechat_Monitors',
	permissionGranted: () => hasPermission('manage-livechat-monitors'),
});

registerOmnichannelSidebarItem({
	href: '/omnichannel/units',
	icon: 'business',
	i18nLabel: 'Units',
	permissionGranted: () => hasPermission('manage-livechat-units'),
});

registerOmnichannelSidebarItem({
	href: '/omnichannel/canned-responses',
	icon: 'canned-response',
	i18nLabel: 'Canned_Responses',
	permissionGranted: () => hasPermission('manage-livechat-canned-responses'),
});

registerOmnichannelSidebarItem({
	href: '/omnichannel/tags',
	icon: 'tag',
	i18nLabel: 'Tags',
	permissionGranted: () => hasPermission('manage-livechat-tags'),
});

registerOmnichannelSidebarItem({
	href: '/omnichannel/sla-policies',
	icon: 'flag',
	i18nLabel: 'SLA_Policies',
	permissionGranted: () => hasAtLeastOnePermission('manage-livechat-sla'),
});

registerOmnichannelSidebarItem({
	href: '/omnichannel/priorities',
	icon: 'chevron-double-up',
	i18nLabel: 'Priorities',
	permissionGranted: () => hasAtLeastOnePermission('manage-livechat-priorities'),
});
