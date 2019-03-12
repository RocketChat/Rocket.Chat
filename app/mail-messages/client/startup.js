import { AdminBox } from '/app/ui-utils';
import { hasAllPermission } from '/app/authorization';

AdminBox.addOption({
	href: 'mailer',
	i18nLabel: 'Mailer',
	icon: 'mail',
	permissionGranted() {
		return hasAllPermission('access-mailer');
	},
});
