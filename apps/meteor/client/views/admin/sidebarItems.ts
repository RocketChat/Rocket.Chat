import { defaultFeaturesPreview } from '@rocket.chat/ui-client';

import { hasAtLeastOnePermission, hasAllPermission } from '../../../app/authorization/client';
import { hasPermission } from '../../../app/authorization/client/hasPermission';
import { createSidebarItems } from '../../lib/createSidebarItems';

export const {
	registerSidebarItem: registerAdminSidebarItem,
	unregisterSidebarItem,
	getSidebarItems: getAdminSidebarItems,
	subscribeToSidebarItems: subscribeToAdminSidebarItems,
} = createSidebarItems([
	{
		href: '/admin/info',
		i18nLabel: 'Workspace',
		icon: 'info-circled',
		permissionGranted: (): boolean => hasPermission(Meteor.user(), 'view-statistics'),
	},
	{
		href: '/admin/subscription',
		i18nLabel: 'Subscription',
		icon: 'card',
		permissionGranted: (): boolean => hasPermission(Meteor.user(), 'manage-cloud'),
	},
	{
		href: '/admin/engagement/users',
		i18nLabel: 'Engagement',
		icon: 'dashboard',
		permissionGranted: (): boolean => hasPermission(Meteor.user(), 'view-engagement-dashboard'),
	},
	{
		href: '/admin/moderation',
		i18nLabel: 'Moderation',
		icon: 'shield-alt',
		tag: 'Beta',
		permissionGranted: (): boolean => hasPermission(Meteor.user(), 'view-moderation-console'),
	},
	{
		href: '/admin/federation',
		i18nLabel: 'Federation',
		icon: 'discover',
		permissionGranted: (): boolean => hasPermission(Meteor.user(), 'view-federation-data'),
	},
	{
		href: '/admin/rooms',
		i18nLabel: 'Rooms',
		icon: 'hashtag',
		permissionGranted: (): boolean => hasPermission(Meteor.user(), 'view-room-administration'),
	},
	{
		href: '/admin/users',
		i18nLabel: 'Users',
		icon: 'team',
		permissionGranted: (): boolean => hasPermission(Meteor.user(), 'view-user-administration'),
	},
	{
		href: '/admin/invites',
		i18nLabel: 'Invites',
		icon: 'user-plus',
		permissionGranted: (): boolean => hasPermission(Meteor.user(), 'create-invite-links'),
	},
	{
		href: '/admin/user-status',
		i18nLabel: 'User_Status',
		icon: 'user',
		permissionGranted: (): boolean => hasAtLeastOnePermission(Meteor.user(), ['manage-user-status']),
	},
	{
		href: '/admin/permissions',
		i18nLabel: 'Permissions',
		icon: 'user-lock',
		permissionGranted: (): boolean => hasAtLeastOnePermission(Meteor.user(), ['access-permissions', 'access-setting-permissions']),
	},
	{
		href: '/admin/device-management',
		i18nLabel: 'Device_Management',
		icon: 'mobile',
		permissionGranted: (): boolean => hasPermission(Meteor.user(), 'view-device-management'),
	},
	{
		href: '/admin/email-inboxes',
		i18nLabel: 'Email_Inboxes',
		icon: 'mail',
		tag: 'Alpha',
		permissionGranted: (): boolean => hasPermission(Meteor.user(), 'manage-email-inbox'),
	},
	{
		href: '/admin/mailer',
		icon: 'mail',
		i18nLabel: 'Mailer',
		permissionGranted: (): boolean => hasAllPermission(Meteor.user(), 'access-mailer'),
	},
	{
		href: '/admin/third-party-login',
		i18nLabel: 'Third_party_login',
		icon: 'login',
		permissionGranted: (): boolean => hasAllPermission(Meteor.user(), 'manage-oauth-apps'),
	},
	{
		href: '/admin/integrations',
		i18nLabel: 'Integrations',
		icon: 'code',
		permissionGranted: (): boolean =>
			hasAtLeastOnePermission(Meteor.user(), [
				'manage-outgoing-integrations',
				'manage-own-outgoing-integrations',
				'manage-incoming-integrations',
				'manage-own-incoming-integrations',
			]),
	},
	{
		href: '/admin/import',
		i18nLabel: 'Import',
		icon: 'import',
		permissionGranted: (): boolean => hasPermission(Meteor.user(), 'run-import'),
	},
	{
		href: '/admin/reports',
		i18nLabel: 'Reports',
		icon: 'post',
		permissionGranted: (): boolean => hasPermission(Meteor.user(), 'view-logs'),
	},
	{
		href: '/admin/sounds',
		i18nLabel: 'Sounds',
		icon: 'volume',
		permissionGranted: (): boolean => hasPermission(Meteor.user(), 'manage-sounds'),
	},
	{
		href: '/admin/emoji',
		i18nLabel: 'Emoji',
		icon: 'emoji',
		permissionGranted: (): boolean => hasPermission(Meteor.user(), 'manage-emoji'),
	},
	{
		href: '/admin/feature-preview',
		i18nLabel: 'Feature_preview',
		icon: 'flask',
		permissionGranted: () => defaultFeaturesPreview?.length > 0,
	},
	{
		href: '/admin/settings',
		i18nLabel: 'Settings',
		icon: 'customize',
		permissionGranted: (): boolean =>
			hasAtLeastOnePermission(Meteor.user(), ['view-privileged-setting', 'edit-privileged-setting', 'manage-selected-settings']),
	},
]);
