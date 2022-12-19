import { Meteor } from 'meteor/meteor';
import type { IUser } from '@rocket.chat/core-typings';
import { Users, MatrixBridgedUser } from '@rocket.chat/models';

import { setUserAvatar, _setRealName as setRealName } from '../../../../../lib/server';
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
		const internalBridgedUser = await MatrixBridgedUser.getBridgedUserByExternalUserId(externalUserId);
		if (!internalBridgedUser) {
			return;
		}

		const user = await Users.findOneById(internalBridgedUser.uid);

		if (user) {
			return createFederatedUserInstance(externalUserId, user, internalBridgedUser.remote);
		}
	}

	public async getFederatedUsersByExternalIds(externalUserIds: string[]): Promise<FederatedUser[]> {
		const internalBridgedUsers = await MatrixBridgedUser.getLocalUsersByExternalIds(externalUserIds);
		if (internalBridgedUsers.length === 0) {
			return [];
		}
		const internalUserIds = internalBridgedUsers.map((bridgedUser) => bridgedUser.uid);
		const internalUserIdsMap: Record<string, Record<string, any>> = internalBridgedUsers.reduce(
			(acc, bridgedUser) => ({ ...acc, [bridgedUser.uid]: { mui: bridgedUser.mui, remote: bridgedUser.remote } }),
			{},
		);
		const users = await Users.findByIds(internalUserIds).toArray();

		if (users.length === 0) {
			return [];
		}
		return users.map((user) => createFederatedUserInstance(internalUserIdsMap[user._id].mui, user, internalUserIdsMap[user._id].remote));
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

	public async getInternalUserByUsername(username: string): Promise<IUser | undefined> {
		return Users.findOneByUsername(username);
	}

	public async createFederatedUser(federatedUser: FederatedUser): Promise<void> {
		const existingLocalUser = federatedUser.getUsername() && (await Users.findOneByUsername(federatedUser.getUsername() as string));
		if (existingLocalUser) {
			return MatrixBridgedUser.createOrUpdateByLocalId(existingLocalUser._id, federatedUser.getExternalId(), federatedUser.isRemote());
		}
		const { insertedId } = await Users.insertOne(federatedUser.getStorageRepresentation());
		return MatrixBridgedUser.createOrUpdateByLocalId(insertedId, federatedUser.getExternalId(), federatedUser.isRemote());
	}

	public async setAvatar(federatedUser: FederatedUser, avatarUrl: string): Promise<void> {
		Meteor.runAsUser(federatedUser.getInternalId(), () => {
			setUserAvatar(federatedUser.getInternalReference(), avatarUrl, 'image/jpeg', 'url'); // this mimetype is fixed here, but the function when called with a url as source don't use that mimetype
		});
	}

	public async updateFederationAvatar(internalUserId: string, externalAvatarUrl: string): Promise<void> {
		await Users.setFederationAvatarUrlById(internalUserId, externalAvatarUrl);
	}

	public async updateRealName(internalUser: IUser, name: string): Promise<void> {
		setRealName(internalUser._id, name, internalUser);
	}
}
