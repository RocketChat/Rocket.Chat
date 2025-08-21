import type { IUser, MediaCallActor } from '@rocket.chat/core-typings';
import type { CallRole } from '@rocket.chat/media-signaling';
import { Users } from '@rocket.chat/models';

import type { SipActorAgent } from './BaseSipAgent';
import { SipActorCalleeAgent } from './CalleeAgent';
import { SipActorCallerAgent } from './CallerAgent';
import { logger } from '../../logger';
import type { SipUserData } from '../definition/common';

export type ExtensionData = {
	/**
	 * Whatever value should be recognized as the actor id;
	 * might be just the extension, or might have extra info such as host, or even be a full uri
	 */
	id: string;
	/** the extension number and nothing else */
	sipExtension?: string;
};

/** Factory for agents that handles all 'sip' actors */
export class SipAgentFactory {
	public static async getAgentForUser(
		user: Pick<IUser, '_id' | 'username' | 'name' | 'freeSwitchExtension'>,
		role: CallRole,
	): Promise<SipActorAgent | null> {
		const { _id: userId, freeSwitchExtension, name, username } = user;

		if (!freeSwitchExtension) {
			logger.debug({ msg: 'invalid user or no username', method: 'SipAgentFactory.getAgentForUser', userId });
			return null;
		}

		const extensionData: SipUserData = {
			id: freeSwitchExtension,
			name,
			username,
		};

		if (role === 'caller') {
			return new SipActorCallerAgent(extensionData);
		}

		if (role === 'callee') {
			return new SipActorCalleeAgent(extensionData);
		}

		return null;
	}

	public static async getAgentForUserId(userId: string, role: CallRole): Promise<SipActorAgent | null> {
		const user = await Users.findOneActiveById(userId, {
			projection: { username: 1, name: 1, freeSwitchExtension: 1 },
		});

		if (!user?.username) {
			logger.debug({ msg: 'invalid user or no username', method: 'UserAgentFactory.getAgentForUserId', userId });
			return null;
		}

		return this.getAgentForUser(user, role);
	}

	public static async getAgentForUserExtension(extension: string, role: CallRole): Promise<SipActorAgent | null> {
		const user = await Users.findOneByFreeSwitchExtension(extension, {
			projection: { username: 1, name: 1, freeSwitchExtension: 1 },
		});

		if (!user?.username || !user?.active) {
			logger.debug({ msg: 'invalid user or no username', method: 'UserAgentFactory.getAgentForUserExtension', extension });
			return null;
		}

		return this.getAgentForUser(user, role);
	}

	public static async getAgentForActor(actor: MediaCallActor, role: CallRole): Promise<SipActorAgent | null> {
		if (actor.type === 'user') {
			return this.getAgentForUserId(actor.id, role);
		}

		if (actor.type === 'sip') {
			return this.getAgentForUserExtension(actor.id, role);
		}

		return null;
	}
}
