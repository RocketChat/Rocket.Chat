import { AdminBox } from '../../../ui-utils';
import { hasAllPermission } from '../../../authorization';

AdminBox.addOption({
	href: 'admin-mention-groups',
	i18nLabel: 'Mentions_Groups',
	icon: 'discover',
	permissionGranted() {
		return hasAllPermission('manage-mention-groups');
	},
});
