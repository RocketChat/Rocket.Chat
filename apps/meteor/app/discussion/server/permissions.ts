import { Meteor } from 'meteor/meteor';

import { Permissions } from '../../models/server/raw';

Meteor.startup(() => {
	// Add permissions for discussion
	const permissions = [
		{ _id: 'start-discussion', roles: ['admin', 'user', 'guest', 'app'] },
		{ _id: 'start-discussion-other-user', roles: ['admin', 'user', 'owner', 'app'] },
	];

	for (const permission of permissions) {
		Permissions.create(permission._id, permission.roles);
	}
});
