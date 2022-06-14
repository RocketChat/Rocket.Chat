import { IUser } from '@rocket.chat/core-typings';

import { MatrixBridgedUser, Users } from '../../../../../models/server';
import { FederatedUser } from '../../../domain/FederatedUser';

export class RocketChatUserAdapter {
	public async getFederatedUserByExternalId(externalUserId: string): Promise<FederatedUser | undefined> {
		const internalBridgedUserId = MatrixBridgedUser.getId(externalUserId);
		if (!internalBridgedUserId) {
			return;
		}

		const user = await Users.findOneById(internalBridgedUserId);

		return this.createFederatedUserInstance(externalUserId, user);
	}

	public async getFederatedUserByInternalId(internalUserId: string): Promise<FederatedUser | undefined> {
		const internalBridgedUserId = MatrixBridgedUser.getById(internalUserId);
		if (!internalBridgedUserId) {
			return;
		}
		const { uid: userId, mui: externalUserId } = internalBridgedUserId;
		const user = await Users.findOneById(userId);

		return this.createFederatedUserInstance(externalUserId, user);
	}

	public async getFederatedUserByInternalUsername(username: string): Promise<FederatedUser | undefined> {
		const user = await Users.findOneByUsername(username);
		if (!user) {
			return;
		}
		const internalBridgedUserId = MatrixBridgedUser.getById(user._id);
		if (!internalBridgedUserId) {
			return;
		}
		const { mui: externalUserId } = internalBridgedUserId;

		return this.createFederatedUserInstance(externalUserId, user);
	}

	public async getInternalUserById(userId: string): Promise<IUser | undefined> {
		return Users.findOneById(userId);
	}

	public async createFederatedUser(federatedUser: FederatedUser): Promise<void> {
		const existingLocalUser = await Users.findOneByUsername(federatedUser.internalReference.username);
		if (existingLocalUser) {
			return MatrixBridgedUser.upsert(
				{ uid: existingLocalUser._id },
				{
					uid: existingLocalUser._id,
					mui: federatedUser.externalId,
					remote: !federatedUser.existsOnlyOnProxyServer,
				},
			);
		}
		const newLocalUserId = await Users.create({
			username: federatedUser.internalReference.username,
			type: federatedUser.internalReference.type,
			status: federatedUser.internalReference.status,
			active: federatedUser.internalReference.active,
			roles: federatedUser.internalReference.roles,
			name: federatedUser.internalReference.name,
			requirePasswordChange: federatedUser.internalReference.requirePasswordChange,
		});
		MatrixBridgedUser.upsert(
			{ uid: newLocalUserId },
			{
				uid: newLocalUserId,
				mui: federatedUser.externalId,
				remote: !federatedUser.existsOnlyOnProxyServer,
			},
		);
	}

	private createFederatedUserInstance(externalUserId: string, user: IUser): FederatedUser {
		const federatedUser = FederatedUser.build();
		federatedUser.externalId = externalUserId;
		federatedUser.internalReference = user;

		return federatedUser;
	}
}
