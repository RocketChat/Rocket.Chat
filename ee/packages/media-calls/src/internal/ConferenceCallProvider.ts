import type { IConferenceMediaCall, MediaCallContact } from '@rocket.chat/core-typings';
import type { CallFeature } from '@rocket.chat/media-signaling';
import { MediaCalls } from '@rocket.chat/models';

import { BaseCallProvider } from '../base/BaseCallProvider';
import { CallRejectedError, type ConferenceCallParams } from '../definition/common';
import { logger } from '../logger';
import { mediaCallDirector } from '../server/CallDirector';

export class ConferenceCallProvider extends BaseCallProvider {
	public static async createConference(params: ConferenceCallParams): Promise<IConferenceMediaCall> {
		logger.debug({ msg: 'ConferenceCallProvider.createCall', params });
		if (params.caller.type !== 'user' || !params.callees.length) {
			throw new CallRejectedError('unsupported');
		}

		if (params.parentCallId) {
			throw new CallRejectedError('unsupported');
		}

		if (await MediaCalls.hasUnfinishedCallsByUid(params.caller.id)) {
			throw new CallRejectedError('busy');
		}

		const callees: MediaCallContact[] = [];

		for (const callee of params.callees) {
			if (callee.type !== 'user') {
				continue;
			}

			if (await MediaCalls.hasUnfinishedCallsByUid(callee.id)) {
				continue;
			}

			callees.push(callee);
		}

		if (!callees.length) {
			throw new CallRejectedError('unavailable');
		}

		const callerAgent = await mediaCallDirector.cast.getAgentForActorAndRole(params.caller, 'caller');
		const calleeAgent = await mediaCallDirector.cast.getAgentForConferenceCallees(params.callees);

		if (!callerAgent || !calleeAgent) {
			throw new CallRejectedError('invalid-call-params');
		}

		callerAgent.oppositeAgent = calleeAgent;
		calleeAgent.oppositeAgent = callerAgent;

		const call = await mediaCallDirector.createCall({
			...params,
			kind: 'conference',
			callerAgent,
			calleeAgent,
		});

		// If the caller agent fails, this will automatically hangup the call and throw an error
		await mediaCallDirector.runOnCallCreatedForAgent(call, callerAgent);

		// If the callee agent fails, this will automatically hangup the call, notify the caller agent and then throw an error
		await mediaCallDirector.runOnCallCreatedForAgent(call, calleeAgent, callerAgent);

		return call;
	}

	public static async createLeg(conference: IConferenceMediaCall, callee: MediaCallContact): Promise<void> {
		if (callee.type !== 'user') {
			throw new Error('invalid-actor-type');
		}

		const callLeg = await MediaCalls.findConferenceLegByCalleeId(conference._id, callee.id, { projection: { _id: 1 } });
		if (callLeg) {
			return;
		}

		const { caller, features: parentFeatures } = conference;

		const features = parentFeatures as CallFeature[];

		const callerAgent = await mediaCallDirector.cast.getAgentForActorAndRole(caller, 'caller');
		const calleeAgent = await mediaCallDirector.cast.getAgentForActorAndRole(callee, 'callee');

		if (!callerAgent) {
			throw new Error('invalid-caller');
		}
		if (!calleeAgent) {
			throw new Error('invalid-callee');
		}

		callerAgent.oppositeAgent = calleeAgent;
		calleeAgent.oppositeAgent = callerAgent;

		const call = await mediaCallDirector.createCall({
			kind: 'direct',
			conferenceId: conference._id,
			caller,
			callee,
			callerAgent,
			calleeAgent,
			features,
		});

		// If the caller agent fails, this will automatically hangup the call and throw an error
		await mediaCallDirector.runOnCallCreatedForAgent(call, callerAgent);

		// If the callee agent fails, this will automatically hangup the call, notify the caller agent and then throw an error
		await mediaCallDirector.runOnCallCreatedForAgent(call, calleeAgent, callerAgent);

		if (callee.contractId) {
			await calleeAgent.onCallAccepted(call._id, { signedContractId: callee.contractId, features });
			await calleeAgent.oppositeAgent?.onCallAccepted(call._id, { signedContractId: call.caller.contractId, features });
		}
	}
}
