import type { IMediaCall, IMediaCallChannel, MediaCallContact } from '@rocket.chat/core-typings';
import type { ClientMediaSignalBody } from '@rocket.chat/media-signaling';
import { MediaCalls } from '@rocket.chat/models';
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

	protected abstract inboundRenegotiations: Map<string, SipCallNegotiation>;

	constructor(
		protected readonly session: SipServerSession,
		call: IMediaCall,
		protected readonly agent: BroadcastActorAgent,
		protected readonly channel: IMediaCallChannel,
	) {
		super(call);
		this.lastCallState = 'none';
	}

	protected async handleDialogModify(req: SrfRequest, res: SrfResponse): Promise<void> {
		await this.processInboundRenegotiation(req, res);

		const { callingNumber } = req;
		const newContact = await this.detectSipInitiatedTransfer(callingNumber);

		if (newContact) {
			return this.updateRemoteContact(newContact);
		}
	}

	protected async detectSipInitiatedTransfer(callingNumber: string): Promise<MediaCallContact | null> {
		if (!callingNumber) {
			return null;
		}

		const newContact = await mediaCallDirector.cast.getContactForActor({ type: 'sip', id: callingNumber }, { requiredType: 'sip' });
		if (!newContact) {
			return null;
		}

		const currentContact = this.agent.getMyCallActor(this.call);
		if (this.isSameParty(newContact, currentContact)) {
			return null;
		}

		return newContact;
	}

	private isSameParty(a: MediaCallContact, b: MediaCallContact): boolean {
		if (a.type === b.type && a.id === b.id) {
			return true;
		}

		const aNumber = this.normalizePhoneIdentity(a.sipExtension ?? a.id);
		const bNumber = this.normalizePhoneIdentity(b.sipExtension ?? b.id);

		return Boolean(aNumber) && aNumber === bNumber;
	}

	private normalizePhoneIdentity(value: string | undefined): string {
		// TODO: Define what we accept as a valid extension value
		return value?.replace(/\D/g, '') ?? '';
	}

	protected async updateRemoteContact(newContact: MediaCallContact): Promise<void> {
		const { call } = this;
		const sipRole = this.agent.role;
		const previousContact = this.agent.getMyCallActor(call);

		logger.info({
			msg: 'Updating Remote Contact on SIP Call',
			type: this.constructor.name,
			callId: call._id,
			previousContact,
			newContact,
			sipRole,
		});

		const contact = {
			contractId: previousContact.contractId,
			...newContact,
		};

		const updateResult = await MediaCalls.updateParticipantsById(call._id, {
			[sipRole]: contact,
		});

		if (!updateResult.modifiedCount) {
			logger.debug({ msg: 'Unable to change call participants', callId: call._id, sipRole, newContact });
			return;
		}

		const agent = this.agent.oppositeAgent;
		if (!agent) {
			return;
		}

		await agent.onCallUpdated(call._id);
	}

	/**
	 * Registers a new inbound renegotiation initiated by the SIP actor and notifies the opposite agent that a
	 * remote description is available.
	 */
	protected async processInboundRenegotiation(req: SrfRequest, res: SrfResponse): Promise<void> {
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
					method: 'processInboundRenegotiation',
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
				method: 'processInboundRenegotiation',
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

	public override async reactToCallChanges(params: { dtmf?: ClientMediaSignalBody<'dtmf'> }): Promise<void> {
		logger.debug({ msg: 'reactToCallChanges', type: this.constructor.name, callId: this.call._id, lastCallState: this.lastCallState });

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

		if (callActor.type !== 'sip' || callActor.contractId !== this.session.sessionId) {
			return;
		}

		return this.reflectCall(freshCall, params);
	}

	protected abstract reflectCall(call: IMediaCall, params: { dtmf?: ClientMediaSignalBody<'dtmf'> }): Promise<void>;

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
}
