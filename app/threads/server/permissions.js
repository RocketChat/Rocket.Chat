import { Meteor } from 'meteor/meteor';
import { Permissions } from '../../models';

Meteor.startup(() => {
	// Add permissions for discussion
	const permissions = [
		{ _id: 'start-thread', roles: ['admin', 'owner', 'moderator', 'user', 'guest'] },
	];

	for (const permission of permissions) {
		if (!Permissions.findOneById(permission._id)) {
			Permissions.upsert(permission._id, { $set: permission });
		}
	}
});
