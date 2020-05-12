import { hasPermission } from '../../../authorization';
import { registerAdminSidebarItem } from '../../../../client/admin';

registerAdminSidebarItem({
	href: 'emoji-custom',
	i18nLabel: 'Custom_Emoji',
	icon: 'emoji',
	permissionGranted() {
		return hasPermission('manage-emoji');
	},
});
