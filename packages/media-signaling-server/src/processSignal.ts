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

		const isCaller = call.caller.type === 'user' && call.caller.id === uid;
		const isCallee = call.callee.type === 'user' && call.callee.id === uid;
		if (!isCaller && !isCallee) {
			logger.error({ msg: 'actor is not part of the call', method: 'processSignal', signal });
			throw new Error('invalid-call');
		}

		// Ignore signals from different sessions
		if (isCaller && call.caller.contractId && call.caller.contractId !== signal.contractId) {
			return;
		}
		if (isCallee && call.callee.contractId && call.callee.contractId !== signal.contractId) {
			return;
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
