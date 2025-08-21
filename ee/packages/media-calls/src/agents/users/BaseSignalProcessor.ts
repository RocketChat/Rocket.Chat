import type { IMediaCall, IMediaCallChannel, MediaCallActor, MediaCallActorType } from '@rocket.chat/core-typings';
import type { CallAnswer, CallHangupReason, CallRole, ClientMediaSignal, ClientMediaSignalLocalState, ServerMediaSignal } from '@rocket.chat/media-signaling';
import { MediaCallChannels } from '@rocket.chat/models';

import { MediaCallDirector } from '../../global/CallDirector';
import { gateway } from '../../global/SignalGateway';
import { logger } from '../../logger';
import type { IMediaCallAgent } from '../definition/IMediaCallAgent';
import type { AgentContractState } from '../definition/common';

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

	protected contractState: AgentContractState;

	public get signed(): boolean {
		return this.contractState === 'signed';
	}

	public get ignored(): boolean {
		return this.contractState === 'ignored';
	}

	constructor(
		protected readonly agent: IMediaCallAgent,
		protected readonly call: IMediaCall,
		protected readonly channel: IMediaCallChannel,
	) {
		this.contractState = 'proposed';

		const actor = call[channel.role];
		if (actor.contractId) {
			this.contractState = actor.contractId === channel.contractId ? 'signed' : 'ignored';
		}
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
		logger.debug({ msg: 'UserActorSignalProcessor.requestOffer', actor: this.actor, contractState: this.contractState });

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

	private async hangup(reason: CallHangupReason): Promise<void> {
		return MediaCallDirector.hangup(this.call, this.agent, reason);
	}

	private async saveLocalDescription(sdp: RTCSessionDescriptionInit): Promise<void> {
		logger.debug({ msg: 'UserActorSignalProcessor.saveLocalDescription', sdp });

		await MediaCallChannels.setLocalDescription(this.channel._id, sdp);

		const { [this.agent.oppositeRole]: otherActor } = this.call;
		await MediaCallChannels.setRemoteDescriptionByCallIdAndActor(this.call._id, otherActor, sdp);
		gateway.emitter.emit('callUpdated', this.call._id);
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
		gateway.sendSignal(this.actorId, signal);
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

	// private async notify(notification: CallNotification, signedContractId?: string): Promise<void> {
	// 	logger.debug({ msg: 'UserActorSignalProcessor.notify', callId: this.callId, notification, contractState: this.contractState });

	// 	// If we have been ignored, we should not be notifying anyone
	// 	if (this.ignored) {
	// 		return;
	// 	}

	// 	// If we know we're signed, inject our contractId into all notifications we send to the client
	// 	const signedId = signedContractId || (this.signed && this.contractId) || undefined;

	// 	return this.sendSignal({
	// 		callId: this.callId,
	// 		type: 'notification',
	// 		notification,
	// 		...(signedId && { signedContractId: signedId }),
	// 	});
	// }

	// private async getContactInfo(): Promise<CallContact> {
	// 	const { _id: id, username, name: displayName, freeSwitchExtension: sipExtension } = this.user;

	// 	return {
	// 		type: 'user',
	// 		id,
	// 		username,
	// 		displayName,
	// 		sipExtension,
	// 	};
	// }
}
