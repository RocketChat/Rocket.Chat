import { Meteor } from 'meteor/meteor';
import { CachedCollectionManager } from '../../ui-cached-collection';
import { hasAllPermission } from './hasPermission';
import { AdminBox } from '../../ui-utils/client/lib/AdminBox';

Meteor.startup(() => {
	CachedCollectionManager.onLogin(() => Meteor.subscribe('roles'));

	AdminBox.addOption({
		href: 'admin-permissions',
		i18nLabel: 'Permissions',
		icon: 'lock',
		permissionGranted() {
			return hasAllPermission('access-permissions');
		},
	});
});
