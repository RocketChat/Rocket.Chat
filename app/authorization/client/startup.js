import { Meteor } from 'meteor/meteor';
import { CachedCollectionManager } from '../../ui-cached-collection';
import { hasAtLeastOnePermission } from './hasPermission';
import { AdminBox } from '../../ui-utils/client';

Meteor.startup(() => {

	CachedCollectionManager.onLogin(() => Meteor.subscribe('roles'));

	AdminBox.addOption({
		href: 'admin-permissions',
		i18nLabel: 'Permissions',
		icon: 'lock',
		permissionGranted() {
			return hasAtLeastOnePermission(['access-permissions', 'access-setting-permissions']);
		},
	});
});
