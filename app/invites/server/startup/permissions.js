import { Meteor } from 'meteor/meteor';

import { Permissions } from '../../../models';

Meteor.startup(() => {
	if (Permissions) {
		if (!Permissions.findOne({ _id: 'create-invite-links' })) {
			Permissions.insert({ _id: 'create-invite-links', roles: ['admin', 'moderator', 'owner'] });
		}
	}
});
