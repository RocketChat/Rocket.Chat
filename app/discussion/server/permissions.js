import { Meteor } from 'meteor/meteor';

import { Permissions } from '../../models';

Meteor.startup(() => {
	// Add permissions for discussion
	const permissions = [
		{ _id: 'start-discussion', roles: ['admin', 'user', 'expert', 'guest'] },
		{ _id: 'start-discussion-other-user', roles: ['admin', 'user', 'expert', 'owner'] },
	];

	for (const permission of permissions) {
		if (!Permissions.findOneById(permission._id)) {
			Permissions.upsert(permission._id, { $set: permission });
		}
	}
});
