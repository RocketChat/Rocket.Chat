import { Meteor } from 'meteor/meteor';

import { hasAtLeastOnePermission } from './hasPermission';
import { CachedCollectionManager } from '../../ui-cached-collection';
import { AdminBox } from '../../ui-utils/client/lib/AdminBox';

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
