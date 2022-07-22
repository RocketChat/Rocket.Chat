import { IUser } from '@rocket.chat/core-typings';
import { Users, MatrixBridgedUser } from '@rocket.chat/models';

import { FederatedUser } from '../../../domain/FederatedUser';

export class RocketChatUserAdapter {
	public async getFederatedUserByExternalId(externalUserId: string): Promise<FederatedUser | undefined> {
		const internalBridgedUserId = await MatrixBridgedUser.getLocalUserIdByExternalId(externalUserId);
		if (!internalBridgedUserId) {
			return;
		}

		const user = await Users.findOneById(internalBridgedUserId);

		if (user) {
			return this.createFederatedUserInstance(externalUserId, user);
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
			return this.createFederatedUserInstance(externalUserId, user, remote);
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

		return this.createFederatedUserInstance(externalUserId, user, remote);
	}

	public async getInternalUserById(userId: string): Promise<IUser | null> {
		return Users.findOneById(userId);
	}

	public async createFederatedUser(federatedUser: FederatedUser): Promise<void> {
		const existingLocalUser = await Users.findOneByUsername(federatedUser.internalReference.username || '');
		if (existingLocalUser) {
			return MatrixBridgedUser.createOrUpdateByLocalId(
				existingLocalUser._id,
				federatedUser.externalId,
				!federatedUser.existsOnlyOnProxyServer,
			);
		}
		const { insertedId } = await Users.insertOne({
			username: federatedUser.internalReference.username,
			type: federatedUser.internalReference.type,
			status: federatedUser.internalReference.status,
			active: federatedUser.internalReference.active,
			roles: federatedUser.internalReference.roles,
			name: federatedUser.internalReference.name,
			requirePasswordChange: federatedUser.internalReference.requirePasswordChange,
			createdAt: new Date(),
			federated: true,
		});
		return MatrixBridgedUser.createOrUpdateByLocalId(insertedId, federatedUser.externalId, !federatedUser.existsOnlyOnProxyServer);
	}

	private createFederatedUserInstance(externalUserId: string, user: IUser, remote = true): FederatedUser {
		const federatedUser = FederatedUser.build();
		federatedUser.externalId = externalUserId;
		federatedUser.internalReference = user;
		federatedUser.existsOnlyOnProxyServer = !remote;

		return federatedUser;
	}
}
