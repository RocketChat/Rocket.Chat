import type { IMediaCall } from '@rocket.chat/core-typings';
import type { ClientMediaSignal, CallRole, CallNotification } from '@rocket.chat/media-signaling';

import { UserBasicAgent, type MinimalUserData } from './BasicAgent';
import { UserAgentSignalProcessor } from './SignalProcessor';
import { logger } from '../../logger';
import { agentManager } from '../Manager';
import type { IMediaCallAgent } from '../definition/IMediaCallAgent';
import type { AgentContractState } from '../definition/common';

export class UserMediaCallAgent extends UserBasicAgent<IMediaCallAgent> implements IMediaCallAgent {
	public readonly callId: string;

	public readonly contractId: string;

	protected contractState: AgentContractState;

	protected signalProcessor: UserAgentSignalProcessor;

	public get signed(): boolean {
		return this.contractState === 'signed';
	}

	public get ignored(): boolean {
		return this.contractState === 'ignored';
	}

	constructor(user: MinimalUserData, data: { role: CallRole; callId: string; contractId: string; contractState?: AgentContractState }) {
		const { callId, contractState, ...params } = data;
		super(user, params);
		this.contractId = data.contractId;
		this.callId = callId;
		this.contractState = (this.contractId && contractState) || 'proposed';

		this.signalProcessor = new UserAgentSignalProcessor(this);
	}

	public async processSignal(signal: ClientMediaSignal, call: IMediaCall): Promise<void> {
		return this.signalProcessor.processSignal(signal, call);
	}

	public async setRemoteDescription(sdp: RTCSessionDescriptionInit): Promise<void> {
		logger.debug({ msg: 'UserMediaCallAgent.setRemoteDescription', sdp });
		await this.sendSignal({
			callId: this.callId,
			toContractId: this.contractId,
			type: 'remote-sdp',
			sdp,
		});
	}

	public async getLocalDescription(): Promise<RTCSessionDescriptionInit | null> {
		logger.debug({ msg: 'UserMediaCallAgent.getRemoteDescription' });
		const channel = await agentManager.getOrCreateContract(this.callId, this);

		return channel?.localDescription ?? null;
	}

	public async requestOffer(params: { iceRestart?: boolean }): Promise<void> {
		logger.debug({ msg: 'UserMediaCallAgent.requestOffer', params, actor: this.actor, contractState: this.contractState });

		await this.sendSignal({
			callId: this.callId,
			toContractId: this.contractId,
			type: 'request-offer',
			...params,
		});
	}

	public async notify(callId: string, notification: CallNotification, signedContractId?: string): Promise<void> {
		// If we have been ignored, we should not be notifying anyone
		if (this.ignored) {
			return;
		}

		// If we know we're signed, inject our contractId into all notifications we send to the client
		const signedId = signedContractId || (this.signed && this.contractId) || undefined;
		return super.notify(callId, notification, signedId);
	}

	public async sign(): Promise<void> {
		if (this.contractState !== 'proposed') {
			throw new Error(`Can't sign a contract that is not pending.`);
		}

		this.contractState = 'signed';
	}
}
