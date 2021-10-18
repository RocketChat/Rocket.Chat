import { Meteor } from 'meteor/meteor';

import { Permissions } from '../../../models';

Meteor.startup(() => {
	if (Permissions) {
		Permissions.create('manage-sounds', ['admin']);
	}
});
