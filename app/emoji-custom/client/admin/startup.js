import { registerAdminSidebarItem } from '../../../../client/views/admin';
import { hasPermission } from '../../../authorization';

registerAdminSidebarItem({
	href: 'emoji-custom',
	i18nLabel: 'Custom_Emoji',
	icon: 'emoji',
	permissionGranted() {
		return hasPermission('manage-emoji');
	},
});
