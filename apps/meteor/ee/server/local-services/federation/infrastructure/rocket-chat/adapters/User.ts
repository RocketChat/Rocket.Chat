import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { RocketChatUserAdapter } from '../../../../../../../server/services/federation/infrastructure/rocket-chat/adapters/User';

export class RocketChatUserAdapterEE extends RocketChatUserAdapter {
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
