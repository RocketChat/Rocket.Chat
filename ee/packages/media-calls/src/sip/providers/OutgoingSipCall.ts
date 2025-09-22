import type { IMediaCall, IMediaCallChannel, MediaCallSignedContact } from '@rocket.chat/core-typings';
import { MediaCallNegotiations, MediaCalls } from '@rocket.chat/models';
import type Srf from 'drachtio-srf';
import type { SrfRequest } from 'drachtio-srf';

import { BaseSipCall } from './BaseSipCall';
import type { InternalCallParams } from '../../definition/common';
import { logger } from '../../logger';
import { BroadcastActorAgent } from '../../server/BroadcastAgent';
import { MediaCallDirector } from '../../server/CallDirector';
import type { SipServerSession } from '../Session';
import { SipError, SipErrorCodes } from '../errorCodes';
import { ClientMediaSignalBody } from '@rocket.chat/media-signaling';

export class OutgoingSipCall extends BaseSipCall {
	private sipDialog: Srf.Dialog | null;

	private sipDialogReq: SrfRequest | null;

	private processedTransfer: boolean;

	constructor(
		session: SipServerSession,
		call: IMediaCall,
		protected readonly agent: BroadcastActorAgent,
		channel: IMediaCallChannel,
	) {
		super(session, call, agent, channel);
		this.sipDialog = null;
		this.sipDialogReq = null;
		this.processedTransfer = false;
	}

	public static async createCall(session: SipServerSession, params: InternalCallParams): Promise<IMediaCall> {
		logger.debug({ msg: 'OutgoingSipCall.createCall', params });

		const { callee, ...extraParams } = params;

		// pre-sign the callee to this session
		const signedCallee: MediaCallSignedContact = {
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

	protected async reflectCall(call: IMediaCall, params: { dtmf?: ClientMediaSignalBody<'dtmf'> }): Promise<void> {
		logger.debug({ msg: 'OutgoingSipCall.reflectCall', call, lastCallState: this.lastCallState, params });
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

		const updateResult = await MediaCalls.startRingingById(call._id, MediaCallDirector.getNewExpirationTime());
		if (!updateResult.modifiedCount) {
			logger.debug({ msg: 'unable to set call state to ringing; skipping dialog creation.' });
			return;
		}

		this.lastCallState = 'ringing';
		const referredBy = call.parentCallId && this.session.geContactUri(call.createdBy);

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
						logger.debug({ msg: 'OutgoingSipCall.createDialog - got provisional response', provRes });
					},
					cbRequest: (_error: unknown, req: SrfRequest) => {
						logger.debug({ msg: 'OutgoingSipCall.createDialog - request initiated', req });
						if (req) {
							this.sipDialogReq = req;
							req.on('response', (res, ack) => {
								logger.debug({ msg: 'OutgoingSipCall - request got a response', req, res, ack });
							});
						}
					},
				},
			);
		} catch (error) {
			this.sipDialog = null;
			logger.error({ msg: 'OutgoingSipCall.createDialog - failed to create sip dialog', error });
			const errorCode = this.getSipErrorCode(error);
			if (errorCode) {
				void MediaCallDirector.hangupByServer(call, `sip-error-${errorCode}`);
				this.cancelAnyPendingRequest();
				return;
			}
		}

		if (!this.sipDialog) {
			logger.debug({ msg: 'OutgoingSipCall.createDialog - no dialog' });
			this.cancelAnyPendingRequest();
			void MediaCallDirector.hangupByServer(call, 'failed-to-create-sip-dialog');
			return;
		}

		logger.debug({ msg: 'OutgoingSipCall.createDialog - dialog created', callId: this.sipDialog.sip?.callId });
		this.sipDialog.on('destroy', () => {
			logger.debug({ msg: 'OutgoingSipCall - uac.destroy' });
			this.sipDialog = null;
			void MediaCallDirector.hangup(call, this.agent, 'remote');
		});

		logger.debug({ msg: 'OutgoingSipCall.createDialog - remote data', data: this.sipDialog.remote });

		// This will not do anything if the call is no longer waiting to be accepted.
		await MediaCallDirector.acceptCall(call, this.agent, {
			calleeContractId: this.session.sessionId,
			webrtcAnswer: { type: 'answer', sdp: this.sipDialog.remote.sdp },
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

		this.processedTransfer = true;

		try {
			// Sip targets can only be referred to other sip users
			const newCallee = await MediaCallDirector.cast.getContactForActor(call.transferredTo, { requiredType: 'sip' });
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
			} as unknown as SrfRequest);

			if (res.status === 202) {
				logger.debug({ msg: 'REFER was accepted', method: 'OutgoingSipCall.processTransferredCall' });
			}
		} catch (error) {
			logger.debug({ msg: 'REFER failed', method: 'OutgoingSipCall.processTransferredCall', error });
			if (!call.ended) {
				void MediaCallDirector.hangupByServer(call, 'sip-refer-failed');
			}
			return this.processEndedCall();
		}
	}

	protected async processEndedCall(): Promise<void> {
		if (this.lastCallState === 'hangup') {
			return;
		}

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
