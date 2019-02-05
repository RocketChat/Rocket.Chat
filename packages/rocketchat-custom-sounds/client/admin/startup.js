import { AdminBox } from 'meteor/rocketchat:ui-utils';
import { hasAtLeastOnePermission } from 'meteor/rocketchat:authorization';

AdminBox.addOption({
	href: 'custom-sounds',
	i18nLabel: 'Custom_Sounds',
	icon: 'volume',
	permissionGranted() {
		return hasAtLeastOnePermission(['manage-sounds']);
	},
});
