import type { IUser, MediaCallActor } from '@rocket.chat/core-typings';
import type { CallRole } from '@rocket.chat/media-signaling';
import { Users } from '@rocket.chat/models';

import type { UserActorAgent } from './BaseAgent';
import { UserActorCalleeAgent } from './CalleeAgent';
import { UserActorCallerAgent } from './CallerAgent';
import { logger } from '../../logger';
import type { MinimalUserData } from '../definition/common';

export class UserAgentFactory {
	public static async getAgentForUser(
		user: Pick<IUser, '_id' | 'username' | 'name' | 'freeSwitchExtension'>,
		role: CallRole,
	): Promise<UserActorAgent | null> {
		const { _id: userId } = user;

		if (!user.username) {
			logger.debug({ msg: 'invalid user or no username', method: 'UserAgentFactory.getAgentForUser', userId });
			return null;
		}

		const userData = user as MinimalUserData;

		if (role === 'caller') {
			return new UserActorCallerAgent(userData);
		}

		if (role === 'callee') {
			return new UserActorCalleeAgent(userData);
		}

		return null;
	}

	public static async getAgentForUserId(userId: string, role: CallRole): Promise<UserActorAgent | null> {
		const user = await Users.findOneActiveById(userId, {
			projection: { username: 1, name: 1, freeSwitchExtension: 1 },
		});

		if (!user?.username) {
			logger.debug({ msg: 'invalid user or no username', method: 'UserAgentFactory.getAgentForUserId', userId });
			return null;
		}

		return this.getAgentForUser(user, role);
	}

	public static async getAgentForUserExtension(extension: string, role: CallRole): Promise<UserActorAgent | null> {
		const user = await Users.findOneByFreeSwitchExtension(extension, {
			projection: { username: 1, name: 1, freeSwitchExtension: 1 },
		});

		if (!user?.username || !user?.active) {
			logger.debug({ msg: 'invalid user or no username', method: 'UserAgentFactory.getAgentForUserExtension', extension });
			return null;
		}

		return this.getAgentForUser(user, role);
	}

	public static async getAgentForActor(actor: MediaCallActor, role: CallRole): Promise<UserActorAgent | null> {
		if (actor.type === 'user') {
			return this.getAgentForUserId(actor.id, role);
		}

		if (actor.type === 'sip') {
			return this.getAgentForUserExtension(actor.id, role);
		}

		return null;
	}
}
