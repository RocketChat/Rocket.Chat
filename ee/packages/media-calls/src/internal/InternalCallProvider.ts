import type { IMediaCall, MediaCallActor } from '@rocket.chat/core-typings';
import { MediaCalls } from '@rocket.chat/models';

import { BaseCallProvider } from '../base/BaseCallProvider';
import { CallRejectedError, type InternalCallParams } from '../definition/common';
import { logger } from '../logger';
import { MediaCallDirector } from '../server/CallDirector';

export class InternalCallProvider extends BaseCallProvider {
	public static async isActorAvailable(actor: MediaCallActor): Promise<boolean> {
		if (actor.type !== 'user') {
			return false;
		}

		const userHasCalls = await MediaCalls.hasUnfinishedCallsByUid(actor.id);
		return !userHasCalls;
	}

	public static async createCall(params: InternalCallParams): Promise<IMediaCall> {
		logger.debug({ msg: 'InternalCallProvider.createCall', params });
		if (!(await this.isActorAvailable(params.caller))) {
			throw new CallRejectedError('busy');
		}
		if (!(await this.isActorAvailable(params.callee))) {
			throw new CallRejectedError('unavailable');
		}

		const callerAgent = await MediaCallDirector.cast.getAgentForActorAndRole(params.caller, 'caller');
		const calleeAgent = await MediaCallDirector.cast.getAgentForActorAndRole(params.callee, 'callee');

		if (!callerAgent) {
			throw new Error('invalid-caller');
		}
		if (!calleeAgent) {
			throw new Error('invalid-callee');
		}

		callerAgent.oppositeAgent = calleeAgent;
		calleeAgent.oppositeAgent = callerAgent;

		const call = await MediaCallDirector.createCall({
			...params,
			callerAgent,
			calleeAgent,
		});

		// If the caller agent fails, this will automatically hangup the call and throw an error
		await MediaCallDirector.runOnCallCreatedForAgent(call, callerAgent);

		// If the callee agent fails, this will automatically hangup the call, notify the caller agent and then throw an error
		await MediaCallDirector.runOnCallCreatedForAgent(call, calleeAgent, callerAgent);

		if (params.parentCallId) {
			MediaCallDirector.hangupTransferredCallById(params.parentCallId).catch(() => null);
		}

		return call;
	}
}
