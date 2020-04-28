import { hasAtLeastOnePermission } from '../../../authorization';
import { registerAdminSidebarItem } from '../../../ui-admin/client';

registerAdminSidebarItem({
	href: 'invites',
	i18nLabel: 'Invites',
	icon: 'user-plus',
	permissionGranted() {
		return hasAtLeastOnePermission(['create-invite-links']);
	},
});
