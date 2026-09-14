import type { IMediaCall, MediaCallContact, MediaCallSignedContact } from '@rocket.chat/core-typings';
import type { CallFeature } from '@rocket.chat/media-signaling';
import { MediaCalls } from '@rocket.chat/models';

import { mediaCallDirector } from './CallDirector';
import { getMediaCallServer } from './injection';
import { BaseCallProvider } from '../base/BaseCallProvider';
import type { IMediaCallAgent } from '../definition/IMediaCallAgent';
import type { CtiCallStateEvent } from '../definition/IMediaCallAppGateway';
import { CallRejectedError, type InternalCallParams } from '../definition/common';
import { logger } from '../logger';

/** Contract id used to sign the app-backed leg of a cti call (it has no real client session). */
const CTI_APP_CONTRACT_ID = 'cti-gateway';

/**
 * Creates and drives `cti` calls, whose media/control live entirely on an external device handled by
 * an app. Rocket.Chat only tracks the call and relays control: the controlling user is a normal
 * `UserActorAgent` (drives the widget), while the app-backed side is a `CtiActorAgent` that dispatches
 * to the app gateway.
 */
export class CtiCallProvider extends BaseCallProvider {
	/** Outbound: a Rocket.Chat user places a call on their own device towards `callee`. */
	public static async createCall(params: InternalCallParams): Promise<IMediaCall> {
		logger.debug({ msg: 'CtiCallProvider.createCall', params });

		if (params.caller.type !== 'user') {
			throw new CallRejectedError('unsupported');
		}

		if (await MediaCalls.hasUnfinishedCallsByUid(params.caller.id, params.parentCallId)) {
			throw new CallRejectedError('busy');
		}

		const callerAgent = await mediaCallDirector.cast.getAgentForActorAndRole(params.caller, 'caller', 'cti');
		const calleeAgent = await mediaCallDirector.cast.getAgentForActorAndRole(params.callee, 'callee', 'cti');

		return this.create({ ...params, requestedService: 'cti' }, callerAgent, calleeAgent);
	}

	/** Inbound: an app reports a call arriving on a Rocket.Chat user's device. */
	public static async createIncomingCall(params: {
		user: MediaCallContact;
		from: MediaCallContact;
		device?: string;
		features?: CallFeature[];
	}): Promise<IMediaCall> {
		logger.debug({ msg: 'CtiCallProvider.createIncomingCall', params });

		if (params.user.type !== 'user') {
			throw new CallRejectedError('unsupported');
		}

		if (await MediaCalls.hasUnfinishedCallsByUid(params.user.id)) {
			throw new CallRejectedError('unavailable');
		}

		// The external side is app-backed and has no client session, so sign it with a synthetic contract.
		const caller: MediaCallSignedContact = { ...params.from, type: 'sip', contractId: CTI_APP_CONTRACT_ID };
		const callee: MediaCallContact = { ...params.user, type: 'user' };

		const callerAgent = await mediaCallDirector.cast.getAgentForActorAndRole(caller, 'caller', 'cti');
		const calleeAgent = await mediaCallDirector.cast.getAgentForActorAndRole(callee, 'callee', 'cti');

		return this.create(
			{
				caller,
				callee,
				requestedService: 'cti',
				features: params.features ?? [],
				...(params.device && { device: params.device }),
			},
			callerAgent,
			calleeAgent,
		);
	}

	private static async create(
		params: InternalCallParams,
		callerAgent: IMediaCallAgent | null,
		calleeAgent: IMediaCallAgent | null,
	): Promise<IMediaCall> {
		if (!callerAgent) {
			throw new Error('invalid-caller');
		}
		if (!calleeAgent) {
			throw new Error('invalid-callee');
		}

		callerAgent.oppositeAgent = calleeAgent;
		calleeAgent.oppositeAgent = callerAgent;

		const call = await mediaCallDirector.createCall({ ...params, callerAgent, calleeAgent });

		await mediaCallDirector.runOnCallCreatedForAgent(call, callerAgent);
		await mediaCallDirector.runOnCallCreatedForAgent(call, calleeAgent, callerAgent);

		return call;
	}

	/**
	 * Applies a control/state change the app reported for a call it is handling: it drives the call's
	 * server-side state machine (ringing/answered/active/ended) and relays mute/hold state to the
	 * controlling client.
	 */
	public static async reportState(callId: string, event: CtiCallStateEvent): Promise<void> {
		logger.debug({ msg: 'CtiCallProvider.reportState', callId, event });

		const call = await MediaCalls.findOneById(callId);
		if (call?.service !== 'cti') {
			logger.warn({ msg: 'CtiCallProvider.reportState for an unknown or non-cti call', callId });
			return;
		}

		const agents = await mediaCallDirector.cast.getAgentsFromCall(call);
		// A cti call always has exactly one user leg (the controller) and one app-backed (sip) leg.
		const appAgent = agents.caller.actorType === 'sip' ? agents.caller : agents.callee;
		const userAgent = agents.caller.actorType === 'user' ? agents.caller : agents.callee;

		switch (event.type) {
			case 'ringing':
				await MediaCalls.startRingingById(call._id, mediaCallDirector.getNewExpirationTime());
				getMediaCallServer().sendSignal(userAgent.actorId, { callId: call._id, type: 'notification', notification: 'trying' });
				return;
			case 'answered':
				await mediaCallDirector.acceptCall(call, agents.callee, {
					calleeContractId: CTI_APP_CONTRACT_ID,
					supportedFeatures: (event.features as CallFeature[]) ?? (call.features as CallFeature[]),
				});
				return;
			case 'active':
				await mediaCallDirector.activate(call, appAgent);
				return;
			case 'ended':
				await mediaCallDirector.hangup(call, appAgent, event.reason ?? 'remote');
				return;
			case 'state':
				getMediaCallServer().sendSignal(userAgent.actorId, {
					callId: call._id,
					type: 'update',
					state: {
						...(typeof event.muted === 'boolean' && { muted: event.muted }),
						...(typeof event.held === 'boolean' && { held: event.held }),
						...(typeof event.remoteMuted === 'boolean' && { remoteMuted: event.remoteMuted }),
						...(typeof event.remoteHeld === 'boolean' && { remoteHeld: event.remoteHeld }),
					},
				});
		}
	}
}
