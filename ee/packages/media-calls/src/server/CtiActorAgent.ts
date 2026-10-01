import type { IMediaCall } from '@rocket.chat/core-typings';
import { MediaCalls } from '@rocket.chat/models';

import { BaseMediaCallAgent } from '../base/BaseAgent';
import { logger } from '../logger';
import { getMediaCallAppGateway } from './injection';

/**
 * Represents the app-backed side of a `cti` call. Instead of signaling a Rocket.Chat client (like
 * `UserActorAgent`) or broadcasting to instances (like `BroadcastActorAgent`), it dispatches call
 * lifecycle and control to the app/gateway that owns the call's device, through the injected gateway.
 *
 * A cti call always pairs this agent with a `UserActorAgent` for the controlling Rocket.Chat user:
 * - Outbound: the controller is the caller and this agent is the callee — it `dial`s on creation.
 * - Inbound: the controller is the callee and this agent is the caller. The call already exists on
 *   the device (the app created it), so it does not dial; it `answer`s once the controller accepts.
 */
export class CtiActorAgent extends BaseMediaCallAgent {
	private get gateway() {
		const gateway = getMediaCallAppGateway();
		if (!gateway) {
			logger.error({ msg: 'No cti app gateway is configured; cti call control cannot be dispatched.', role: this.role });
		}
		return gateway;
	}

	public async onCallCreated(call: IMediaCall): Promise<void> {
		logger.debug({ msg: 'CtiActorAgent.onCallCreated', callId: call._id, role: this.role });
		// Only outbound calls (where this agent is the callee) need to be originated on the device.
		// On inbound calls the app already created the call, so there is nothing to dial.
		if (this.role !== 'callee') {
			return;
		}
		await this.gateway?.dial(call._id);
	}

	public async onCallAccepted(call: IMediaCall): Promise<void> {
		logger.debug({ msg: 'CtiActorAgent.onCallAccepted', callId: call._id, role: this.role });
		// On inbound calls (this agent is the caller) the controller just accepted: tell the app to
		// answer on the device. On outbound calls the app answered on its own and reported it back.
		if (this.role !== 'caller') {
			return;
		}
		await this.gateway?.answer(call._id);
	}

	public async onCallActive(callId: string): Promise<void> {
		logger.debug({ msg: 'CtiActorAgent.onCallActive', callId, role: this.role });
		// Media flows on the device; nothing to dispatch.
	}

	public async onCallEnded(callId: string): Promise<void> {
		logger.debug({ msg: 'CtiActorAgent.onCallEnded', callId, role: this.role });
		// The app must tolerate a hangup that races with its own reported end (idempotent teardown).
		await this.gateway?.hangup(callId);
	}

	public async onRemoteDescriptionChanged(callId: string, _negotiationId: string): Promise<void> {
		logger.debug({ msg: 'CtiActorAgent.onRemoteDescriptionChanged', callId, role: this.role });
		// cti calls carry no SDP; nothing to negotiate.
	}

	public async onCallTransferred(callId: string): Promise<void> {
		logger.debug({ msg: 'CtiActorAgent.onCallTransferred', callId, role: this.role });
		const call = await MediaCalls.findOneById(callId);
		if (!call?.transferredTo) {
			return;
		}
		await this.gateway?.transfer(callId, call.transferredTo);
	}

	public async onCallUpdated(callId: string): Promise<void> {
		logger.debug({ msg: 'CtiActorAgent.onCallUpdated', callId, role: this.role });
	}

	public async onDTMF(callId: string, dtmf: string, duration: number): Promise<void> {
		logger.debug({ msg: 'CtiActorAgent.onDTMF', callId, role: this.role });
		await this.gateway?.sendDTMF(callId, dtmf, duration);
	}

	public async onMute(callId: string, muted: boolean): Promise<void> {
		logger.debug({ msg: 'CtiActorAgent.onMute', callId, muted, role: this.role });
		await this.gateway?.mute(callId, muted);
	}

	public async onHold(callId: string, held: boolean): Promise<void> {
		logger.debug({ msg: 'CtiActorAgent.onHold', callId, held, role: this.role });
		await this.gateway?.hold(callId, held);
	}
}
