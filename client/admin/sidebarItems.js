import { ReactiveVar } from 'meteor/reactive-var';

import { hasPermission } from '../../app/authorization/client';

export const sidebarItems = new ReactiveVar([]);

export const registerAdminSidebarItem = (itemOptions) => {
	sidebarItems.set([...sidebarItems.get(), itemOptions]);
};

registerAdminSidebarItem({
	href: 'admin-info',
	i18nLabel: 'Info',
	icon: 'info-circled',
});

registerAdminSidebarItem({
	href: 'admin-import',
	i18nLabel: 'Import',
	icon: 'import',
	permissionGranted: () => hasPermission('run-import'),
});

registerAdminSidebarItem({
	href: 'admin-users',
	i18nLabel: 'Users',
	icon: 'team',
	permissionGranted: () => hasPermission('view-user-administration'),
});

registerAdminSidebarItem({
	href: 'admin-rooms',
	i18nLabel: 'Rooms',
	icon: 'hashtag',
	permissionGranted: () => hasPermission('view-room-administration'),
});

registerAdminSidebarItem({
	href: 'invites',
	i18nLabel: 'Invites',
	icon: 'user-plus',
	permissionGranted: () => hasPermission('create-invite-links'),
});

registerAdminSidebarItem({
	icon: 'cloud-plus',
	href: 'cloud',
	i18nLabel: 'Connectivity_Services',
	permissionGranted: () => hasPermission('manage-cloud'),
});

registerAdminSidebarItem({
	href: 'admin-view-logs',
	i18nLabel: 'View_Logs',
	icon: 'post',
	permissionGranted: () => hasPermission('view-logs'),
});

registerAdminSidebarItem({
	href: 'custom-sounds',
	i18nLabel: 'Custom_Sounds',
	icon: 'volume',
	permissionGranted() {
		return hasPermission(['manage-sounds']);
	},
});
