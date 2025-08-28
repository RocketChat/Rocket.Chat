import type { IMediaCall, IMediaCallChannel, MediaCallSignedActor } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { MediaCalls } from '@rocket.chat/models';
import type Srf from 'drachtio-srf';

import { BaseSipCall } from './BaseSipCall';
import type { InternalCallParams } from '../../definition/common';
import { logger } from '../../logger';
import { BroadcastActorAgent } from '../../server/BroadcastAgent';
import { MediaCallDirector } from '../../server/CallDirector';
import type { SipServerSession } from '../Session';
import { SipError, SipErrorCodes } from '../errorCodes';

type OutgoingSipCallEvents = {
	request: void;
	provisionalResponse: void;
};

export class OutgoingSipCall extends BaseSipCall {
	public readonly emitter: Emitter<OutgoingSipCallEvents>;

	private sipDialog: Srf.Dialog | null;

	constructor(
		session: SipServerSession,
		call: IMediaCall,
		protected readonly agent: BroadcastActorAgent,
		channel: IMediaCallChannel,
	) {
		super(session, call, agent, channel);
		this.emitter = new Emitter();
		this.sipDialog = null;
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

		if (!(calleeAgent instanceof BroadcastActorAgent)) {
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

		const channel = await calleeAgent.getOrCreateChannel(call, session.sessionId);

		const sipCall = new OutgoingSipCall(session, call, calleeAgent, channel);
		session.registerCall(sipCall);
		calleeAgent.provider = sipCall;

		// report to the caller that the call was created
		await callerAgent.onCallCreated(call);

		return call;
	}

	protected async reflectCall(call: IMediaCall): Promise<void> {
		logger.debug({ msg: 'OutgoingSipCall.reflectCall', call, lastCallState: this.lastCallState });
		if (call.state === 'hangup') {
			return this.processEndedCall();
		}

		if (this.lastCallState === 'none') {
			if (!call.webrtcOffer) {
				return;
			}

			return this.createDialog(call);
		}
	}

	protected async createDialog(call: IMediaCall): Promise<void> {
		if (this.lastCallState !== 'none' || !call.webrtcOffer) {
			return;
		}

		const updateResult = await MediaCalls.startRingingById(call._id, MediaCallDirector.getNewExpirationTime());
		if (!updateResult.modifiedCount) {
			return;
		}

		this.lastCallState = 'ringing';
		console.log('calling');

		const uac = await this.session.createSipDialog(
			this.call.callee.id,
			{
				localSdp: call.webrtcOffer.sdp,
				callingName: call.caller.displayName,
				callingNumber: call.caller.sipExtension,
			},
			{
				cbProvisional: (provRes) => {
					console.log('provisional response', provRes);
					this.emitter.emit('provisionalResponse');
				},
				cbRequest: (req) => {
					console.log('request', req);
					this.emitter.emit('request');
				},
			},
		);

		if (!uac) {
			console.log('failed');
			void MediaCallDirector.hangupByServer(call, 'failed-to-create-sip-dialog');
			return;
		}

		console.log(`dialog established, call-id is ${uac?.sip?.callId}`);
		uac.on('destroy', () => {
			console.log('uac.destroy');
			this.sipDialog = null;
			// This will only terminate the call "by server" if it hasn't already ended by an user action
			void MediaCallDirector.hangupByServer(call, 'sip-dialog-destroyed');
		});

		this.sipDialog = uac;

		console.log('remote', uac.remote);

		// This will not do anything if the call is no longer waiting to be accepted.
		await MediaCallDirector.acceptCall(call, this.agent, {
			calleeContractId: this.session.sessionId,
			webrtcAnswer: { type: 'answer', sdp: uac.remote.sdp },
		});
	}

	protected async processEndedCall(): Promise<void> {
		if (this.lastCallState === 'hangup') {
			return;
		}

		const { sipDialog } = this;
		this.sipDialog = null;
		this.lastCallState = 'hangup';

		if (sipDialog) {
			sipDialog.destroy();
		}
	}
}
