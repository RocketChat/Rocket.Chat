import { AdminBox } from '../../ui-utils';
import { hasAtLeastOnePermission } from '../../authorization';

AdminBox.addOption({
	href: 'admin-integrations',
	i18nLabel: 'Integrations',
	icon: 'code',
	permissionGranted: () => hasAtLeastOnePermission([
		'manage-outgoing-integrations',
		'manage-own-outgoing-integrations',
		'manage-incoming-integrations',
		'manage-own-incoming-integrations'
	]),
});
