import { Meteor } from 'meteor/meteor';

import { Permissions } from '../../../models';

Meteor.startup(() => {
	if (Permissions) {
		Permissions.create('change-tags', ['admin', 'owner', 'moderator']);
	}
});
