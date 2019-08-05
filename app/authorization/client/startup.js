import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { hasAllPermission } from './hasPermission';
import { AdminBox } from '../../ui-utils/client/lib/AdminBox';

Meteor.startup(() => {
	Tracker.autorun(() => Meteor.userId() && Meteor.subscribe('roles'));

	AdminBox.addOption({
		href: 'admin-permissions',
		i18nLabel: 'Permissions',
		icon: 'lock',
		permissionGranted() {
			return hasAllPermission('access-permissions');
		},
	});
});
