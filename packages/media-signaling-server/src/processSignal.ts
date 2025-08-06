import type { IUser } from '@rocket.chat/core-typings';
import type { AgentMediaSignal } from '@rocket.chat/media-signaling';
import { MediaCalls } from '@rocket.chat/models';

import { UserAgentFactory } from './agents/users/AgentFactory';

export async function processSignal(signal: AgentMediaSignal, uid: IUser['_id']): Promise<void> {
	console.log('server.processSignal', signal, uid);

	try {
		const call = await MediaCalls.findOneById(signal.callId);
		if (!call) {
			throw new Error('invalid-call');
		}

		const factory = await UserAgentFactory.getAgentFactoryForUser(uid, signal.contractId);
		const agent = factory?.getCallAgent(call);
		if (!agent) {
			throw new Error('invalid-call');
		}

		await agent.processSignal(signal, call);
	} catch (e) {
		console.log(e);
		throw e;
	}
}
