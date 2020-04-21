import { hasAtLeastOnePermission } from '../../../authorization';
import { registerAdminSidebarItem } from '../../../ui-admin/client';

registerAdminSidebarItem({
	href: 'user-status-custom',
	i18nLabel: 'Custom_User_Status',
	icon: 'user',
	permissionGranted() {
		return hasAtLeastOnePermission(['manage-user-status']);
	},
});
