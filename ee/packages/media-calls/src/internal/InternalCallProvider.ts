import type { IMediaCall } from '@rocket.chat/core-typings';
import { MediaCalls } from '@rocket.chat/models';

import { BaseCallProvider } from '../base/BaseCallProvider';
import { CallRejectedError, type InternalCallParams } from '../definition/common';
import { logger } from '../logger';
import { mediaCallDirector } from '../server/CallDirector';

export class InternalCallProvider extends BaseCallProvider {
	public static async createCall(params: InternalCallParams): Promise<IMediaCall> {
		logger.debug({ msg: 'InternalCallProvider.createCall', params });
		if (params.caller.type !== 'user' || params.callee.type !== 'user') {
			throw new CallRejectedError('unsupported');
		}

		if (await MediaCalls.hasUnfinishedCallsByUid(params.caller.id, params.parentCallId)) {
			throw new CallRejectedError('busy');
		}
		if (await MediaCalls.hasUnfinishedCallsByUid(params.callee.id)) {
			throw new CallRejectedError('unavailable');
		}

		const callerAgent = await mediaCallDirector.cast.getAgentForActorAndRole(params.caller, 'caller');
		const calleeAgent = await mediaCallDirector.cast.getAgentForActorAndRole(params.callee, 'callee');

		if (!callerAgent) {
			throw new Error('invalid-caller');
		}
		if (!calleeAgent) {
			throw new Error('invalid-callee');
		}

		callerAgent.oppositeAgent = calleeAgent;
		calleeAgent.oppositeAgent = callerAgent;

		const call = await mediaCallDirector.createCall({
			...params,
			callerAgent,
			calleeAgent,
		});

		// If the caller agent fails, this will automatically hangup the call and throw an error
		await mediaCallDirector.runOnCallCreatedForAgent(call, callerAgent);

		// If the callee agent fails, this will automatically hangup the call, notify the caller agent and then throw an error
		await mediaCallDirector.runOnCallCreatedForAgent(call, calleeAgent, callerAgent);

		if (params.parentCallId) {
			logger.info({
				msg: 'Transferred call was created, so the old one will be terminated',
				newCallId: call._id,
				oldCallId: params.parentCallId,
			});
			mediaCallDirector.hangupTransferredCallById(params.parentCallId).catch(() => null);
		}

		return call;
	}
}
