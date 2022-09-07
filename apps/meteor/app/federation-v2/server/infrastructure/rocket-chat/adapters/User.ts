import type { IUser } from '@rocket.chat/core-typings';
import { Users, MatrixBridgedUser } from '@rocket.chat/models';

import { FederatedUser } from '../../../domain/FederatedUser';

const createFederatedUserInstance = (externalUserId: string, user: IUser, remote = true): FederatedUser => {
	const federatedUser = FederatedUser.createWithInternalReference(externalUserId, !remote, user);

	return federatedUser;
};

export const getFederatedUserByInternalUsername = async (username: string): Promise<FederatedUser | undefined> => {
	const user = await Users.findOneByUsername(username);
	if (!user) {
		return;
	}
	const internalBridgedUser = await MatrixBridgedUser.getBridgedUserByLocalId(user._id);
	if (!internalBridgedUser) {
		return;
	}
	const { mui: externalUserId, remote } = internalBridgedUser;

	return createFederatedUserInstance(externalUserId, user, remote);
};

export class RocketChatUserAdapter {
	public async getFederatedUserByExternalId(externalUserId: string): Promise<FederatedUser | undefined> {
		const internalBridgedUserId = await MatrixBridgedUser.getLocalUserIdByExternalId(externalUserId);
		if (!internalBridgedUserId) {
			return;
		}

		const user = await Users.findOneById(internalBridgedUserId);

		if (user) {
			return createFederatedUserInstance(externalUserId, user);
		}
	}

	public async getFederatedUserByInternalId(internalUserId: string): Promise<FederatedUser | undefined> {
		const internalBridgedUser = await MatrixBridgedUser.getBridgedUserByLocalId(internalUserId);
		if (!internalBridgedUser) {
			return;
		}
		const { uid: userId, mui: externalUserId, remote } = internalBridgedUser;
		const user = await Users.findOneById(userId);

		if (user) {
			return createFederatedUserInstance(externalUserId, user, remote);
		}
	}

	public async getFederatedUserByInternalUsername(username: string): Promise<FederatedUser | undefined> {
		const user = await Users.findOneByUsername(username);
		if (!user) {
			return;
		}
		const internalBridgedUser = await MatrixBridgedUser.getBridgedUserByLocalId(user._id);
		if (!internalBridgedUser) {
			return;
		}
		const { mui: externalUserId, remote } = internalBridgedUser;

		return createFederatedUserInstance(externalUserId, user, remote);
	}

	public async getInternalUserById(userId: string): Promise<IUser> {
		const user = await Users.findOneById(userId);
		if (!user || !user.username) {
			throw new Error(`User with internalId ${userId} not found`);
		}
		return user;
	}

	public async createFederatedUser(federatedUser: FederatedUser): Promise<void> {
		const existingLocalUser = federatedUser.getUsername() && (await Users.findOneByUsername(federatedUser.getUsername() as string));
		if (existingLocalUser) {
			return MatrixBridgedUser.createOrUpdateByLocalId(existingLocalUser._id, federatedUser.getExternalId(), federatedUser.isRemote());
		}
		const { insertedId } = await Users.insertOne(federatedUser.getStorageRepresentation());
		return MatrixBridgedUser.createOrUpdateByLocalId(insertedId, federatedUser.getExternalId(), federatedUser.isRemote());
	}
}
