import { AdminBox } from '/app/ui-utils';
import { hasAtLeastOnePermission } from '/app/authorization';

AdminBox.addOption({
	href: 'admin-integrations',
	i18nLabel: 'Integrations',
	icon: 'code',
	permissionGranted: () => hasAtLeastOnePermission(['manage-integrations', 'manage-own-integrations']),
});
