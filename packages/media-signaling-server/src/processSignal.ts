import type { IUser } from '@rocket.chat/core-typings';
import type { ClientMediaSignal } from '@rocket.chat/media-signaling';
import { MediaCalls } from '@rocket.chat/models';

import { UserAgentFactory } from './agents/users/AgentFactory';
import { processNewCallSignal } from './processNewCallSignal';

export async function processSignal(signal: ClientMediaSignal, uid: IUser['_id']): Promise<void> {
	console.log('server.processSignal', signal, uid);
	if (signal.type === 'request-call') {
		return processNewCallSignal(signal, uid);
	}

	try {
		const call = await MediaCalls.findOneById(signal.callId);
		if (!call) {
			console.log('call not found', signal.type);
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
