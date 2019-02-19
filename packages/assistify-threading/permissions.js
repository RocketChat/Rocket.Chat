import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

Meteor.startup(() => {
	// Add permissions for threading
	const permissions = [
		{ _id: 'start-thread', roles: ['admin', 'user', 'expert', 'guest'] },
		{ _id: 'start-thread-other-user', roles: ['admin', 'user', 'expert', 'owner'] },
	];

	for (const permission of permissions) {
		if (!RocketChat.models.Permissions.findOneById(permission._id)) {
			RocketChat.models.Permissions.upsert(permission._id, { $set: permission });
		}
	}
});
