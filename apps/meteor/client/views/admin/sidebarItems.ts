import { hasPermission, hasAtLeastOnePermission, hasAllPermission } from '../../../app/authorization/client';
import { createSidebarItems } from '../../lib/createSidebarItems';

export const {
	registerSidebarItem: registerAdminSidebarItem,
	unregisterSidebarItem,
	getSidebarItems: getAdminSidebarItems,
	subscribeToSidebarItems: subscribeToAdminSidebarItems,
} = createSidebarItems([
	{
		href: '/admin/info',
		i18nLabel: 'Info',
		icon: 'info-circled',
		permissionGranted: (): boolean => hasPermission('view-statistics'),
	},
	{
		icon: 'shield-alt',
		href: '/admin/moderation-console',
		i18nLabel: 'Moderation console',
		tag: 'Beta',
		permissionGranted: (): boolean => hasPermission('view-moderation-console'),
	},
	{
		href: '/admin/import',
		i18nLabel: 'Import',
		icon: 'import',
		permissionGranted: (): boolean => hasPermission('run-import'),
	},
	{
		href: '/admin/users',
		i18nLabel: 'Users',
		icon: 'team',
		permissionGranted: (): boolean => hasPermission('view-user-administration'),
	},
	{
		href: '/admin/rooms',
		i18nLabel: 'Rooms',
		icon: 'hashtag',
		permissionGranted: (): boolean => hasPermission('view-room-administration'),
	},
	{
		href: '/admin/invites',
		i18nLabel: 'Invites',
		icon: 'user-plus',
		permissionGranted: (): boolean => hasPermission('create-invite-links'),
	},
	{
		href: '/admin/cloud',
		icon: 'cloud-plus',
		i18nLabel: 'Registration',
		permissionGranted: (): boolean => hasPermission('manage-cloud'),
	},
	{
		href: '/admin/view-logs',
		i18nLabel: 'View_Logs',
		icon: 'post',
		permissionGranted: (): boolean => hasPermission('view-logs'),
	},
	{
		href: '/admin/custom-sounds',
		i18nLabel: 'Custom_Sounds',
		icon: 'volume',
		permissionGranted: (): boolean => hasPermission('manage-sounds'),
	},
	{
		href: '/admin/federation-dashboard',
		icon: 'discover',
		i18nLabel: 'Federation Dashboard',
		permissionGranted: (): boolean => hasPermission('view-federation-data'),
	},
	{
		href: '/admin/email-inboxes',
		icon: 'mail',
		i18nLabel: 'Email_Inboxes',
		tag: 'Alpha',
		permissionGranted: (): boolean => hasPermission('manage-email-inbox'),
	},
	{
		href: '/admin/emoji-custom',
		icon: 'emoji',
		i18nLabel: 'Custom_Emoji',
		permissionGranted: (): boolean => hasPermission('manage-emoji'),
	},
	{
		href: '/admin/integrations',
		icon: 'code',
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
		href: '/admin/oauth-apps',
		icon: 'discover',
		i18nLabel: 'OAuth Apps',
		permissionGranted: (): boolean => hasAllPermission('manage-oauth-apps'),
	},
	{
		href: '/admin/mailer',
		icon: 'mail',
		i18nLabel: 'Mailer',
		permissionGranted: (): boolean => hasAllPermission('access-mailer'),
	},
	{
		href: '/admin/user-status',
		icon: 'user',
		i18nLabel: 'User_Status',
		permissionGranted: (): boolean => hasAtLeastOnePermission(['manage-user-status']),
	},
	{
		href: '/admin/permissions',
		icon: 'lock',
		i18nLabel: 'Permissions',
		permissionGranted: (): boolean => hasAtLeastOnePermission(['access-permissions', 'access-setting-permissions']),
	},
	{
		href: '/admin/settings',
		icon: 'customize',
		i18nLabel: 'Settings',
		permissionGranted: (): boolean =>
			hasAtLeastOnePermission(['view-privileged-setting', 'edit-privileged-setting', 'manage-selected-settings']),
	},
]);
