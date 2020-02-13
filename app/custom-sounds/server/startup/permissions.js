import { Meteor } from 'meteor/meteor';

import { Permissions } from '../../../models';

Meteor.startup(() => {
	if (Permissions) {
		Permissions.createOrUpdate('manage-sounds', ['admin']);
	}
});
