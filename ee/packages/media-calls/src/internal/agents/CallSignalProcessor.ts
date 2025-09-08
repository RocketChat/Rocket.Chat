import type { IMediaCall, IMediaCallChannel, MediaCallActor, MediaCallActorType } from '@rocket.chat/core-typings';
import {
	isPendingState,
	type CallAnswer,
	type CallHangupReason,
	type CallRole,
	type ClientMediaSignal,
	type ClientMediaSignalError,
	type ClientMediaSignalLocalState,
	type ServerMediaSignal,
} from '@rocket.chat/media-signaling';
import { MediaCallChannels, MediaCallNegotiations, MediaCalls } from '@rocket.chat/models';

import type { IMediaCallAgent } from '../../definition/IMediaCallAgent';
import { logger } from '../../logger';
import { MediaCallDirector } from '../../server/CallDirector';
import { getMediaCallServer } from '../../server/injection';

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

	public get actor(): MediaCallActor {
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
		logger.debug({ msg: 'UserActorSignalProcessor.requestWebRTCOffer', actor: this.actor });

		await this.sendSignal({
			callId: this.callId,
			toContractId: this.contractId,
			type: 'request-offer',
			...params,
		});
	}

	public async processSignal(signal: ClientMediaSignal): Promise<void> {
		logger.debug({ msg: 'UserActorSignalProcessor.processSignal', signal });

		// The code will only reach this point if one of the three following conditions are true:
		// 1. the signal came from the exact user session where the caller initiated the call
		// 2. the signal came from the exact user session where the callee accepted the call
		// 2. the call has not been accepted yet and the signal came from a valid sesison from the callee
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
				return this.processError(signal.errorType, signal.errorCode);
			case 'negotiation-needed':
				return this.processNegotiationNeeded(signal.oldNegotiationId);
		}
	}

	protected async hangup(reason: CallHangupReason): Promise<void> {
		return MediaCallDirector.hangup(this.call, this.agent, reason);
	}

	protected async saveLocalDescription(sdp: RTCSessionDescriptionInit, negotiationId: string): Promise<void> {
		logger.debug({ msg: 'UserActorSignalProcessor.saveLocalDescription', sdp });

		await MediaCallDirector.saveWebrtcSession(this.call, this.agent, { sdp, negotiationId }, this.contractId);
	}

	private async processAnswer(answer: CallAnswer): Promise<void> {
		logger.debug({ msg: 'UserActorSignalProcessor.processAnswer', answer });

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

	private async processError(errorType: ClientMediaSignalError['errorType'], errorCode?: string): Promise<void> {
		if (!this.signed) {
			return;
		}

		switch (errorType) {
			case 'signaling':
				return this.onSignalingError(errorCode);
			case 'service':
				return this.onServiceError(errorCode);
			default:
				return this.onUnexpectedError(errorCode);
		}
	}

	private async processNegotiationNeeded(oldNegotiationId: string): Promise<void> {
		logger.debug({ msg: 'UserActorSignalProcessor.processNegotiationNeeded', oldNegotiationId });
		const negotiation = await MediaCallNegotiations.findLatestByCallId(this.callId);
		// If the negotiation that triggered a request for renegotiation is not the latest negotiation, then a new one must already be happening and we can ignore this request.
		if (negotiation?._id !== oldNegotiationId) {
			return;
		}

		const negotiationId = await MediaCallDirector.startNewNegotiation(this.call, this.role);
		if (negotiationId) {
			await this.requestWebRTCOffer({ negotiationId });
		}
	}

	protected async clientIsReachable(): Promise<void> {
		logger.debug({ msg: 'UserActorSignalProcessor.clientIsReachable', role: this.role, uid: this.actorId });

		if (this.role === 'callee' && this.call.state === 'none') {
			// Change the call state from 'none' to 'ringing' when any callee session is found
			await MediaCalls.startRingingById(this.callId, MediaCallDirector.getNewExpirationTime());
		}

		// The caller contract should be signed before the call even starts, so if this one isn't, ignore its state
		if (this.role === 'caller' && this.signed) {
			// When the signed caller's client is reached, we immediatelly start the first negotiation
			const negotiationId = await MediaCallDirector.startFirstNegotiation(this.call);
			if (negotiationId) {
				await this.requestWebRTCOffer({ negotiationId });
			}
		}
	}

	protected async clientHasRejected(): Promise<void> {
		logger.debug({ msg: 'UserActorSignalProcessor.clientHasRejected', role: this.role, uid: this.actorId });
		if (!this.isCallPending()) {
			return;
		}

		if (this.role === 'callee') {
			return MediaCallDirector.hangup(this.call, this.agent, 'rejected');
		}
	}

	protected async clientIsUnavailable(): Promise<void> {
		logger.debug({ msg: 'UserActorSignalProcessor.clientIsUnavailable', role: this.role, uid: this.actorId });
	}

	protected async clientHasAccepted(): Promise<void> {
		logger.debug({ msg: 'UserActorSignalProcessor.clientHasAccepted', role: this.role, uid: this.actorId });
		if (!this.isCallPending()) {
			return;
		}

		if (this.role === 'callee') {
			await MediaCallDirector.acceptCall(this.call, this.agent, { calleeContractId: this.contractId });
		}
	}

	protected async clientIsActive(): Promise<void> {
		const result = await MediaCallChannels.setActiveById(this.channel._id);
		if (result.modifiedCount) {
			await MediaCallDirector.activate(this.call, this.agent);
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
			if (this.channel.state === 'active' || this.channel.activeAt) {
				return;
			}

			await this.clientIsActive();
		}
	}

	private async onSignalingError(errorMessage?: string): Promise<void> {
		logger.error({ msg: 'Client reported a signaling error', errorMessage, callId: this.callId, role: this.role, state: this.call.state });
		await MediaCallDirector.hangup(this.call, this.agent, 'service-error');
	}

	private async onServiceError(errorMessage?: string): Promise<void> {
		logger.error({ msg: 'Client reported a service error', errorMessage, callId: this.callId, role: this.role, state: this.call.state });
		if (this.isPastNegotiation()) {
			return;
		}

		await MediaCallDirector.hangup(this.call, this.agent, 'service-error');
	}

	private async onUnexpectedError(errorMessage?: string): Promise<void> {
		logger.error({
			msg: 'Client reported an unexpected error',
			errorMessage,
			callId: this.callId,
			role: this.role,
			state: this.call.state,
		});
		await MediaCallDirector.hangup(this.call, this.agent, 'error');
	}
}
