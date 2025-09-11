import type { IMediaCall } from '@rocket.chat/core-typings';
import { isBusyState, type ClientMediaSignal, type ServerMediaSignal, type ServerMediaSignalNewCall } from '@rocket.chat/media-signaling';
import { MediaCallNegotiations, MediaCalls } from '@rocket.chat/models';

import { UserActorSignalProcessor } from './CallSignalProcessor';
import { BaseMediaCallAgent } from '../../base/BaseAgent';
import { logger } from '../../logger';
import { getMediaCallServer } from '../../server/injection';

export abstract class UserActorAgent extends BaseMediaCallAgent {
	public async processSignal(call: IMediaCall, signal: ClientMediaSignal): Promise<void> {
		const channel = await this.getOrCreateChannel(call, signal.contractId);

		const signalProcessor = new UserActorSignalProcessor(this, call, channel);
		return signalProcessor.processSignal(signal);
	}

	public async sendSignal(signal: ServerMediaSignal): Promise<void> {
		getMediaCallServer().sendSignal(this.actorId, signal);
	}

	public async onCallAccepted(callId: string, signedContractId: string): Promise<void> {
		logger.debug({ msg: 'UserActorAgent.onCallAccepted', callId });

		return this.sendSignal({
			callId,
			type: 'notification',
			notification: 'accepted',
			signedContractId,
		});
	}

	public async onCallEnded(callId: string): Promise<void> {
		logger.debug({ msg: 'UserActorAgent.onCallEnded', callId });

		return this.sendSignal({
			callId,
			type: 'notification',
			notification: 'hangup',
		});
	}

	public async onCallActive(callId: string): Promise<void> {
		logger.debug({ msg: 'UserActorAgent.onCallActive', callId });

		return this.sendSignal({
			callId,
			type: 'notification',
			notification: 'active',
		});
	}

	public async onCallCreated(call: IMediaCall): Promise<void> {
		logger.debug({ msg: 'UserActorAgent.onCallCreated', call });

		await this.sendSignal(this.buildNewCallSignal(call));
	}

	public async onRemoteDescriptionChanged(callId: string, negotiationId: string): Promise<void> {
		logger.debug({ msg: 'UserActorAgent.onRemoteDescriptionChanged', callId, negotiationId });

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

	protected buildNewCallSignal(call: IMediaCall): ServerMediaSignalNewCall {
		return {
			callId: call._id,
			type: 'new',
			service: call.service,
			kind: call.kind,
			role: this.role,
			contact: this.getOtherCallActor(call),
		};
	}
}
