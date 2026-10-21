import { AppMethod } from '@rocket.chat/apps-engine/definition/metadata';
import type { MediaCallContact } from '@rocket.chat/core-typings';
import type { IMediaCallAppGateway, MediaCallDevice } from '@rocket.chat/media-calls';
import { MediaCalls } from '@rocket.chat/models';

import { dispatchMediaCallControl, getMediaCallDevices } from './appEvents';
import { logger } from './logger';
import { toAppContact, toAppMediaCall } from '../../modules/apps/converters/mediaCalls';

async function loadAppCall(callId: string) {
	const call = await MediaCalls.findOneById(callId);
	if (!call) {
		logger.warn({ msg: 'cti gateway asked to act on an unknown call', callId });
		return null;
	}
	return toAppMediaCall(call);
}

/**
 * Dispatches `cti` call control from the media-calls engine to the apps that handle those calls.
 * Injected into the EE `callServer` so `CtiActorAgent` can reach the app layer without depending on it.
 */
export const ctiGateway: IMediaCallAppGateway = {
	async getDevices(uid: string): Promise<MediaCallDevice[]> {
		return getMediaCallDevices(uid);
	},

	async dial(callId: string): Promise<void> {
		const call = await MediaCalls.findOneById(callId);
		if (!call) {
			return;
		}
		await dispatchMediaCallControl({
			method: AppMethod.EXECUTE_MEDIA_CALL_DIAL,
			context: { call: toAppMediaCall(call), device: call.device ?? '' },
		});
	},

	async answer(callId: string): Promise<void> {
		const call = await loadAppCall(callId);
		if (!call) {
			return;
		}
		await dispatchMediaCallControl({ method: AppMethod.EXECUTE_MEDIA_CALL_ANSWER, context: { call } });
	},

	async hangup(callId: string, reason?: string): Promise<void> {
		const call = await loadAppCall(callId);
		if (!call) {
			return;
		}
		await dispatchMediaCallControl({ method: AppMethod.EXECUTE_MEDIA_CALL_HANGUP, context: { call, reason } });
	},

	async mute(callId: string, muted: boolean): Promise<void> {
		const call = await loadAppCall(callId);
		if (!call) {
			return;
		}
		await dispatchMediaCallControl({ method: AppMethod.EXECUTE_MEDIA_CALL_MUTE, context: { call, muted } });
	},

	async hold(callId: string, held: boolean): Promise<void> {
		const call = await loadAppCall(callId);
		if (!call) {
			return;
		}
		await dispatchMediaCallControl({ method: AppMethod.EXECUTE_MEDIA_CALL_HOLD, context: { call, held } });
	},

	async transfer(callId: string, to: MediaCallContact): Promise<void> {
		const call = await loadAppCall(callId);
		if (!call) {
			return;
		}
		await dispatchMediaCallControl({ method: AppMethod.EXECUTE_MEDIA_CALL_TRANSFER, context: { call, to: toAppContact(to) } });
	},

	async sendDTMF(callId: string, tone: string, duration: number): Promise<void> {
		const call = await loadAppCall(callId);
		if (!call) {
			return;
		}
		await dispatchMediaCallControl({ method: AppMethod.EXECUTE_MEDIA_CALL_DTMF, context: { call, tone, duration } });
	},
};
