import { registerOmnichannelSidebarItem } from '../../../../client/views/omnichannel/sidebarItems';
import { hasAtLeastOnePermission } from '../../../authorization/client';
import { hasPermission } from '../../../authorization/client/hasPermission';

registerOmnichannelSidebarItem({
	href: '/omnichannel/reports',
	icon: 'file',
	i18nLabel: 'Reports',
	permissionGranted: (): boolean => hasPermission(Meteor.user(), 'view-livechat-reports'),
});

registerOmnichannelSidebarItem({
	href: '/omnichannel/monitors',
	icon: 'shield-blank',
	i18nLabel: 'Livechat_Monitors',
	permissionGranted: () => hasPermission(Meteor.user(), 'manage-livechat-monitors'),
});

registerOmnichannelSidebarItem({
	href: '/omnichannel/units',
	icon: 'business',
	i18nLabel: 'Units',
	permissionGranted: () => hasPermission(Meteor.user(), 'manage-livechat-units'),
});

registerOmnichannelSidebarItem({
	href: '/omnichannel/canned-responses',
	icon: 'canned-response',
	i18nLabel: 'Canned_Responses',
	permissionGranted: () => hasPermission(Meteor.user(), 'manage-livechat-canned-responses'),
});

registerOmnichannelSidebarItem({
	href: '/omnichannel/tags',
	icon: 'tag',
	i18nLabel: 'Tags',
	permissionGranted: () => hasPermission(Meteor.user(), 'manage-livechat-tags'),
});

registerOmnichannelSidebarItem({
	href: '/omnichannel/sla-policies',
	icon: 'flag',
	i18nLabel: 'SLA_Policies',
	permissionGranted: () => hasAtLeastOnePermission(Meteor.user(), 'manage-livechat-sla'),
});

registerOmnichannelSidebarItem({
	href: '/omnichannel/priorities',
	icon: 'chevron-double-up',
	i18nLabel: 'Priorities',
	permissionGranted: () => hasAtLeastOnePermission(Meteor.user(), 'manage-livechat-priorities'),
});
