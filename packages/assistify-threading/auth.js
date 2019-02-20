import { Meteor } from 'meteor/meteor';
import { Permissions } from 'meteor/rocketchat:models';

Meteor.startup(() => {

	// Add permissions for threading
	const permissions = [
		{ _id: 'start-thread', roles: ['admin', 'user', 'expert', 'guest'] },
		{ _id: 'start-thread-other-user', roles: ['admin', 'user', 'expert', 'owner'] },
	];

	for (const permission of permissions) {
		if (!Permissions.findOneById(permission._id)) {
			Permissions.upsert(permission._id, { $set: permission });
		}
	}
});
