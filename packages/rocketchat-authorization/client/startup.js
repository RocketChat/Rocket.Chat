import { Meteor } from 'meteor/meteor';
import { CachedCollectionManager } from 'meteor/rocketchat:ui-cached-collection';
import { hasAllPermission } from './hasPermission';

Meteor.startup(async() => {
	const { AdminBox } = await import('meteor/rocketchat:ui-utils');

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
