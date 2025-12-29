import type { IPermission } from '@rocket.chat/core-typings';
import { Permissions } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

Meteor.startup(async () => {
	// Add permissions for discussion
	const permissions: { _id: IPermission['_id']; roles: string[] }[] = [
		{ _id: 'start-discussion', roles: ['admin', 'user', 'guest', 'app'] },
		{ _id: 'start-discussion-other-user', roles: ['admin', 'user', 'owner', 'app'] },
	];

	for await (const permission of permissions) {
		await Permissions.create(permission._id, permission.roles);
	}
});
