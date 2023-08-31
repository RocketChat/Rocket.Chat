import type { IUser } from '@rocket.chat/core-typings';
import { Users, MatrixBridgedUser } from '@rocket.chat/models';

import { FederatedUser } from '../../../domain/FederatedUser';
import { extractServerNameFromExternalIdentifier } from '../../matrix/converters/room/RoomReceiver';

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

// TODO: temporary solution until we can have all the dependencies isolated and make the service fully autonomous
export interface IUserAdapterDependencies {
	setRealName(userId: string, name: string, fullUser?: IUser): Promise<IUser | undefined>;
	setUserAvatar(
		user: Pick<IUser, '_id' | 'username'>,
		dataURI: string | Buffer,
		contentType: string | undefined,
		service?: 'initials' | 'url' | 'rest' | string,
		etag?: string,
	): Promise<void>;
}

export class RocketChatUserAdapter {
	constructor(private readonly dependencies: IUserAdapterDependencies) {}

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
		if (!user?.username) {
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
			return MatrixBridgedUser.createOrUpdateByLocalId(
				existingLocalUser._id,
				federatedUser.getExternalId(),
				federatedUser.isRemote(),
				extractServerNameFromExternalIdentifier(federatedUser.getExternalId()),
			);
		}
		const { insertedId } = await Users.insertOne(federatedUser.getStorageRepresentation());
		return MatrixBridgedUser.createOrUpdateByLocalId(
			insertedId,
			federatedUser.getExternalId(),
			federatedUser.isRemote(),
			extractServerNameFromExternalIdentifier(federatedUser.getExternalId()),
		);
	}

	public async setAvatar(federatedUser: FederatedUser, avatarUrl: string): Promise<void> {
		await this.dependencies.setUserAvatar(federatedUser.getInternalReference(), avatarUrl, 'image/jpeg', 'url'); // this mimetype is fixed here, but the function when called with a url as source don't use that mimetype
	}

	public async updateFederationAvatar(internalUserId: string, externalAvatarUrl: string): Promise<void> {
		await Users.setFederationAvatarUrlById(internalUserId, externalAvatarUrl);
	}

	public async updateRealName(internalUser: IUser, name: string): Promise<void> {
		await this.dependencies.setRealName(internalUser._id, name, internalUser);
	}

	public async createLocalUser(internalUser: IUser): Promise<void> {
		const existingLocalUser = internalUser.username && (await Users.findOneByUsername(internalUser.username, { projection: { _id: 1 } }));
		if (existingLocalUser) {
			return;
		}
		await Users.insertOne({
			username: internalUser.username,
			type: internalUser.type,
			status: internalUser.status,
			active: internalUser.active,
			roles: internalUser.roles,
			name: internalUser.name,
			requirePasswordChange: internalUser.requirePasswordChange,
			createdAt: new Date(),
			federated: internalUser.federated,
		});
	}

	public async getSearchedServerNamesByUserId(internalUserId: string): Promise<string[]> {
		return Users.findSearchedServerNamesByUserId(internalUserId);
	}

	public async addServerNameToSearchedServerNamesListByUserId(internalUserId: string, serverName: string): Promise<void> {
		await Users.addServerNameToSearchedServerNamesList(internalUserId, serverName);
	}

	public async removeServerNameFromSearchedServerNamesListByUserId(internalUserId: string, serverName: string): Promise<void> {
		await Users.removeServerNameFromSearchedServerNamesList(internalUserId, serverName);
	}
}
