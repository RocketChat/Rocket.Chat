import { Permissions } from '@rocket.chat/models';

export const createDiscussionPermissions = async (): Promise<void> => {
	// Add permissions for discussion
	const permissions = [
		{ _id: 'start-discussion', roles: ['admin', 'user', 'guest', 'app'] },
		{ _id: 'start-discussion-other-user', roles: ['admin', 'user', 'owner', 'app'] },
	];

	for (const permission of permissions) {
		await Permissions.create(permission._id, permission.roles);
	}
};
