import type { IMediaCall } from '@rocket.chat/core-typings';
import type { CallHangupReason, ClientMediaSignalBody } from '@rocket.chat/media-signaling';
import { MediaCalls, MediaCallNegotiations } from '@rocket.chat/models';
import type Srf from 'drachtio-srf';
import type { SrfRequest, SrfResponse } from 'drachtio-srf';

import { BaseCallProvider } from '../../base/BaseCallProvider';
import { logger } from '../../logger';
import type { BroadcastActorAgent } from '../../server/BroadcastAgent';
import { mediaCallDirector } from '../../server/CallDirector';
import type { SipServerSession } from '../Session';
import { SipErrorCodes } from '../errorCodes';

export type SipCallNegotiation = {
	id: string;
	req: SrfRequest;
	res: SrfResponse;
	isFirst: boolean;
	offer: RTCSessionDescriptionInit | null;
	answer: RTCSessionDescriptionInit | null;
};

export abstract class BaseSipCall extends BaseCallProvider {
	protected lastCallState: IMediaCall['state'];

	protected inboundRenegotiations: Map<string, SipCallNegotiation>;

	protected sipDialog: Srf.Dialog | null;

	protected processedTransfer: boolean;

	constructor(
		protected readonly session: SipServerSession,
		call: IMediaCall,
		protected readonly agent: BroadcastActorAgent,
	) {
		super(call);
		this.lastCallState = 'none';
		this.sipDialog = null;
		this.inboundRenegotiations = new Map();
		this.processedTransfer = false;
	}

	/**
	 * Handles a 'modify' event (a re-INVITE) on the SIP dialog by registering a new inbound renegotiation
	 * initiated by the SIP actor and notifying the opposite agent that a remote description is available.
	 */
	protected async handleDialogModify(req: SrfRequest, res: SrfResponse): Promise<void> {
		const webrtcOffer: RTCSessionDescriptionInit = { type: 'offer', sdp: req.body };
		let negotiationId: string | null = null;

		logger.debug({
			msg: `Sip call received a renegotiation`,
			type: this.constructor.name,
			callingNumber: req.callingNumber,
			calledNumber: req.calledNumber,
			callId: this.call._id,
		});

		try {
			// The SIP actor is the one offering this renegotiation, so its own agent role is the offerer
			negotiationId = await mediaCallDirector.startNewNegotiation(this.call, this.agent.role, webrtcOffer);

			const oppositeActor = this.agent.getOtherCallActor(this.call);
			const oppositeAgent = await mediaCallDirector.cast.getAgentForActorAndRole(oppositeActor, this.agent.oppositeRole);
			if (!oppositeAgent) {
				logger.error({
					msg: 'Failed to retrieve opposite agent',
					method: 'handleDialogModify',
					type: this.constructor.name,
					actor: oppositeActor,
					callId: this.call._id,
				});
				res.send(SipErrorCodes.TEMPORARILY_UNAVAILABLE);
				return;
			}

			this.inboundRenegotiations.set(negotiationId, {
				id: negotiationId,
				req,
				res,
				isFirst: false,
				offer: webrtcOffer,
				answer: null,
			});

			void oppositeAgent.onRemoteDescriptionChanged(this.call._id, negotiationId).catch(() => null);

			logger.debug({
				msg: 'Modified SIP Call',
				method: 'handleDialogModify',
				type: this.constructor.name,
				req: this.session.stripDrachtioServerDetails(req),
				callId: this.call._id,
			});
		} catch (err) {
			logger.error({ msg: 'An unexpected error occured while processing a modify event on a SIP call dialog', err });

			try {
				res.send(SipErrorCodes.INTERNAL_SERVER_ERROR);
			} catch {
				//
			}

			if (!negotiationId) {
				return;
			}

			// If we got an error after the negotiation was registered on our side, the state is unpredictable.
			this.inboundRenegotiations.delete(negotiationId);
			this.onDialogModifyError(negotiationId);
		}
	}

	/** Hook for subclasses to react to a failed 'modify' event after the negotiation was already registered. */
	protected onDialogModifyError(_negotiationId: string): void {
		// no extra handling by default
	}

	protected onDialogDestroyed(): void {
		logger.debug({
			msg: 'SIP Dialog Destroyed',
			type: this.constructor.name,
			callId: this.call._id,
		});

		this.sipDialog = null;
		this.hangupCall('remote');
	}

	public override async reactToCallChanges(params: { dtmf?: ClientMediaSignalBody<'dtmf'> }): Promise<void> {
		// If we already knew this call was over, there's nothing more to reflect
		if (this.lastCallState === 'hangup') {
			return;
		}

		const freshCall = await MediaCalls.findOneById(this.call._id);
		if (!freshCall) {
			return;
		}

		// Don't do anything unless our agent has one of the call's signed actors
		const callActor = this.agent.getMyCallActor(freshCall);

		if (!this.agent.isRepresentingActor(callActor) || callActor.contractId !== this.session.sessionId) {
			return;
		}

		return this.reflectCall(freshCall, params);
	}

	protected abstract reflectCall(call: IMediaCall, params: { dtmf?: ClientMediaSignalBody<'dtmf'> }): Promise<void>;

	protected abstract processEndedCall(call: IMediaCall): Promise<void>;

	protected async sendDTMF(dialog: Srf.Dialog, dtmf: string, duration: number): Promise<void> {
		logger.debug({ msg: 'BaseSipCall.sendDTMF' });
		await dialog.request({
			method: 'INFO',
			headers: {
				'Content-Type': 'application/dtmf-relay',
			},
			body: `Signal=${dtmf}\r\nDuration=${duration}`,
		});
	}

	protected hangupCall(hangupReason: CallHangupReason): void {
		void mediaCallDirector.hangup(this.call, this.agent, hangupReason).catch((err) => {
			logger.debug({ msg: 'Unexpected error ending call', err, type: this.constructor.name, hangupReason });
		});
	}

	protected async processTransferredCall(call: IMediaCall): Promise<void> {
		if (this.lastCallState === 'hangup' || !call.transferredTo || !call.transferredBy) {
			return;
		}

		if (!this.sipDialog || this.processedTransfer) {
			if (call.ended) {
				return this.processEndedCall(call);
			}
			return;
		}

		logger.debug({ msg: 'processTransferredCall', callId: call._id, lastCallState: this.lastCallState, type: this.constructor.name });
		this.processedTransfer = true;

		try {
			await this.session.sendReferRequest(this.sipDialog, {
				transferredTo: call.transferredTo,
				transferredBy: call.transferredBy,
			});
		} catch (err) {
			logger.error({ msg: 'REFER failed', method: 'processTransferredCall', err, callId: call._id, type: this.constructor.name });
			if (!call.ended) {
				this.hangupCall('signaling-error');
			}
			return this.processEndedCall(call);
		}
	}

	protected async getPendingInboundNegotiation(): Promise<SipCallNegotiation | null> {
		for (const localNegotiation of this.inboundRenegotiations.values()) {
			if (localNegotiation.answer) {
				continue;
			}

			// If the negotiation does not exist, remove it from the list
			const negotiation = await MediaCallNegotiations.findOneById(localNegotiation.id);
			// Negotiation will always exist; This is just a safe guard
			if (!negotiation) {
				logger.error({ msg: 'Invalid Negotiation reference.', localNegotiation: localNegotiation.id, type: this.constructor.name });
				this.inboundRenegotiations.delete(localNegotiation.id);
				if (localNegotiation.res) {
					localNegotiation.res.send(SipErrorCodes.INTERNAL_SERVER_ERROR);
				}
				continue;
			}

			if (negotiation.answer) {
				localNegotiation.answer = negotiation.answer;
			}

			return localNegotiation;
		}

		return null;
	}
}
