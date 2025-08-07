import type { IMediaCall } from '@rocket.chat/core-typings';
import type { ClientMediaSignal, CallRole } from '@rocket.chat/media-signaling';

import { UserBasicAgent, type MinimalUserData } from './BasicAgent';
import { UserAgentSignalProcessor } from './SignalProcessor';
import { agentManager } from '../Manager';
import type { IMediaCallAgent } from '../definition/IMediaCallAgent';

export class UserMediaCallAgent extends UserBasicAgent<IMediaCallAgent> implements IMediaCallAgent {
	public readonly callId: string;

	public readonly contractId: string;

	protected _signed: boolean;

	protected signalProcessor: UserAgentSignalProcessor;

	public get signed(): boolean {
		return this._signed;
	}

	constructor(user: MinimalUserData, data: { role: CallRole; callId: string; contractId: string; contractSigned?: boolean }) {
		const { callId, contractSigned, ...params } = data;
		super(user, params);
		this.contractId = data.contractId;
		this.callId = callId;
		this._signed = contractSigned ?? false;

		this.signalProcessor = new UserAgentSignalProcessor(this);
	}

	public async processSignal(signal: ClientMediaSignal, call: IMediaCall): Promise<void> {
		return this.signalProcessor.processSignal(signal, call);
	}

	public async setRemoteDescription(sdp: RTCSessionDescriptionInit): Promise<void> {
		console.log('UserAgent.setRemoteDescription');
		await this.sendSignal({
			callId: this.callId,
			toContractId: this.contractId,
			type: 'remote-sdp',
			sdp,
		});
	}

	public async getLocalDescription(): Promise<RTCSessionDescriptionInit | null> {
		console.log('UserAgent.getRemoteDescription');
		const channel = await agentManager.getOrCreateContract(this.callId, this);

		return channel?.localDescription ?? null;
	}

	public async requestOffer(params: { iceRestart?: boolean }): Promise<void> {
		console.log('UserAgent.requestOffer');
		// #ToDo: this function may be called multiple times for the same call until an offer is provided; look into how to handle that

		await this.sendSignal({
			callId: this.callId,
			toContractId: this.contractId,
			type: 'request-offer',
			...params,
		});
	}
}
