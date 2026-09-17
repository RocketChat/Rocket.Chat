import {
	type IRegisterUser,
	type IUserNativeFederated,
	isRegisterUser,
	isUserNativeFederated,
	UserStatus,
} from '@rocket.chat/core-typings';
import type { UserID } from '@rocket.chat/federation-sdk';
import { Users } from '@rocket.chat/models';

/**
 * Helper function to create a federated user
 *
 * Because of historical reasons, we can have users only with federated flag but no federation object
 * So we need to upsert the user with the federation object
 */

export async function createOrUpdateFederatedUser(options: {
	username: UserID;
	name?: string;
	origin: string;
	asId?: string;
}): Promise<IUserNativeFederated & IRegisterUser> {
	const { username, name = username, origin, asId } = options;

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
				roles: ['federated-external'],
				requirePasswordChange: false,
				federated: true,
				federation: {
					version: 1,
					mui: username,
					origin,
					...(asId && { asId }),
				},
				_updatedAt: new Date(),
			},
			$setOnInsert: {
				createdAt: new Date(),
			},
		},
		{
			upsert: true,
			returnDocument: 'after',
		},
	);

	// the upsert above writes every field these guards check, so they should never reject a returned document
	if (!user || !isUserNativeFederated(user) || !isRegisterUser(user)) {
		throw new Error(`Failed to create or update federated user: ${username}`);
	}

	return user;
}
