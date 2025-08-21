import type { IMediaCall, IMediaCallChannel, MediaCallSignedActor } from '@rocket.chat/core-typings';
import { MediaCalls } from '@rocket.chat/models';

import { BaseSipCall } from './BaseSipCall';
import type { SipServerSession } from './Session';
import type { InternalCallParams } from '../../../InternalCallProvider';
import { UserAgentFactory } from '../../users/AgentFactory';
import { SipAgentFactory } from '../AgentFactory';
import { SipError, SipErrorCodes } from './errorCodes';
import { MediaCallDirector } from '../../../global/CallDirector';
import type { SipActorCalleeAgent } from '../CalleeAgent';

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
		const { callee, ...extraParams } = params;

		// pre-sign the callee to this session
		const signedCallee: MediaCallSignedActor = {
			...callee,
			contractId: session.sessionId,
		};

		const calleeAgent = await SipAgentFactory.getAgentForActor(callee, 'callee');
		if (!calleeAgent) {
			throw new SipError(SipErrorCodes.NOT_FOUND, 'callee-agent-not-found');
		}

		const callerAgent = await UserAgentFactory.getAgentForActor(params.caller, 'caller');
		if (!callerAgent) {
			throw new SipError(SipErrorCodes.NOT_FOUND, 'caller-agent-not-found');
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
		if (call.state === 'hangup') {
			// return this.processEndedCall();
			return;
		}

		if (this.lastCallState === 'none') {
			const remoteDescription = await this.getRemoteDescription();
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

	private async getRemoteDescription(): Promise<RTCSessionDescriptionInit | null> {
		if (this.remoteDescription) {
			return this.remoteDescription;
		}

		const remoteDescription = await this.getChannelRemoteDescription();
		if (remoteDescription) {
			this.remoteDescription = remoteDescription;
		}

		return remoteDescription;
	}
}
