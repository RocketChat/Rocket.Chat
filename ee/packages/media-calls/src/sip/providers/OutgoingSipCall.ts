import type { IMediaCall, IMediaCallChannel, MediaCallSignedContact } from '@rocket.chat/core-typings';
import { isBusyState, type ClientMediaSignalBody, type CallHangupReason } from '@rocket.chat/media-signaling';
import { MediaCallNegotiations, MediaCalls } from '@rocket.chat/models';
import type Srf from 'drachtio-srf';
import type { SrfRequest, SrfResponse } from 'drachtio-srf';

import { BaseSipCall } from './BaseSipCall';
import type { InternalCallParams } from '../../definition/common';
import { logger } from '../../logger';
import { BroadcastActorAgent } from '../../server/BroadcastAgent';
import { mediaCallDirector } from '../../server/CallDirector';
import type { SipServerSession } from '../Session';
import { SipError, SipErrorCodes } from '../errorCodes';

type OutgoingSipCallNegotiation = {
	id: string;
	req: SrfRequest;
	res: SrfResponse;
	isFirst: boolean;
	offer: RTCSessionDescriptionInit | null;
	answer: RTCSessionDescriptionInit | null;
};

export class OutgoingSipCall extends BaseSipCall {
	private sipDialog: Srf.Dialog | null;

	private sipDialogReq: SrfRequest | null;

	private inboundRenegotiations: Map<string, OutgoingSipCallNegotiation>;

	private processedTransfer: boolean;

	constructor(
		session: SipServerSession,
		call: IMediaCall,
		protected override readonly agent: BroadcastActorAgent,
		channel: IMediaCallChannel,
	) {
		super(session, call, agent, channel);
		this.sipDialog = null;
		this.sipDialogReq = null;
		this.processedTransfer = false;
		this.inboundRenegotiations = new Map();
	}

	public static async createCall(session: SipServerSession, params: InternalCallParams): Promise<IMediaCall> {
		logger.debug({ msg: 'OutgoingSipCall.createCall', sessionId: session.sessionId });
		const { callee, ...extraParams } = params;

		// pre-sign the callee to this session
		const signedCallee: MediaCallSignedContact = {
			...callee,
			contractId: session.sessionId,
		};

		const calleeAgent = await mediaCallDirector.cast.getAgentForActorAndRole(signedCallee, 'callee');
		if (!calleeAgent) {
			throw new SipError(SipErrorCodes.NOT_FOUND, 'Callee agent not found');
		}

		if (!(calleeAgent instanceof BroadcastActorAgent)) {
			throw new SipError(SipErrorCodes.INTERNAL_SERVER_ERROR, 'Caller agent not valid');
		}

		const callerAgent = await mediaCallDirector.cast.getAgentForActorAndRole(params.caller, 'caller');
		if (!callerAgent) {
			throw new SipError(SipErrorCodes.NOT_FOUND, 'Caller agent not found');
		}

		const call = await mediaCallDirector.createCall({
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

	protected async reflectCall(call: IMediaCall, params: { dtmf?: ClientMediaSignalBody<'dtmf'> }): Promise<void> {
		if (params.dtmf && this.sipDialog) {
			return this.sendDTMF(this.sipDialog, params.dtmf.dtmf, params.dtmf.duration || 2000);
		}

		if (call.transferredTo && call.transferredBy) {
			return this.processTransferredCall(call);
		}

		if (call.state === 'hangup') {
			return this.processEndedCall();
		}

		if (this.lastCallState === 'none') {
			return this.createDialog(call);
		}

		if (isBusyState(call.state)) {
			return this.processNegotiations(call);
		}

		logger.debug({ msg: 'no changes detected', method: 'OutgoingSipCall.reflectCall' });
	}

	protected async createDialog(call: IMediaCall): Promise<void> {
		logger.debug({ msg: 'OutgoingSipCall.createDialog', call });
		if (this.lastCallState !== 'none' || this.sipDialog) {
			logger.debug({ msg: 'invalid state to create an outgoing dialog' });
			return;
		}

		const negotiation = await MediaCallNegotiations.findLatestByCallId(call._id);
		if (!negotiation?.offer) {
			return;
		}

		const updateResult = await MediaCalls.startRingingById(call._id, mediaCallDirector.getNewExpirationTime());
		if (!updateResult.modifiedCount) {
			logger.debug({ msg: 'unable to set call state to ringing; skipping dialog creation.' });
			return;
		}

		this.lastCallState = 'ringing';
		const referredBy = call.parentCallId && this.session.geContactUri(call.createdBy);

		let hangupReason: CallHangupReason | null = null;
		try {
			this.sipDialog = await this.session.createSipDialog(
				this.call.callee.id,
				{
					localSdp: negotiation.offer.sdp,
					callingName: call.caller.displayName,
					callingNumber: call.caller.sipExtension,
					...(referredBy && {
						headers: {
							'Referred-By': referredBy,
						},
					}),
				},
				{
					cbProvisional: (provRes) => {
						logger.debug({
							msg: 'OutgoingSipCall.createDialog - got provisional response',
							provRes: provRes && this.session.stripDrachtioServerDetails(provRes),
						});
					},
					cbRequest: (err: unknown, req: SrfRequest) => {
						if (err) {
							logger.error({
								msg: 'OutgoingSipCall.createDialog - request failed',
								err,
							});
							void mediaCallDirector.hangupByServer(call, 'signaling-error');
							return;
						}

						if (req) {
							logger.debug({
								msg: 'OutgoingSipCall.createDialog - request initiated',
								req: this.session.stripDrachtioServerDetails(req),
							});

							this.sipDialogReq = req;
							req.on('response', (res, ack) => {
								logger.debug({
									msg: 'OutgoingSipCall - request got a response',
									req: this.session.stripDrachtioServerDetails(req),
									res: res && this.session.stripDrachtioServerDetails(res),
									ack,
								});
							});
						}
					},
				},
			);

			if (!this.sipDialog) {
				logger.debug({ msg: 'OutgoingSipCall.createDialog - no dialog' });
			}
		} catch (error) {
			this.sipDialog = null;
			const errorCode = this.getSipErrorCode(error);
			hangupReason = this.getHangupReasonForSipErrorCode(errorCode);

			if (!hangupReason || hangupReason.includes('error')) {
				logger.error({ msg: 'OutgoingSipCall.createDialog - failed to create sip dialog', err: error, callId: call._id });
			} else {
				logger.info({ msg: 'SIP call failed with a natural reason', hangupReason, callId: call._id, err: error });
			}
		}

		if (!this.sipDialog) {
			this.cancelAnyPendingRequest();
			void mediaCallDirector.hangupByServer(call, hangupReason || 'signaling-error');
			return;
		}

		logger.debug({ msg: 'OutgoingSipCall.createDialog - dialog created', callId: this.sipDialog.sip?.callId });
		this.sipDialog.on('destroy', () => {
			logger.debug({ msg: 'OutgoingSipCall - uac.destroy' });
			this.sipDialog = null;
			void mediaCallDirector.hangup(call, this.agent, 'remote');
		});

		this.sipDialog.on('modify', async (req, res) => {
			const webrtcOffer: RTCSessionDescriptionInit = { type: 'offer', sdp: req.body };
			let negotiationId: string | null = null;

			logger.debug({
				msg: 'OutgoingSipCall received a renegotiation',
				callingNumber: req?.callingNumber,
				calledNumber: req?.calledNumber,
			});

			try {
				negotiationId = await mediaCallDirector.startNewNegotiation(this.call, 'callee', webrtcOffer);

				const callerAgent = await mediaCallDirector.cast.getAgentForActorAndRole(this.call.caller, 'caller');
				if (!callerAgent) {
					logger.error({ msg: 'Failed to retrieve caller agent', method: 'OutgoingSipCall.uac.modify', caller: this.call.caller });
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

				callerAgent.onRemoteDescriptionChanged(this.call._id, negotiationId);

				logger.debug({ msg: 'modify', method: 'OutgoingSipCall.createDialog', req: this.session.stripDrachtioServerDetails(req) });
			} catch (err) {
				logger.error({ msg: 'An unexpected error occured while processing a modify event on an OutgoingSipCall dialog', err });

				try {
					res.send(SipErrorCodes.INTERNAL_SERVER_ERROR);
				} catch {
					//
				}

				if (!negotiationId) {
					return;
				}

				// If we got an error after the negotiation was registered on our side, the state is unpredictable - but it wasn't our side who needed this negotiation anyway
				this.inboundRenegotiations.delete(negotiationId);
			}
		});

		logger.debug({ msg: 'OutgoingSipCall.createDialog - remote data', data: this.sipDialog.remote });

		// This will not do anything if the call is no longer waiting to be accepted.
		await mediaCallDirector.acceptCall(call, this.agent, {
			calleeContractId: this.session.sessionId,
			webrtcAnswer: { type: 'answer', sdp: this.sipDialog.remote.sdp },
		});
	}

	protected async getPendingInboundNegotiation(): Promise<OutgoingSipCallNegotiation | null> {
		for await (const localNegotiation of this.inboundRenegotiations.values()) {
			if (localNegotiation.answer) {
				continue;
			}

			// If the negotiation does not exist, remove it from the list
			const negotiation = await MediaCallNegotiations.findOneById(localNegotiation.id);
			// Negotiation will always exist; This is just a safe guard
			if (!negotiation) {
				logger.error({ msg: 'Invalid Negotiation reference on OutgoingSipCall.', localNegotiation: localNegotiation.id });
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

	protected async processNegotiations(call: IMediaCall): Promise<void> {
		const negotiation = await MediaCallNegotiations.findLatestByCallId(call._id);
		if (negotiation?.offerer !== 'caller' || !negotiation.offer?.sdp || negotiation.answer) {
			return this.processCalleeNegotiations();
		}

		if (!this.sipDialog) {
			return;
		}

		logger.debug('OutgoingSipCall.processNegotiations');
		let answer: string | void = undefined;
		try {
			answer = await this.sipDialog.modify(negotiation.offer.sdp).catch(() => {
				logger.debug('modify failed');
			});
		} catch (err) {
			logger.error({ msg: 'Error on OutgoingSipCall.processNegotiations', err });
		}

		if (!answer) {
			logger.error({ msg: 'No answer from callee initiated negotiation' });
			// If a caller initiated negotiation fails, we need to hangup
			void mediaCallDirector.hangupDetachedCall(call, { reason: 'renegotiation-failed', endedBy: call.caller });
			return;
		}

		await mediaCallDirector.saveWebrtcSession(
			call,
			this.agent,
			{ sdp: { sdp: answer, type: 'answer' }, negotiationId: negotiation._id },
			this.session.sessionId,
		);
	}

	protected async processCalleeNegotiations(): Promise<void> {
		const localNegotiation = await this.getPendingInboundNegotiation();
		// If we don't have an sdp, we can't respond to it yet
		if (!localNegotiation?.answer?.sdp) {
			return;
		}

		logger.debug('OutgoingSipCall.processCalleeNegotiations');
		localNegotiation.res.send(200, {
			body: localNegotiation.answer.sdp,
		});
	}

	protected async processTransferredCall(call: IMediaCall): Promise<void> {
		if (this.lastCallState === 'hangup' || !call.transferredTo || !call.transferredBy) {
			return;
		}

		if (!this.sipDialog || this.processedTransfer) {
			if (call.ended) {
				return this.processEndedCall();
			}
			return;
		}

		logger.debug({ msg: 'OutgoingSipCall.processTransferredCall', callId: call._id, lastCallState: this.lastCallState });
		this.processedTransfer = true;

		try {
			// Sip targets can only be referred to other sip users
			const newCallee = await mediaCallDirector.cast.getContactForActor(call.transferredTo, { requiredType: 'sip' });
			if (!newCallee) {
				throw new Error('invalid-transfer');
			}

			const referTo = this.session.geContactUri(newCallee);
			const referredBy = this.session.geContactUri(call.transferredBy);

			const res = await this.sipDialog.request({
				method: 'REFER',
				headers: {
					'Refer-To': referTo,
					'Referred-By': referredBy,
				},
			});

			if (res.status === 202) {
				logger.debug({ msg: 'REFER was accepted', method: 'OutgoingSipCall.processTransferredCall' });
			}
		} catch (err) {
			logger.error({ msg: 'REFER failed', method: 'OutgoingSipCall.processTransferredCall', err, callId: call._id });
			if (!call.ended) {
				void mediaCallDirector.hangupByServer(call, 'signaling-error');
			}
			return this.processEndedCall();
		}
	}

	protected async processEndedCall(): Promise<void> {
		if (this.lastCallState === 'hangup') {
			return;
		}

		logger.debug({ msg: 'OutgoingSipCall.processEndedCall', lastCallState: this.lastCallState });

		this.cancelAnyPendingRequest();

		const { sipDialog } = this;
		this.sipDialog = null;
		this.lastCallState = 'hangup';

		if (sipDialog) {
			sipDialog.destroy();
		}
	}

	private getSipErrorCode(error: unknown): number | null {
		if (!error || typeof error !== 'object') {
			return null;
		}

		if (!('name' in error) || error.name !== 'SipError') {
			return null;
		}

		if (!('status' in error) || typeof error.status !== 'number') {
			return null;
		}

		return error.status;
	}

	private getHangupReasonForSipErrorCode(errorCode: number | null): CallHangupReason | null {
		if (!errorCode) {
			return null;
		}

		switch (errorCode) {
			case SipErrorCodes.DECLINED:
				return 'rejected';
			case SipErrorCodes.UNWANTED:
				return 'rejected';
			case SipErrorCodes.NOT_ACCEPTABLE_HERE:
				return 'service-error';
		}

		return null;
	}

	private cancelAnyPendingRequest(): void {
		if (!this.sipDialogReq) {
			return;
		}

		const req = this.sipDialogReq;
		this.sipDialogReq = null;

		try {
			req.cancel(() => null);
		} catch {
			// ignore errors on cancel
		}
	}
}
