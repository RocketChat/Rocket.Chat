import { type IUser, UserStatus } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

/**
 * Helper function to create a federated user
 *
 * Because of historical reasons, we can have users only with federated flag but no federation object
 * So we need to upsert the user with the federation object
 */

export async function createOrUpdateFederatedUser(options: { username: string; name?: string; origin: string }): Promise<IUser> {
	const { username, name = username, origin } = options;

	console.log('createOrUpdateFederatedUser ->', options);

	// TODO: Have a specific method to handle this upsert
	const user = await Users.findOneAndUpdate(
		{
			username,
		},
		{
			$set: {
				username,
				name: name || username,
				type: 'user' as const,
				status: UserStatus.OFFLINE,
				active: true,
				roles: ['user'],
				requirePasswordChange: false,
				federated: true,
				federation: {
					version: 1,
					mui: username,
					origin,
				},
				_updatedAt: new Date(),
			},
			$setOnInsert: {
				createdAt: new Date(),
			},
		},
		{
			upsert: true,
			projection: { _id: 1, username: 1 },
			returnDocument: 'after',
		},
	);

	if (!user) {
		throw new Error(`Failed to create or update federated user: ${username}`);
	}

	return user;
}
