import { hasPermission } from '../../../app/authorization/client';
import { createSidebarItems } from '../../lib/createSidebarItems';

export const {
	registerSidebarItem: registerAdminSidebarItem,
	unregisterSidebarItem,
	itemsSubscription,
} = createSidebarItems([
	{
		href: 'admin-info',
		i18nLabel: 'Info',
		icon: 'info-circled',
		permissionGranted: () => hasPermission('view-statistics'),
	},
	{
		href: 'admin-import',
		i18nLabel: 'Import',
		icon: 'import',
		permissionGranted: () => hasPermission('run-import'),
	},
	{
		href: 'admin-users',
		i18nLabel: 'Users',
		icon: 'team',
		permissionGranted: () => hasPermission('view-user-administration'),
	},
	{
		href: 'admin-rooms',
		i18nLabel: 'Rooms',
		icon: 'hashtag',
		permissionGranted: () => hasPermission('view-room-administration'),
	},
	{
		href: 'invites',
		i18nLabel: 'Invites',
		icon: 'user-plus',
		permissionGranted: () => hasPermission('create-invite-links'),
	},
	{
		icon: 'cloud-plus',
		href: 'cloud',
		i18nLabel: 'Connectivity_Services',
		permissionGranted: () => hasPermission('manage-cloud'),
	},
	{
		href: 'admin-view-logs',
		i18nLabel: 'View_Logs',
		icon: 'post',
		permissionGranted: () => hasPermission('view-logs'),
	},
	{
		href: 'custom-sounds',
		i18nLabel: 'Custom_Sounds',
		icon: 'volume',
		permissionGranted: () => hasPermission('manage-sounds'),
	},
	{
		icon: 'discover',
		href: 'federation-dashboard',
		i18nLabel: 'Federation Dashboard',
		permissionGranted: () => hasPermission('view-federation-data'),
	},
	{
		icon: 'cube',
		href: 'admin-marketplace',
		i18nLabel: 'Apps',
		permissionGranted: () => hasPermission('manage-apps'),
	},
	{
		icon: 'mail',
		href: 'admin-email-inboxes',
		i18nLabel: 'Email_Inboxes',
		tag: 'Alpha',
		permissionGranted: () => hasPermission('manage-email-inbox'),
	},
]);
