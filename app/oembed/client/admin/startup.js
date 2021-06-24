import { hasPermission } from '../../../authorization';
import { registerAdminSidebarItem } from '../../../../client/admin';

registerAdminSidebarItem({
	href: 'oembed',
	i18nLabel: 'OEmbed',
	icon: 'permalink',
	permissionGranted() {
		return hasPermission('manage-own-incoming-integrations');
	},
});
