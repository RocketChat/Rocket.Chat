import type { MediaCallActor, MediaCallContact } from '@rocket.chat/core-typings';
import type { CallRole, CallNotification } from '@rocket.chat/media-signaling';

import { SipBasicAgent } from './BasicAgent';
import { logger } from '../../logger';
import { agentManager } from '../Manager';
import type { IMediaCallAgent } from '../definition/IMediaCallAgent';
import type { AgentContractState } from '../definition/common';

export class SipMediaCallAgent extends SipBasicAgent<IMediaCallAgent> implements IMediaCallAgent {
	public readonly callId: string;

	public readonly contractId: string;

	protected contractState: AgentContractState;

	public get signed(): boolean {
		return this.contractState === 'signed';
	}

	public get ignored(): boolean {
		return this.contractState === 'ignored';
	}

	constructor(
		contact: MediaCallContact<MediaCallActor<'sip'>>,
		data: { role: CallRole; callId: string; contractId: string; contractState?: AgentContractState },
	) {
		const { callId, contractState, ...params } = data;
		super(contact, params);
		this.contractId = data.contractId;
		this.callId = callId;
		this.contractState = (this.contractId && contractState) || 'proposed';
	}

	public async setRemoteDescription(sdp: RTCSessionDescriptionInit): Promise<void> {
		logger.debug({ msg: 'SipMediaCallAgent.setRemoteDescription', sdp });

		// #ToDo: save sdp on channels collection and trigger an event to signal that the call was accepted

		// await this.sendSignal({
		// 	callId: this.callId,
		// 	toContractId: this.contractId,
		// 	type: 'remote-sdp',
		// 	sdp,
		// });
	}

	public async getLocalDescription(): Promise<RTCSessionDescriptionInit | null> {
		logger.debug({ msg: 'SipMediaCallAgent.getRemoteDescription' });
		if (this.localDescription) {
			return this.localDescription;
		}

		const channel = await agentManager.getOrCreateContract(this.callId, this);

		return channel?.localDescription ?? null;
	}

	public async requestOffer(params: { iceRestart?: boolean }): Promise<void> {
		logger.debug({ msg: 'SipMediaCallAgent.requestOffer', params, actor: this.actor, contractState: this.contractState });

		// We can't make offer requests over SIP without restarting the call, so just ignore this and wait for the offer to come naturally.
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
