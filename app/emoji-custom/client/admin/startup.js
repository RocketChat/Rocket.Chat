import { AdminBox } from '../../../ui-utils';
import { hasPermission } from '../../../authorization';

AdminBox.addOption({
	href: 'emoji-custom',
	i18nLabel: 'Custom_Emoji',
	icon: 'emoji',
	permissionGranted() {
		return hasPermission('manage-emoji');
	},
});
