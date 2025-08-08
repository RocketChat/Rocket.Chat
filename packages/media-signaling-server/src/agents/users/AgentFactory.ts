import type { IMediaCall, MediaCallActor } from '@rocket.chat/core-typings';
import type { CallRole } from '@rocket.chat/media-signaling';
import { Users } from '@rocket.chat/models';

import type { MinimalUserData } from './BasicAgent';
import { agentManager } from '../Manager';
import { UserMediaCallAgent } from './Agent';
import { UserNewCallAgent } from './NewCallAgent';
import { logger } from '../../logger';
import type { IMediaCallAgentFactory } from '../definition/IMediaCallAgent';
import type { AgentContractState } from '../definition/common';

// Overriding the interface to use the same factory for the AgentManager class and the processSignal function
export interface IUserAgentFactory extends IMediaCallAgentFactory {
	getNewAgent(role: CallRole): UserNewCallAgent;
	getCallAgent(call: IMediaCall): UserMediaCallAgent | null;
}

// Agent that handles all 'user' actors
export class UserAgentFactory {
	public static async getAgentFactoryForUser(userId: string, contractId?: string): Promise<IUserAgentFactory | null> {
		const user = await Users.findOneActiveById(userId, {
			projection: { username: 1, name: 1, freeSwitchExtension: 1 },
		});

		if (!user?.username) {
			logger.debug({ msg: 'invalid user or no username', method: 'UserAgentFactory.getAgentFactoryForUser', userId, contractId });
			return null;
		}

		const userData = user as MinimalUserData;

		return {
			getNewAgent(role: CallRole) {
				return new UserNewCallAgent(userData, { role, contractId });
			},
			getCallAgent(call: IMediaCall) {
				const { _id: callId } = call;

				if (!contractId) {
					logger.debug({ msg: 'no contractId', method: 'UserAgentFactory.getCallAgent', userId, contractId, callId });
					return null;
				}

				const role = agentManager.getRoleForCallActor(call, { type: 'user', id: userId });
				if (!role) {
					logger.debug({ msg: 'no role', method: 'UserAgentFactory.getCallAgent', userId, contractId, callId });
					return null;
				}

				const { [role]: callActor } = call;
				let contractState: AgentContractState = 'proposed';
				if (callActor.contractId) {
					contractState = callActor.contractId === contractId ? 'signed' : 'ignored';
				}

				// If the role is already signed with a different contract, do not create the agent
				if (contractState === 'ignored') {
					logger.debug({
						msg: 'signed by another contract',
						method: 'UserAgentFactory.getAgentFactoryForUser',
						userId,
						contractId,
						callActor,
					});
					return null;
				}

				return new UserMediaCallAgent(userData, { role, callId, contractId, contractState });
			},
		};
	}

	public static async getAgentFactoryForActor(actor: MediaCallActor): Promise<IUserAgentFactory | null> {
		if (actor.type !== 'user') {
			return null;
		}

		return this.getAgentFactoryForUser(actor.id, actor.contractId);
	}
}
