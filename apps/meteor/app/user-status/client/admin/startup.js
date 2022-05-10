import { hasAtLeastOnePermission } from '../../../authorization';
import { registerAdminSidebarItem } from '../../../../client/views/admin';

registerAdminSidebarItem({
	href: 'custom-user-status',
	i18nLabel: 'Custom_User_Status',
	icon: 'user',
	permissionGranted() {
		return hasAtLeastOnePermission(['manage-user-status']);
	},
});
