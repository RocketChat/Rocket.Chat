import { Users } from '@rocket.chat/models';

import { RocketChatUserAdapter } from '../../../../../../../app/federation-v2/server/infrastructure/rocket-chat/adapters/User';
import type { FederatedUserEE } from '../../../domain/FederatedUser';

export class RocketChatUserAdapterEE extends RocketChatUserAdapter {
	public async createLocalUser(federatedUser: FederatedUserEE): Promise<void> {
		const existingLocalUser = await Users.findOneByUsername(federatedUser.internalReference.username || '');
		if (existingLocalUser) {
			return;
		}
		await Users.insertOne({
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
	}
}
