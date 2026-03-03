import type { IRoom } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

export async function validateRequiredRolesForRoom(
	room: IRoom,
	userId: string,
): Promise<void> {
	if (!room.requiredRoles?.length) {
		return;
	}

	const user = await Users.findOneById(userId, { projection: { roles: 1 } });

	if (!user) {
		throw new Meteor.Error(
			'error-invalid-user',
			'Invalid user while validating required roles',
			{ function: 'validateRequiredRolesForRoom' },
		);
	}

	const userRoles = user.roles ?? [];

	const hasRequiredRole = room.requiredRoles.some((requiredRole) =>
		userRoles.includes(requiredRole),
	);

	if (!hasRequiredRole) {
		throw new Meteor.Error(
			'error-required-role-missing',
			'You do not have the required role to join this channel.',
		
		);
	}
}