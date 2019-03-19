import { AdminBox } from '../../ui-utils';
import { hasAllPermission } from '../../authorization';

AdminBox.addOption({
	href: 'mailer',
	i18nLabel: 'Mailer',
	icon: 'mail',
	permissionGranted() {
		return hasAllPermission('access-mailer');
	},
});
