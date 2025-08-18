import type { IUser, UserStatus } from '@rocket.chat/core-typings';
import { MatrixBridgedUser, Users } from '@rocket.chat/models';

export const convertExternalUserIdToInternalUsername = (externalUserId: string): string => externalUserId.replace(/@/g, '');

export const getLocalUsernameForMatrixUserIdToSave = (matrixUserId: string): string => matrixUserId; // TODO: decide on whether to keep @ or not

export const getLocalNameForMatrixUserIdToSave = (matrixUserId: string): string =>
	matrixUserId.split(':').shift()?.replace(/@/g, '') as string;

// can have none if in case of local user
export const getExternalUserIdForLocalUserToSave = (user: IUser): string | undefined =>
	user.federated ? /* remote user, already has @ according to the function above */ (user.username as string) : undefined;

export async function getLocalUserForExternalUserId(externalUserId: string): Promise<IUser | null> {
	const localUserId = await MatrixBridgedUser.getExternalUserIdByLocalUserId(externalUserId);
	if (!localUserId) {
		return null;
	}

	const user = await Users.findOneById(localUserId);
	if (!user) {
		throw new Error('user not found although should have as it is in mapping not processing invite');
	}

	return user;
}

export async function getExternalUserIdForLocalUser(user: IUser): Promise<string | null> {
	const externalUserId = await MatrixBridgedUser.getExternalUserIdByLocalUserId(user._id);
	return externalUserId;
}

export async function saveExternalUserIdForLocalUser(user: IUser, externalUserId: string): Promise<void> {
	const matrixDomain = externalUserId.split(':')[1];
	await MatrixBridgedUser.createOrUpdateByLocalId(user._id, externalUserId, true, matrixDomain);
}

export async function saveLocalUserForExternalUserId(externalUserId: string, origin: string): Promise<string> {
	/*
	 * using from -------
		public getStorageRepresentation(): Readonly<IUser> {
			return {
				_id: this.internalId,
				username: this.internalReference.username || '',
				type: this.internalReference.type,
				status: this.internalReference.status,
				active: this.internalReference.active,
				roles: this.internalReference.roles,
				name: this.internalReference.name,
				requirePasswordChange: this.internalReference.requirePasswordChange,
				createdAt: new Date(),
				_updatedAt: new Date(),
				federated: this.isRemote(),
			};
		}
	*/

	const user = {
		// let the _id auto generate we deal with usernames
		username: getLocalUsernameForMatrixUserIdToSave(externalUserId),
		type: 'user',
		status: 'online' as UserStatus,
		active: true,
		roles: ['user'],
		name: getLocalNameForMatrixUserIdToSave(externalUserId),
		requirePasswordChange: false,
		federated: true,
		createdAt: new Date(),
		_updatedAt: new Date(),
	};

	const { insertedId } = await Users.insertOne(user);

	await MatrixBridgedUser.createOrUpdateByLocalId(insertedId, externalUserId, true, origin);

	return insertedId;
}
