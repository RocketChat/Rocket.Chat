import type { IMediaCall, IMediaCallChannel } from '@rocket.chat/core-typings';
import type { CallAnswer, ClientMediaSignal } from '@rocket.chat/media-signaling';
import { MediaCallChannels } from '@rocket.chat/models';

import type { UserMediaCallAgent } from './Agent';
import { agentManager } from '../Manager';

type ChannelFunctionParams = {
	call: IMediaCall;
	channel: IMediaCallChannel;
};

export class UserAgentSignalProcessor {
	constructor(private readonly agent: UserMediaCallAgent) {}

	public async processSignal(signal: ClientMediaSignal, call: IMediaCall): Promise<void> {
		console.log('SignalProcessor.processSignal');

		const channel = await agentManager.getOrCreateContract(call._id, this.agent, { acknowledged: true });
		if (!channel) {
			throw new Error('invalid-call');
		}

		// The code will only reach this point if one of the three following conditions are true:
		// 1. the signal came from the exact user session where the caller initiated the call
		// 2. the signal came from the exact user session where the callee accepted the call
		// 2. the call has not been accepted yet and the signal came from a valid sesison from the callee

		const params = { channel, call };

		switch (signal.type) {
			case 'local-sdp':
				await this.saveLocalDescription(params, signal.sdp);
				break;
			case 'error':
				// #ToDo
				break;
			case 'answer':
				await this.processAnswer(params, signal.answer);
				break;
			case 'hangup':
				await agentManager.hangupCall(this.agent, signal.reason);
				break;
		}
	}

	private async saveLocalDescription({ channel }: ChannelFunctionParams, sdp: RTCSessionDescriptionInit): Promise<void> {
		console.log('SignalProcessor.saveLocalDescription');
		await MediaCallChannels.setLocalDescription(channel._id, sdp);

		await agentManager.setLocalDescription(this.agent, sdp);
	}

	private async processAnswer(params: ChannelFunctionParams, answer: CallAnswer): Promise<void> {
		console.log('processAnswer');
		const { call } = params;

		switch (answer) {
			case 'ack':
				return this.processACK(params);
			case 'accept':
				return agentManager.acceptCall(this.agent);
			case 'unavailable':
				// return processUnavailable(call, channel);
				break;
			case 'reject':
				return this.processReject(call);
		}
	}

	private async processReject(call: IMediaCall): Promise<void> {
		console.log('SignalProcessor.processReject');
		if (this.agent.role !== 'callee') {
			return;
		}

		if (!['none', 'ringing'].includes(call.state)) {
			console.log('cant reject an ongoing call.');
			return;
		}

		return agentManager.hangupCall(this.agent, 'rejected');
	}

	private async processACK({ channel }: ChannelFunctionParams): Promise<void> {
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
}
