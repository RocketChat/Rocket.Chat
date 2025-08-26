import type { IMediaCall, MediaCallActor, MediaCallSignedActor } from '@rocket.chat/core-typings';
import type { CallService } from '@rocket.chat/media-signaling';

import { BaseCallProvider } from './BaseCallProvider';
import { MediaCallDirector } from './global/CallDirector';

export type InternalCallParams = {
	caller: MediaCallSignedActor;
	callee: MediaCallActor;
	requestedCallId?: string;
	requestedService?: CallService;
};

export class InternalCallProvider extends BaseCallProvider {
	public static async createCall(params: InternalCallParams): Promise<IMediaCall> {
		console.log('create internal call');
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

		return call;
	}
}
