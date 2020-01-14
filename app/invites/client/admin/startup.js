import { AdminBox } from '../../../ui-utils';
import { hasAtLeastOnePermission } from '../../../authorization';

AdminBox.addOption({
	href: 'invites',
	i18nLabel: 'Invites',
	icon: 'user-plus',
	permissionGranted() {
		return hasAtLeastOnePermission(['create-invite-links']);
	},
});
