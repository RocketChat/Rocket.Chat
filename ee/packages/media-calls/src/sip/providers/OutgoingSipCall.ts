import type { IMediaCall, IMediaCallChannel, MediaCallSignedActor } from '@rocket.chat/core-typings';
import { MediaCalls } from '@rocket.chat/models';

import { BaseSipCall } from './BaseSipCall';
import type { InternalCallParams } from '../../definition/common';
import { logger } from '../../logger';
import { MediaCallDirector } from '../../server/CallDirector';
import type { SipServerSession } from '../Session';
import { SipActorAgent } from '../agents/BaseSipAgent';
import type { SipActorCalleeAgent } from '../agents/CalleeAgent';
import { SipError, SipErrorCodes } from '../errorCodes';

export class OutgoingSipCall extends BaseSipCall {
	constructor(
		session: SipServerSession,
		call: IMediaCall,
		protected readonly agent: SipActorCalleeAgent,
		channel: IMediaCallChannel,
	) {
		super(session, call, agent, channel);
		// this.emitter = new Emitter();
	}

	public static async createCall(session: SipServerSession, params: InternalCallParams): Promise<IMediaCall> {
		logger.debug({ msg: 'OutgoingSipCall.createCall', params });

		const { callee, ...extraParams } = params;

		// pre-sign the callee to this session
		const signedCallee: MediaCallSignedActor = {
			...callee,
			contractId: session.sessionId,
		};

		const calleeAgent = await MediaCallDirector.cast.getAgentForActorAndRole(signedCallee, 'callee');
		if (!calleeAgent) {
			throw new SipError(SipErrorCodes.NOT_FOUND, 'Callee agent not found');
		}

		if (!(calleeAgent instanceof SipActorAgent)) {
			throw new SipError(SipErrorCodes.INTERNAL_SERVER_ERROR, 'Caller agent not valid');
		}

		const callerAgent = await MediaCallDirector.cast.getAgentForActorAndRole(params.caller, 'caller');
		if (!callerAgent) {
			throw new SipError(SipErrorCodes.NOT_FOUND, 'Caller agent not found');
		}

		const call = await MediaCallDirector.createCall({
			...extraParams,
			callee: signedCallee,
			calleeAgent,
			callerAgent,
		});

		const channel = await calleeAgent.getOrCreateChannel(call, session.sessionId, {
			acknowledged: true,
		});

		const sipCall = new OutgoingSipCall(session, call, calleeAgent, channel);
		session.registerCall(sipCall);

		// report to the caller that the call was created
		await callerAgent.onCallCreated(call);

		return call;
	}

	protected async reflectCall(call: IMediaCall): Promise<void> {
		logger.debug({ msg: 'OutgoingSipCall.reflectCall', call, lastCallState: this.lastCallState });
		if (call.state === 'hangup') {
			// return this.processEndedCall();
			return;
		}

		if (this.lastCallState === 'none') {
			const remoteDescription = call.webrtcOffer;
			if (!remoteDescription) {
				return;
			}

			return this.startRingingById(this.callId, remoteDescription);
		}

		if (call.state === 'accepted' && this.lastCallState !== 'accepted') {
			// return this.processAcceptedCall();
		}
	}

	protected async startRingingById(callId: string, sdp: RTCSessionDescriptionInit): Promise<void> {
		logger.debug('OutgoingSipCall.startRingingById');
		const call = await MediaCalls.findOneById(callId);
		if (!call) {
			throw new Error('invalid-call');
		}

		this.session
			.makeOutboundCall(call, sdp)
			.then(() => {
				this.lastCallState = 'ringing';
			})
			.catch((e) => {
				console.log(e);

				// this.emitter.emit('callEnded');
				this.lastCallState = 'hangup';
			});
	}
}
