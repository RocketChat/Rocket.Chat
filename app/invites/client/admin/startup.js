import { AdminBox } from '../../../ui-admin/client/AdminBox';
import { hasAtLeastOnePermission } from '../../../authorization';

AdminBox.addOption({
	href: 'invites',
	i18nLabel: 'Invites',
	icon: 'user-plus',
	permissionGranted() {
		return hasAtLeastOnePermission(['create-invite-links']);
	},
});
