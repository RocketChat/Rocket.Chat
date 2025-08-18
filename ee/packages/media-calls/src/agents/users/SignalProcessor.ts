import type { IMediaCall, IMediaCallChannel } from '@rocket.chat/core-typings';
import type { CallAnswer, ClientMediaSignal, ClientMediaSignalLocalState } from '@rocket.chat/media-signaling';
import { MediaCallChannels } from '@rocket.chat/models';

import type { UserMediaCallAgent } from './Agent';
import { logger } from '../../logger';
import { agentManager } from '../Manager';

type ChannelFunctionParams = {
	call: IMediaCall;
	channel: IMediaCallChannel;
};

export class UserAgentSignalProcessor {
	private channelId: string | null;

	constructor(private readonly agent: UserMediaCallAgent) {
		this.channelId = null;
	}

	public async processSignal(signal: ClientMediaSignal, call: IMediaCall): Promise<void> {
		logger.debug({ msg: 'UserAgentSignalProcessor.processSignal', call, signal });

		const channel = await agentManager.getOrCreateContract(call._id, this.agent, { acknowledged: true });
		if (!channel) {
			throw new Error('invalid-call');
		}

		this.channelId = channel._id;

		// The code will only reach this point if one of the three following conditions are true:
		// 1. the signal came from the exact user session where the caller initiated the call
		// 2. the signal came from the exact user session where the callee accepted the call
		// 2. the call has not been accepted yet and the signal came from a valid sesison from the callee

		const params = { channel, call };

		switch (signal.type) {
			case 'local-sdp':
				await this.saveLocalDescription(params, signal.sdp);
				break;
			case 'answer':
				await this.processAnswer(params, signal.answer);
				break;
			case 'hangup':
				await agentManager.hangupCall(this.agent, signal.reason);
				break;
			case 'local-state':
				await this.reviewLocalState(params, signal);
				break;
		}
	}

	public async getChannelId(): Promise<string> {
		if (this.channelId) {
			return this.channelId;
		}

		const channel = await agentManager.getOrCreateContract(this.agent.callId, this.agent);
		if (!channel) {
			throw new Error('invalid-channel');
		}

		this.channelId = channel._id;
		return this.channelId;
	}

	private async saveLocalDescription(params: ChannelFunctionParams, sdp: RTCSessionDescriptionInit): Promise<void> {
		logger.debug({ msg: 'UserAgentSignalProcessor.saveLocalDescription', sdp });
		const { call, channel } = params;

		await MediaCallChannels.setLocalDescription(channel._id, sdp);

		await agentManager.setLocalDescription(this.agent, sdp, call);
	}

	private async processAnswer(params: ChannelFunctionParams, answer: CallAnswer): Promise<void> {
		logger.debug({ msg: 'UserAgentSignalProcessor.processAnswer', params, answer });
		const { call } = params;

		switch (answer) {
			case 'ack':
				return this.processACK(params);
			case 'accept':
				return agentManager.acceptCall(this.agent);
			case 'unavailable':
				// We don't do anything on unavailable responses from clients, as a different client may still answer
				return;
			case 'reject':
				return this.processReject(call);
		}
	}

	private async processReject(call: IMediaCall): Promise<void> {
		logger.debug({ msg: 'UserAgentSignalProcessor.processReject', call });
		if (this.agent.role !== 'callee') {
			return;
		}

		if (!['none', 'ringing'].includes(call.state)) {
			return;
		}

		return agentManager.hangupCall(this.agent, 'rejected');
	}

	private async processACK({ channel }: ChannelFunctionParams): Promise<void> {
		logger.debug({ msg: 'UserAgentSignalProcessor.processACK' });
		switch (this.agent.role) {
			case 'callee':
				// Change the call state from 'none' to 'ringing' when any callee session is found
				await agentManager.acknowledgeCallee(this.agent);
				break;
			case 'caller':
				// When the caller ack, we ask them to start creating an offer
				await this.requestChannelOffer(channel, {});
				break;
		}
	}

	private async requestChannelOffer(channel: IMediaCallChannel, params: { iceRestart?: boolean }): Promise<void> {
		// If the channel already has a local Sdp, no need to request its offer unless we're restarting ICE
		if (channel.localDescription?.sdp && !params.iceRestart) {
			return;
		}

		await this.agent.requestOffer(params);
	}

	private async reviewLocalState({ channel }: ChannelFunctionParams, signal: ClientMediaSignalLocalState): Promise<void> {
		if (!this.agent.signed) {
			return;
		}

		if (signal.clientState === 'active') {
			if (channel.state === 'active' || channel.activeAt) {
				return;
			}

			const result = await MediaCallChannels.setActiveById(channel._id);
			if (result.modifiedCount) {
				await agentManager.activateCall(this.agent);
			}
		}
	}
}
