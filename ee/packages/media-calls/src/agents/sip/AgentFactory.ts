import type { IMediaCall, IUser, MediaCallActor } from '@rocket.chat/core-typings';
import type { CallRole } from '@rocket.chat/media-signaling';
import { Users } from '@rocket.chat/models';

import { agentManager } from '../Manager';
import { SipMediaCallAgent } from './Agent';
import { SipNewCallAgent } from './NewCallAgent';
import { logger } from '../../logger';
import type { IMediaCallAgentFactory } from '../definition/IMediaCallAgent';
import type { AgentContractState } from '../definition/common';

// Overriding the interface to use the same factory for the AgentManager class and the processInvite function
export interface ISipAgentFactory extends IMediaCallAgentFactory {
	getNewAgent(role: CallRole): SipNewCallAgent;
	getCallAgent(call: IMediaCall): SipMediaCallAgent | null;
}

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
	public static async getAgentFactoryForExtension(data: ExtensionData, contractId?: string): Promise<ISipAgentFactory | null> {
		const user = await this.getExtensionUser(data);

		const { id: sipId } = data;
		const sipExtension = user?.freeSwitchExtension || data.sipExtension;

		const contact = {
			type: 'sip',
			id: data.id,
			...(sipExtension && { sipExtension }),
			...(user?.username && { username: user.username }),
			...(user?.name && { displayName: user.name }),
			...(user?.name && { displayName: user.name }),
		} as const;

		return {
			getNewAgent(role: CallRole) {
				return new SipNewCallAgent(contact, { role, contractId });
			},
			getCallAgent(call: IMediaCall) {
				const { _id: callId } = call;

				if (!contractId) {
					logger.debug({ msg: 'no contractId', method: 'SipAgentFactory.getCallAgent', sipId, contractId, callId });
					return null;
				}

				const role = agentManager.getRoleForCallActor(call, { type: 'sip', id: sipId });
				if (!role) {
					logger.debug({ msg: 'no role', method: 'SipAgentFactory.getCallAgent', sipId, contractId, callId });
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
						method: 'SipAgentFactory.getAgentFactoryForExtension',
						sipId,
						contractId,
						callActor,
					});
					return null;
				}

				return new SipMediaCallAgent(contact, { role, callId, contractId, contractState });
			},
		};
	}

	public static async getAgentFactoryForActor(actor: MediaCallActor): Promise<ISipAgentFactory | null> {
		if (actor.type !== 'sip') {
			return null;
		}

		return this.getAgentFactoryForExtension({ id: actor.id }, actor.contractId);
	}

	private static async getExtensionUser(
		data: ExtensionData,
	): Promise<Pick<IUser, '_id' | 'username' | 'name' | 'freeSwitchExtension'> | null> {
		if (!data.sipExtension) {
			return null;
		}

		return Users.findOneByFreeSwitchExtension(data.sipExtension, {
			projection: {
				username: 1,
				name: 1,
				freeSwitchExtension: 1,
			},
		});
	}
}
