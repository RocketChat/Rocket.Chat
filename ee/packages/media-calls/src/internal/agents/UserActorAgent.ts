import type { IMediaCall, MediaCallSignedContact } from '@rocket.chat/core-typings';
import { isBusyState, type ClientMediaSignal, type ServerMediaSignal } from '@rocket.chat/media-signaling';
import { MediaCallNegotiations, MediaCalls } from '@rocket.chat/models';

import { UserActorSignalProcessor } from './CallSignalProcessor';
import { BaseMediaCallAgent } from '../../base/BaseAgent';
import { logger } from '../../logger';
import { buildNewCallSignal } from '../../server/buildNewCallSignal';
import { getMediaCallServer } from '../../server/injection';

export class UserActorAgent extends BaseMediaCallAgent {
	public async processSignal(call: IMediaCall, signal: ClientMediaSignal): Promise<void> {
		const channel = await this.getOrCreateChannel(call, signal.contractId);

		const signalProcessor = new UserActorSignalProcessor(this, call, channel);
		return signalProcessor.processSignal(signal);
	}

	public async sendSignal(signal: ServerMediaSignal): Promise<void> {
		getMediaCallServer().sendSignal(this.actorId, signal);
	}

	public async onCallAccepted(callId: string, signedContractId: string): Promise<void> {
		await this.sendSignal({
			callId,
			type: 'notification',
			notification: 'accepted',
			signedContractId,
		});

		if (this.role !== 'callee') {
			return;
		}

		const negotiation = await MediaCallNegotiations.findLatestByCallId(callId);
		if (!negotiation?.offer) {
			logger.debug('The call was accepted but the webrtc offer is not yet available.');
			return;
		}

		await this.sendSignal({
			callId,
			toContractId: signedContractId,
			type: 'remote-sdp',
			sdp: negotiation.offer,
			negotiationId: negotiation._id,
		});
	}

	public async onCallEnded(callId: string): Promise<void> {
		return this.sendSignal({
			callId,
			type: 'notification',
			notification: 'hangup',
		});
	}

	public async onCallActive(callId: string): Promise<void> {
		return this.sendSignal({
			callId,
			type: 'notification',
			notification: 'active',
		});
	}

	public async onCallCreated(call: IMediaCall): Promise<void> {
		if (this.role === 'caller' && call.caller.contractId) {
			// Pre-create the channel for the contractId that requested the call
			await this.getOrCreateChannel(call, call.caller.contractId);
		}

		await this.sendSignal(buildNewCallSignal(call, this.role));
	}

	public async onRemoteDescriptionChanged(callId: string, negotiationId: string): Promise<void> {
		const call = await MediaCalls.findOneById(callId);
		if (!call || !isBusyState(call.state)) {
			return;
		}

		const actor = this.getMyCallActor(call);

		const toContractId = actor.contractId;
		// Do not send any sdp to an actor until they have a signed contract
		if (!toContractId) {
			return;
		}

		const negotiation = await MediaCallNegotiations.findOneById(negotiationId);
		if (!negotiation) {
			return;
		}

		if (negotiation.offerer === this.role) {
			if (!negotiation.offer) {
				await this.sendSignal({
					callId,
					toContractId,
					type: 'request-offer',
					negotiationId,
				});
				return;
			}

			if (!negotiation.answer) {
				return;
			}

			await this.sendSignal({
				callId,
				toContractId,
				type: 'remote-sdp',
				sdp: negotiation.answer,
				negotiationId,
			});
			return;
		}

		if (!negotiation.offer) {
			return;
		}

		await this.sendSignal({
			callId,
			toContractId,
			type: 'remote-sdp',
			sdp: negotiation.offer,
			negotiationId,
		});
	}

	public async onCallTransferred(callId: string): Promise<void> {
		const call = await MediaCalls.findOneById(callId);
		if (!call?.transferredBy || !call?.transferredTo) {
			return;
		}

		const actor = this.getMyCallActor(call);
		// If we haven't signed yet, we can't be transferred
		if (!actor.contractId) {
			return;
		}

		await getMediaCallServer().requestCall({
			caller: actor as MediaCallSignedContact,
			callee: call.transferredTo,
			requestedService: call.service,
			requestedBy: call.transferredBy,
			parentCallId: call._id,
		});
	}

	public async onDTMF(callId: string, dtmf: string, duration: number): Promise<void> {
		logger.debug({ msg: 'UserActorAgent.onDTMF', callId, dtmf, duration, role: this.role });
		// internal calls have nothing to do with DTMFs
	}
}
