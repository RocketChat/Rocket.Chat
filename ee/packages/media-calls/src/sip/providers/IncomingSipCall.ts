import type {
	MediaCallSignedContact,
	IMediaCall,
	MediaCallContactInformation,
	MediaCallContact,
	IMediaCallChannel,
} from '@rocket.chat/core-typings';
import { isBusyState, type ClientMediaSignalBody } from '@rocket.chat/media-signaling';
import { MediaCallNegotiations, MediaCalls } from '@rocket.chat/models';
import type { SipMessage, SrfRequest, SrfResponse } from 'drachtio-srf';
import type Srf from 'drachtio-srf';

import { BaseSipCall, type SipCallNegotiation } from './BaseSipCall';
import { SIP_CALL_FEATURES } from '../../constants';
import { logger } from '../../logger';
import { BroadcastActorAgent } from '../../server/BroadcastAgent';
import { mediaCallDirector } from '../../server/CallDirector';
import { getMediaCallServer } from '../../server/injection';
import type { SipServerSession } from '../Session';
import { SipError, SipErrorCodes } from '../errorCodes';

export class IncomingSipCall extends BaseSipCall {
	protected inboundRenegotiations: Map<string, SipCallNegotiation>;

	constructor(
		session: SipServerSession,
		call: IMediaCall,
		protected override readonly agent: BroadcastActorAgent,
		channel: IMediaCallChannel,
		private readonly srf: Srf,
		private readonly req: SrfRequest,
		private readonly res: SrfResponse,
	) {
		super(session, call, agent, channel);
		this.sipDialog = null;
		this.inboundRenegotiations = new Map();
		this.processedTransfer = false;
		this.processedEscalation = false;
	}

	public static async processInvite(session: SipServerSession, srf: Srf, req: SrfRequest, res: SrfResponse): Promise<IncomingSipCall> {
		logger.debug({ msg: 'IncomingSipCall.processInvite' });
		if (!req.isNewInvite) {
			logger.error({ msg: 'IncomingSipCall.processInvite received a request that is not a new invite.' });
			throw new SipError(SipErrorCodes.NOT_IMPLEMENTED, 'not-a-new-invite');
		}

		let sipCall: IncomingSipCall | null = null;

		req.on('cancel', (message) => {
			sipCall?.cancel(message);
		});

		const callee = await this.getCalleeFromInvite(req);
		logger.debug({ msg: 'incoming call to', callee });

		// getCalleeFromInvite already ensures it, but let's safeguard that the callee is an internal user
		if (callee.type !== 'user' || !callee.id) {
			throw new SipError(SipErrorCodes.TEMPORARILY_UNAVAILABLE);
		}

		// User is literally busy
		if (await MediaCalls.hasUnfinishedCallsByUid(callee.id)) {
			throw new SipError(SipErrorCodes.TEMPORARILY_UNAVAILABLE);
		}

		if (!(await getMediaCallServer().permissionCheck(callee.id, 'external'))) {
			logger.debug({ msg: 'User with no permission received a sip call.', uid: callee.id });
			throw new SipError(SipErrorCodes.TEMPORARILY_UNAVAILABLE);
		}

		const caller = await this.getCallerContactFromInvite(session.sessionId, req);
		logger.debug({ msg: 'incoming call from', callerContact: caller });
		const webrtcOffer = { type: 'offer', sdp: req.body } as const;

		const callerAgent = await mediaCallDirector.cast.getAgentForActorAndRole(caller, 'caller');
		if (!callerAgent) {
			throw new SipError(SipErrorCodes.NOT_FOUND, 'Caller agent not found');
		}

		if (!(callerAgent instanceof BroadcastActorAgent)) {
			throw new SipError(SipErrorCodes.INTERNAL_SERVER_ERROR, 'Caller agent not valid');
		}

		const calleeAgent = await mediaCallDirector.cast.getAgentForActorAndRole(callee, 'callee');
		if (!calleeAgent) {
			throw new SipError(SipErrorCodes.NOT_FOUND, 'Callee agent not found');
		}

		const call = await mediaCallDirector.createCall({
			caller,
			callee,
			callerAgent,
			calleeAgent,
			features: SIP_CALL_FEATURES,
		});

		const negotiationId = await mediaCallDirector.startNewNegotiation(call, 'caller', webrtcOffer);

		const channel = await callerAgent.getOrCreateChannel(call, session.sessionId);

		sipCall = new IncomingSipCall(session, call, callerAgent, channel, srf, req, res);

		callerAgent.provider = sipCall;

		sipCall.inboundRenegotiations.set(negotiationId, {
			id: negotiationId,
			req,
			res,
			isFirst: true,
			offer: webrtcOffer,
			answer: null,
		});

		// Send the call to the callee client
		await calleeAgent.onCallCreated(call);

		return sipCall;
	}

	public async createDialog(localSdp: string): Promise<void> {
		logger.debug({ msg: 'IncomingSipCall.createDialog' });

		const uas = await this.srf.createUAS(this.req, this.res, {
			localSdp,
		});

		if (!uas) {
			logger.error({ msg: 'IncomingSipCall.createDialog - dialog creation failed', callId: this.callId });
			void mediaCallDirector.hangupByServer(this.call, 'signaling-error');
			return;
		}

		uas.on('modify', (req, res) => {
			void this.handleDialogModify(req, res);
		});

		uas.on('destroy', () => {
			logger.debug({ msg: 'IncomingSipCall - uas.destroy' });
			this.sipDialog = null;
			void mediaCallDirector.hangup(this.call, this.agent, 'remote');
		});

		this.sipDialog = uas;
	}

	protected cancel(res: SipMessage): void {
		logger.debug({ msg: 'IncomingSipCall.cancel', res: this.session.stripDrachtioServerDetails(res) });

		logger.info({ msg: 'The incoming SIP call was canceled by the caller', callId: this.callId });
		void mediaCallDirector.hangup(this.call, this.agent, 'remote').catch(() => null);
	}

	protected async reflectCall(call: IMediaCall, params: { dtmf?: ClientMediaSignalBody<'dtmf'> }): Promise<void> {
		if (params.dtmf && this.sipDialog) {
			return this.sendDTMF(this.sipDialog, params.dtmf.dtmf, params.dtmf.duration || 2000);
		}

		if (call.transferredTo && call.transferredBy) {
			return this.processTransferredCall(call);
		}

		if (call.escalatedAt) {
			return this.processEscalatedCall(call);
		}

		if (call.ended) {
			return this.processEndedCall(call);
		}

		if (isBusyState(call.state)) {
			return this.processNegotiations(call);
		}

		logger.debug({ msg: 'no changes detected', method: 'IncomingSipCall.reflectCall' });
	}

	protected async processEndedCall(call: IMediaCall): Promise<void> {
		logger.debug({ msg: 'IncomingSipCall.processEndedCall', lastCallState: this.lastCallState, hangupReason: call.hangupReason });

		switch (call.hangupReason) {
			case 'service-error':
				this.cancelPendingInvites(SipErrorCodes.NOT_ACCEPTABLE_HERE);
				break;
			case 'rejected':
				this.cancelPendingInvites(SipErrorCodes.DECLINED);
				break;
			default:
				this.cancelPendingInvites(SipErrorCodes.TEMPORARILY_UNAVAILABLE);
				break;
		}

		if (this.lastCallState === 'hangup') {
			return;
		}

		const { sipDialog } = this;
		this.sipDialog = null;
		this.lastCallState = 'hangup';

		if (sipDialog) {
			try {
				await sipDialog.destroy();
			} catch (err) {
				logger.error({ msg: 'Failed to destroy SIP dialog', err, method: 'IncomingSipCall.processEndedCall' });
			}
		}
	}

	protected override onDialogModifyError(_negotiationId: string): void {
		// On an incoming call the SIP caller drives the call, so an unrecoverable renegotiation must end it.
		this.hangupPendingCall(SipErrorCodes.INTERNAL_SERVER_ERROR);
	}

	private async getPendingInboundNegotiation(): Promise<SipCallNegotiation | null> {
		for (const localNegotiation of this.inboundRenegotiations.values()) {
			if (localNegotiation.answer) {
				continue;
			}

			// If the negotiation does not exist, remove it from the list
			const negotiation = await MediaCallNegotiations.findOneById(localNegotiation.id);
			// Negotiation will always exist; This is just a safe guard
			if (!negotiation) {
				logger.error({ msg: 'Invalid Negotiation reference on IncomingSipCall.', localNegotiation: localNegotiation.id });
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

	private async processNegotiations(call: IMediaCall): Promise<void> {
		const localNegotiation = await this.getPendingInboundNegotiation();
		if (!localNegotiation) {
			// Callee-initiated renegotiations are only processed if there's none initiated by the caller
			return this.processCalleeNegotiation(call);
		}

		// If we don't have an sdp, we can't respond to it yet
		if (!localNegotiation?.answer?.sdp) {
			return;
		}

		logger.debug('IncomingSipCall.processNegotiations');
		if (localNegotiation.isFirst) {
			return this.createDialog(localNegotiation.answer.sdp).catch(() => {
				logger.error('Failed to create incoming call dialog.');
				this.hangupPendingCall(SipErrorCodes.INTERNAL_SERVER_ERROR);
			});
		}

		localNegotiation.res.send(200, {
			body: localNegotiation.answer.sdp,
		});
	}

	private async processCalleeNegotiation(call: IMediaCall): Promise<void> {
		if (!this.sipDialog) {
			return;
		}

		const negotiation = await MediaCallNegotiations.findLatestByCallId(call._id);
		if (negotiation?.offerer !== 'callee' || !negotiation.offer?.sdp || negotiation.answer) {
			return;
		}

		logger.debug('IncomingSipCall.processCalleeNegotiation');
		let answer: string | void = undefined;
		try {
			answer = await this.sipDialog.modify(negotiation.offer.sdp).catch(() => {
				logger.debug('modify failed');
			});
		} catch (err) {
			logger.error({ msg: 'Error on IncomingSipCall.processCalleeNegotiation', err });
		}

		if (!answer) {
			logger.error({ msg: 'No answer from callee initiated negotiation' });
			return;
		}

		await mediaCallDirector.saveWebrtcSession(
			call,
			this.agent,
			{ sdp: { sdp: answer, type: 'answer' }, negotiationId: negotiation._id },
			this.session.sessionId,
		);
	}

	private cancelPendingInvites(errorCode: number): void {
		logger.debug({
			msg: 'IncomingSipCall.cancelPendingInvites',
			errorCode,
			hasDialog: Boolean(this.sipDialog),
			negotiations: this.inboundRenegotiations.size,
		});

		for (const localNegotiation of this.inboundRenegotiations.values()) {
			// if it has an answer sdp, we already responded to it
			if (localNegotiation.answer?.sdp) {
				continue;
			}

			try {
				localNegotiation.res.send(errorCode);
			} catch {
				//
			}
		}
		this.inboundRenegotiations.clear();
	}

	private hangupPendingCall(errorCode: number): void {
		logger.debug('IncomingSipCall.hangupPendingCall');

		this.cancelPendingInvites(errorCode);
		void mediaCallDirector.hangupByServer(this.call, `sip-error-${errorCode}`);
	}

	private static async getCalleeFromInvite(req: SrfRequest): Promise<MediaCallContact> {
		logger.debug({ msg: 'IncomingSipCall.getCalleeFromInvite', callingNumber: req.callingNumber, calledNumber: req.calledNumber });

		if (req.calledNumber && typeof req.calledNumber === 'string') {
			const userContact = await mediaCallDirector.cast.getContactForExtensionNumber(req.calledNumber, { requiredType: 'user' });
			if (userContact) {
				return userContact;
			}

			// If the invite had an id/extension but we couldn't match it to an user, respond with unavailable
			throw new SipError(SipErrorCodes.TEMPORARILY_UNAVAILABLE);
		}

		// If we couldn't even identify an id/extension from the invite, respond with not found
		throw new SipError(SipErrorCodes.NOT_FOUND);
	}

	private static async getRocketChatCallerFromInvite(req: SrfRequest): Promise<MediaCallContact | null> {
		logger.debug({
			msg: 'IncomingSipCall.getRocketChatCallerFromInvite',
			callingNumber: req.callingNumber,
			calledNumber: req.calledNumber,
		});

		if (req.callingNumber && typeof req.callingNumber === 'string') {
			const userContact = await mediaCallDirector.cast.getContactForExtensionNumber(req.callingNumber, { preferredType: 'sip' });
			if (userContact) {
				return userContact;
			}
		}

		return null;
	}

	private static async getCallerContactFromInvite(sessionId: string, req: SrfRequest): Promise<MediaCallSignedContact<'sip'>> {
		logger.debug({ msg: 'IncomingSipCall.getCallerContactFromInvite' });
		const callerBase = await this.getRocketChatCallerFromInvite(req);

		const displayNameFromHeader = req.has('X-RocketChat-Caller-Name') && req.get('X-RocketChat-Caller-Name');
		const usernameFromHeader = req.has('X-RocketChat-Caller-Username') && req.get('X-RocketChat-Caller-Username');

		const displayName = displayNameFromHeader || callerBase?.displayName || req.from;
		const username = usernameFromHeader || callerBase?.username || req.callingNumber;

		const sipExtension = req.callingNumber;

		const defaultContactInfo: MediaCallContactInformation = {
			username,
			sipExtension,
			displayName: displayName || sipExtension,
		};

		const contact = await mediaCallDirector.cast.getContactForExtensionNumber(sipExtension, { requiredType: 'sip' }, defaultContactInfo);

		if (contact) {
			return {
				...contact,
				contractId: sessionId,
			} as MediaCallSignedContact<'sip'>;
		}

		return {
			type: 'sip',
			id: sipExtension,
			contractId: sessionId,
			...defaultContactInfo,
		};
	}
}
