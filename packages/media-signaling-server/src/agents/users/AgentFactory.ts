import type { IMediaCall, MediaCallActor } from '@rocket.chat/core-typings';
import type { CallRole } from '@rocket.chat/media-signaling';
import { Users } from '@rocket.chat/models';

import type { MinimalUserData } from './BasicAgent';
import { agentManager } from '../Manager';
import { UserMediaCallAgent } from './Agent';
import { UserNewCallAgent } from './NewCallAgent';
import type { IMediaCallAgentFactory } from '../definition/IMediaCallAgent';

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
			console.log('invalid user or no username');
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
					console.log('no contractId');
					return null;
				}

				const role = agentManager.getRoleForCallActor(call, { type: 'user', id: userId });
				if (!role) {
					console.log('no role');
					return null;
				}

				const { [role]: callActor } = call;
				const contractSigned = Boolean(callActor.contractId);

				// If the role is already signed with a different contract, do not create the agent
				if (contractSigned && callActor.contractId !== contractId) {
					console.log('signed by another contract');
					return null;
				}

				return new UserMediaCallAgent(userData, { role, callId, contractId, contractSigned });
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
