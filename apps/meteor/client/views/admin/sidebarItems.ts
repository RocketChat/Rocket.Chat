import { hasPermission, hasAtLeastOnePermission, hasAllPermission } from '../../../app/authorization/client';
import { createSidebarItems } from '../../lib/createSidebarItems';

export const {
	registerSidebarItem: registerAdminSidebarItem,
	unregisterSidebarItem,
	getSidebarItems: getAdminSidebarItems,
	subscribeToSidebarItems: subscribeToAdminSidebarItems,
} = createSidebarItems([
	{
		href: 'admin-info',
		i18nLabel: 'Workspace',
		icon: 'info-circled',
		permissionGranted: (): boolean => hasPermission('view-statistics'),
	},
	{
		icon: 'cloud-plus',
		href: 'cloud',
		i18nLabel: 'Registration',
		permissionGranted: (): boolean => hasPermission('manage-cloud'),
	},
	{
		icon: 'shield-alt',
		href: 'moderation-console',
		i18nLabel: 'Moderation',
		tag: 'Beta',
		permissionGranted: (): boolean => hasPermission('view-moderation-console'),
	},
	{
		icon: 'discover',
		href: 'federation-dashboard',
		i18nLabel: 'Federation',
		permissionGranted: (): boolean => hasPermission('view-federation-data'),
	},
	{
		href: 'admin-rooms',
		i18nLabel: 'Rooms',
		icon: 'hashtag',
		permissionGranted: (): boolean => hasPermission('view-room-administration'),
	},
	{
		href: 'admin-users',
		i18nLabel: 'Users',
		icon: 'team',
		permissionGranted: (): boolean => hasPermission('view-user-administration'),
	},
	{
		href: 'invites',
		i18nLabel: 'Invites',
		icon: 'user-plus',
		permissionGranted: (): boolean => hasPermission('create-invite-links'),
	},
	{
		icon: 'user',
		href: 'user-status',
		i18nLabel: 'User_Status',
		permissionGranted: (): boolean => hasAtLeastOnePermission(['manage-user-status']),
	},
	{
		icon: 'user-lock',
		href: 'admin-permissions',
		i18nLabel: 'Permissions',
		permissionGranted: (): boolean => hasAtLeastOnePermission(['access-permissions', 'access-setting-permissions']),
	},
	{
		icon: 'mail',
		href: 'admin-email-inboxes',
		i18nLabel: 'Email_Inboxes',
		tag: 'Alpha',
		permissionGranted: (): boolean => hasPermission('manage-email-inbox'),
	},
	{
		icon: 'mail',
		href: 'admin-mailer',
		i18nLabel: 'Mailer',
		permissionGranted: (): boolean => hasAllPermission('access-mailer'),
	},
	{
		icon: 'login',
		href: 'admin-oauth-apps',
		i18nLabel: 'Third_party_login',
		permissionGranted: (): boolean => hasAllPermission('manage-oauth-apps'),
	},
	{
		icon: 'code',
		href: 'admin-integrations',
		i18nLabel: 'Integrations',
		permissionGranted: (): boolean =>
			hasAtLeastOnePermission([
				'manage-outgoing-integrations',
				'manage-own-outgoing-integrations',
				'manage-incoming-integrations',
				'manage-own-incoming-integrations',
			]),
	},
	{
		href: 'admin-import',
		i18nLabel: 'Import',
		icon: 'import',
		permissionGranted: (): boolean => hasPermission('run-import'),
	},
	{
		href: 'admin-view-logs',
		i18nLabel: 'Logs',
		icon: 'post',
		permissionGranted: (): boolean => hasPermission('view-logs'),
	},
	{
		href: 'custom-sounds',
		i18nLabel: 'Sounds',
		icon: 'volume',
		permissionGranted: (): boolean => hasPermission('manage-sounds'),
	},
	{
		icon: 'emoji',
		href: 'emoji-custom',
		i18nLabel: 'Emoji',
		permissionGranted: (): boolean => hasPermission('manage-emoji'),
	},
	{
		icon: 'customize',
		href: 'admin-settings',
		i18nLabel: 'Settings',
		permissionGranted: (): boolean =>
			hasAtLeastOnePermission(['view-privileged-setting', 'edit-privileged-setting', 'manage-selected-settings']),
	},
]);
