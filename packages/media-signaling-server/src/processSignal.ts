import type { IUser } from '@rocket.chat/core-typings';
import type { ClientMediaSignal } from '@rocket.chat/media-signaling';
import { MediaCalls } from '@rocket.chat/models';

import { UserAgentFactory } from './agents/users/AgentFactory';
import { logger } from './logger';
import { processNewCallSignal } from './processNewCallSignal';

export async function processSignal(signal: ClientMediaSignal, uid: IUser['_id']): Promise<void> {
	logger.debug({ msg: 'processSignal', signal, uid });
	if (signal.type === 'request-call') {
		return processNewCallSignal(signal, uid);
	}

	try {
		const call = await MediaCalls.findOneById(signal.callId);
		if (!call) {
			logger.error({ msg: 'call not found', method: 'processSignal', signal });
			throw new Error('invalid-call');
		}

		const factory = await UserAgentFactory.getAgentFactoryForUser(uid, signal.contractId);
		const agent = factory?.getCallAgent(call);
		if (!agent) {
			logger.error({ msg: 'agent not found', method: 'processSignal', signal });
			throw new Error('invalid-call');
		}

		await agent.processSignal(signal, call);
	} catch (e) {
		logger.error(e);
		throw e;
	}
}
