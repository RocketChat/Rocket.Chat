import type { IMediaCall, IMediaCallChannel, MediaCallActor, MediaCallActorType } from '@rocket.chat/core-typings';
import type {
	CallAnswer,
	CallHangupReason,
	CallRole,
	ClientMediaSignal,
	ClientMediaSignalLocalState,
	ServerMediaSignal,
} from '@rocket.chat/media-signaling';
import { MediaCallChannels } from '@rocket.chat/models';

import type { IMediaCallAgent } from '../../definition/IMediaCallAgent';
import { logger } from '../../logger';
import { MediaCallDirector } from '../../server/CallDirector';
import { getMediaCallServer } from '../../server/injection';

export abstract class UserActorSignalProcessor {
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

	public async setRemoteDescription(sdp: RTCSessionDescriptionInit): Promise<void> {
		logger.debug({ msg: 'UserActorSignalProcessor.setRemoteDescription', sdp });
		await this.sendSignal({
			callId: this.callId,
			toContractId: this.contractId,
			type: 'remote-sdp',
			sdp,
		});

		try {
			await MediaCallChannels.setRemoteDescription(this.channel._id, sdp);
		} catch (error) {
			logger.error('Failed to save remote SDP on call channel.');
		}
	}

	public async getLocalDescription(): Promise<RTCSessionDescriptionInit | null> {
		logger.debug({ msg: 'UserActorSignalProcessor.getRemoteDescription' });

		const channel = await MediaCallChannels.findOneById(this.channel._id);
		return channel?.localDescription ?? null;
	}

	public async requestWebRTCOffer(params: { iceRestart?: boolean }): Promise<void> {
		logger.debug({ msg: 'UserActorSignalProcessor.requestOffer', actor: this.actor });

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
				return this.saveLocalDescription(signal.sdp);
			case 'answer':
				return this.processAnswer(signal.answer);
			case 'hangup':
				return this.hangup(signal.reason);
			case 'local-state':
				return this.reviewLocalState(signal);
		}
	}

	protected async hangup(reason: CallHangupReason): Promise<void> {
		return MediaCallDirector.hangup(this.call, this.agent, reason);
	}

	protected async saveLocalDescription(sdp: RTCSessionDescriptionInit): Promise<void> {
		logger.debug({ msg: 'UserActorSignalProcessor.saveLocalDescription', sdp });

		await MediaCallChannels.setLocalDescription(this.channel._id, sdp);
		await MediaCallDirector.saveWebrtcSession(this.call, this.agent, sdp);
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

	protected abstract clientIsReachable(): Promise<void>;

	protected abstract clientHasRejected(): Promise<void>;

	protected abstract clientHasAccepted(): Promise<void>;

	protected abstract clientIsUnavailable(): Promise<void>;

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
		return ['none', 'ringing'].includes(this.call.state);
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
}
