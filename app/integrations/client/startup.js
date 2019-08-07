import { AdminBox } from '../../ui-utils';
import { hasAtLeastOnePermission } from '../../authorization';

AdminBox.addOption({
	href: 'admin-integrations',
	i18nLabel: 'Integrations',
	icon: 'code',
	permissionGranted: () => hasAtLeastOnePermission(['manage-integrations', 'manage-own-integrations']),
});
