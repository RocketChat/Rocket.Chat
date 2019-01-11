import { Meteor } from 'meteor/meteor';
import { AdminBox } from 'meteor/rocketchat:ui-utils';
import { CachedCollectionManager } from 'meteor/rocketchat:models';
import { hasAllPermission } from './hasPermission';

CachedCollectionManager.onLogin(() => Meteor.subscribe('roles'));

AdminBox.addOption({
	href: 'admin-permissions',
	i18nLabel: 'Permissions',
	icon: 'lock',
	permissionGranted() {
		return hasAllPermission('access-permissions');
	},
});
