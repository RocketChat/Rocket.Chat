import type {
	IMediaCall,
	IMediaCallChannel,
	MediaCallActorType,
	MediaCallSignedActor,
	MediaCallSignedContact,
} from '@rocket.chat/core-typings';
import { isPendingState, isBusyState } from '@rocket.chat/media-signaling';
import type {
	ClientMediaSignalTransfer,
	CallAnswer,
	CallHangupReason,
	CallRole,
	ClientMediaSignal,
	ClientMediaSignalError,
	ClientMediaSignalLocalState,
	ServerMediaSignal,
} from '@rocket.chat/media-signaling';
import { MediaCallChannels, MediaCallNegotiations, MediaCalls } from '@rocket.chat/models';

import type { IMediaCallAgent } from '../../definition/IMediaCallAgent';
import { logger } from '../../logger';
import { mediaCallDirector } from '../../server/CallDirector';
import { getMediaCallServer } from '../../server/injection';
import { stripSensitiveDataFromSignal } from '../../server/stripSensitiveData';

export class UserActorSignalProcessor {
	public get contractId(): string {
		return this.channel.contractId;
	}

	public get callId(): string {
		return this.channel.callId;
	}

	public get actorId(): string {
		return this.channel.actorId;
	}

	public get actorType(): MediaCallActorType {
		return this.channel.actorType;
	}

	public get role(): CallRole {
		return this.channel.role;
	}

	public get actor(): MediaCallSignedActor {
		return {
			type: this.actorType,
			id: this.actorId,
			contractId: this.contractId,
		};
	}

	public readonly signed: boolean;

	public readonly ignored: boolean;

	constructor(
		protected readonly agent: IMediaCallAgent,
		protected readonly call: IMediaCall,
		protected readonly channel: IMediaCallChannel,
	) {
		const actor = call[channel.role];

		this.signed = Boolean(actor.contractId && actor.contractId === channel.contractId);
		this.ignored = Boolean(actor.contractId && actor.contractId !== channel.contractId);
	}

	public async requestWebRTCOffer(params: { negotiationId: string }): Promise<void> {
		logger.debug({ msg: 'UserActorSignalProcessor.requestWebRTCOffer', params });

		await this.sendSignal({
			callId: this.callId,
			toContractId: this.contractId,
			type: 'request-offer',
			...params,
		});
	}

	public async processSignal(signal: ClientMediaSignal): Promise<void> {
		if (signal.type !== 'local-state') {
			logger.debug({
				msg: 'UserActorSignalProcessor.processSignal',
				signal: stripSensitiveDataFromSignal(signal),
				role: this.role,
				signed: this.signed,
			});
		}

		// The code will only reach this point if one of the following conditions are true:
		// 1. the signal came from the exact user session where the caller initiated the call
		// 2. the signal came from the exact user session where the callee accepted the call
		// 3. the call has not been accepted yet and the signal came from a valid session from the callee
		// 4. It's a hangup request with reason = 'another-client' and the request came from any valid client of either user
		switch (signal.type) {
			case 'local-sdp':
				return this.saveLocalDescription(signal.sdp, signal.negotiationId);
			case 'answer':
				return this.processAnswer(signal.answer);
			case 'hangup':
				return this.hangup(signal.reason);
			case 'local-state':
				return this.reviewLocalState(signal);
			case 'error':
				return this.processError(signal);
			case 'negotiation-needed':
				return this.processNegotiationNeeded(signal.oldNegotiationId);
			case 'transfer':
				return this.processCallTransfer(signal.to);
			case 'dtmf':
				return this.processDTMF(signal.dtmf, signal.duration);
		}
	}

	protected async hangup(reason: CallHangupReason): Promise<void> {
		return mediaCallDirector.hangup(this.call, this.agent, reason);
	}

	protected async saveLocalDescription(sdp: RTCSessionDescriptionInit, negotiationId: string): Promise<void> {
		if (!this.signed) {
			return;
		}

		await mediaCallDirector.saveWebrtcSession(this.call, this.agent, { sdp, negotiationId }, this.contractId);
	}

	private async processAnswer(answer: CallAnswer): Promise<void> {
		switch (answer) {
			case 'ack':
				return this.clientIsReachable();
			case 'accept':
				return this.clientHasAccepted();
			case 'unavailable':
				return this.clientIsUnavailable();
			case 'reject':
				return this.clientHasRejected();
		}
	}

	private async processError(signal: ClientMediaSignalError): Promise<void> {
		if (!this.signed) {
			return;
		}

		const { errorType = 'other', errorCode, critical = false, negotiationId, errorDetails } = signal;
		logger.error({
			msg: 'Client reported an error',
			errorType,
			errorCode,
			critical,
			errorDetails,
			negotiationId,
			callId: this.callId,
			role: this.role,
			state: this.call.state,
		});

		let hangupReason: CallHangupReason = 'error';
		if (errorType === 'service') {
			hangupReason = 'service-error';

			// Do not hangup on service errors after the call is already active;
			// if the error happened on a renegotiation, then the service may still be able to rollback to a valid state
			if (this.isPastNegotiation()) {
				return;
			}
		}

		if (!critical) {
			return;
		}

		if (errorType === 'signaling') {
			hangupReason = 'signaling-error';
		}

		await mediaCallDirector.hangup(this.call, this.agent, hangupReason);
	}

	private async processNegotiationNeeded(oldNegotiationId: string): Promise<void> {
		// Unsigned clients may not request negotiations
		if (!this.signed) {
			return;
		}

		logger.debug({ msg: 'UserActorSignalProcessor.processNegotiationNeeded', oldNegotiationId });
		const negotiation = await MediaCallNegotiations.findLatestByCallId(this.callId);

		// If the call doesn't even have an initial negotiation yet, the clients shouldn't be requesting new ones.
		if (!negotiation) {
			return;
		}

		// If the latest negotiation has an answer, we can accept any request
		if (negotiation.answer) {
			return this.startNewNegotiation();
		}

		const comingFromLatest = oldNegotiationId === negotiation._id;
		const isRequestImpolite = this.role === 'caller';
		const isLatestImpolite = negotiation.offerer === 'caller';

		// If the request came from a client who was not yet aware of a newer renegotiation
		if (!comingFromLatest) {
			// If the client is polite, we can ignore their request in favor of the existing renegotiation
			if (!isRequestImpolite) {
				logger.debug({ msg: 'Ignoring outdated polite renegotiation request' });
				return;
			}

			// If the latest negotiation is impolite and the impolite client is not aware of it yet, this must be a duplicate request
			if (isLatestImpolite) {
				// If we already received an offer in this situation then something is very wrong (some proxy interfering with signals, perhaps?)
				if (negotiation.offer) {
					logger.error({ msg: 'Invalid renegotiation request', requestedBy: this.role, isLatestImpolite });
					return;
				}

				// Resend the offer request to the impolite client
				return this.requestWebRTCOffer({ negotiationId: negotiation._id });
			}

			// The state of polite negotiations is irrelevant for impolite requests, so we can start a new negotiation here.
			return this.startNewNegotiation();
		}

		// The client is up-to-date and requested a renegotiation before the last one was complete
		// If the request came from the same side as the last negotiation, the client was in no position to request it
		if (this.role === negotiation.offerer) {
			logger.error({ msg: 'Invalid state for renegotiation request', requestedBy: this.role, isLatestImpolite });
			return;
		}

		// If the request is from the impolite client, it takes priority over the existing polite negotiation
		if (isRequestImpolite) {
			return this.startNewNegotiation();
		}

		// It's a polite negotiation requested while an impolite one was not yet complete
		logger.error({ msg: 'Invalid state for renegotiation request', requestedBy: this.role, isLatestImpolite });
	}

	private async startNewNegotiation(): Promise<void> {
		const negotiationId = await mediaCallDirector.startNewNegotiation(this.call, this.role);
		if (negotiationId) {
			await this.requestWebRTCOffer({ negotiationId });
		}
	}

	private async processCallTransfer(to: ClientMediaSignalTransfer['to']): Promise<void> {
		logger.debug({ msg: 'UserActorSignalProcessor.processCallTransfer', to });
		if (!isBusyState(this.call.state)) {
			return;
		}

		const self: MediaCallSignedContact = {
			...this.agent.getMyCallActor(this.call),
			...this.actor,
		};

		return mediaCallDirector.transferCall(this.call, to, self, this.agent);
	}

	private async processDTMF(dtmf: string, duration?: number): Promise<void> {
		logger.debug({ msg: 'UserActorSignalProcessor.processDTMF', dtmf, duration });

		this.agent.oppositeAgent?.onDTMF(this.call._id, dtmf, duration || 2000);
	}

	protected async clientIsReachable(): Promise<void> {
		if (this.role === 'callee' && this.call.state === 'none') {
			// Change the call state from 'none' to 'ringing' when any callee session is found
			const ringUpdateResult = await MediaCalls.startRingingById(this.callId, mediaCallDirector.getNewExpirationTime());
			if (ringUpdateResult.modifiedCount) {
				mediaCallDirector.scheduleExpirationCheckByCallId(this.callId);
			}
		}

		// The caller contract should be signed before the call even starts, so if this one isn't, ignore its state
		if (this.role === 'caller' && this.signed) {
			// When the signed caller's client is reached, we immediatelly start the first negotiation
			const negotiationId = await mediaCallDirector.startFirstNegotiation(this.call);
			if (negotiationId) {
				await this.requestWebRTCOffer({ negotiationId });
			}
		}
	}

	protected async clientHasRejected(): Promise<void> {
		if (!this.isCallPending()) {
			return;
		}

		if (this.role === 'callee') {
			return mediaCallDirector.hangup(this.call, this.agent, 'rejected');
		}
	}

	protected async clientIsUnavailable(): Promise<void> {
		// Ignore 'unavailable' responses from unsigned clients as some other client session may have a different answer
		if (!this.signed) {
			return;
		}

		await mediaCallDirector.hangup(this.call, this.agent, 'unavailable');
	}

	protected async clientHasAccepted(): Promise<void> {
		if (!this.isCallPending()) {
			return;
		}

		if (this.role === 'callee') {
			await mediaCallDirector.acceptCall(this.call, this.agent, { calleeContractId: this.contractId });
		}
	}

	protected async clientIsActive(): Promise<void> {
		const result = await MediaCallChannels.setActiveById(this.channel._id);
		if (result.modifiedCount) {
			logger.info({ msg: 'Call Channel was flagged as active', callId: this.callId, role: this.role });
			await mediaCallDirector.activate(this.call, this.agent);
		}
	}

	protected async sendSignal(signal: ServerMediaSignal): Promise<void> {
		getMediaCallServer().sendSignal(this.actorId, signal);
	}

	protected isCallPending(): boolean {
		return isPendingState(this.call.state);
	}

	protected isPastNegotiation(): boolean {
		return ['active', 'hangup'].includes(this.call.state);
	}

	private async reviewLocalState(signal: ClientMediaSignalLocalState): Promise<void> {
		if (!this.signed) {
			return;
		}

		if (signal.clientState === 'active') {
			if (signal.negotiationId) {
				void MediaCallNegotiations.setStableById(signal.negotiationId)
					.then((result) => {
						if (result.modifiedCount) {
							logger.info({ msg: 'Negotiation is stable', callId: signal.callId, role: this.role });
						}
					})
					.catch(() => null);
			}

			if (this.channel.state === 'active' || this.channel.activeAt) {
				return;
			}

			await this.clientIsActive();
		}
	}
}
