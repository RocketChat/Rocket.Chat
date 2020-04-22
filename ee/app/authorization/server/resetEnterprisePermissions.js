import { Permissions } from '../../../../app/models/server';

export const resetEnterprisePermissions = function() {
	const guestPermissions = [
		'view-d-room',
		'view-joined-room',
		'view-p-room',
		'start-discussion',
	];

	Permissions.update({ _id: { $in: guestPermissions } }, { $addToSet: { roles: 'guest' } }, { multi: true });
	Permissions.update({ _id: { $nin: guestPermissions } }, { $pull: { roles: 'guest' } }, { multi: true });
};
