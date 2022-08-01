import { Users } from '@rocket.chat/models';

import { RocketChatUserAdapter } from '../../../../../../../app/federation-v2/server/infrastructure/rocket-chat/adapters/User';
import { FederatedUserEE } from '../../../domain/FederatedUser';

export class RocketChatUserAdapterEE extends RocketChatUserAdapter {
	public async createLocalUser(federatedUser: FederatedUserEE): Promise<void> {
		const existingLocalUser = await Users.findOneByUsername(federatedUser.getUsername() || '');
		if (existingLocalUser) {
			return;
		}
		await Users.insertOne({
			username: federatedUser.getUsername(),
			type: federatedUser.getInternalReference().type,
			status: federatedUser.getInternalReference().status,
			active: federatedUser.getInternalReference().active,
			roles: federatedUser.getInternalReference().roles,
			name: federatedUser.getName(),
			requirePasswordChange: federatedUser.getInternalReference().requirePasswordChange,
			createdAt: new Date(),
			federated: true,
		});
	}
}
