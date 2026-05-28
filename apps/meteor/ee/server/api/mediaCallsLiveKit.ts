import { Logger } from '@rocket.chat/logger';
import { MediaCalls as MediaCallsModel } from '@rocket.chat/models';

import { API } from '../../../app/api/server/api';
import { settings } from '../../../app/settings/server';
import {
	createLiveKitAccessToken,
	getLiveKitConfig,
	isLiveKitFullyConfigured,
	startMediaCallRecording,
	stopMediaCallRecording,
	getMediaCallRecordingState,
} from '../lib/livekit';

const logger = new Logger('MediaCalls/LiveKit/API');

const livekitRoomNameFor = (callId: string) => `mc-${callId}`;

async function authorize(this: any, callId: string | undefined) {
	if (!callId) return { error: 'invalid-params' as const };
	if (!settings.get<boolean>('VoIP_TeamCollab_LiveKit_Enabled')) {
		return { error: 'livekit-not-enabled' as const };
	}
	const call = await MediaCallsModel.findOneById(callId);
	if (!call) return { error: 'invalid-call' as const };
	const userId = this.userId;

	// Group calls: any member of the call's room can join. Direct calls: must
	// be one of the two parties.
	if (call.kind === 'group') {
		const { Rooms } = await import('@rocket.chat/models');
		const { canAccessRoomAsync } = await import('../../../app/authorization/server/functions/canAccessRoom');
		if (!call.rid) return { error: 'invalid-call' as const };
		const room = await Rooms.findOneById(call.rid);
		if (!room || !(await canAccessRoomAsync(room, { _id: userId }))) {
			return { error: 'forbidden' as const };
		}
		return { call };
	}

	const isParticipant = call.caller?.id === userId || call.callee?.id === userId;
	if (!isParticipant) return { error: 'forbidden' as const };
	return { call };
}

// Returns a LiveKit join token for the caller for a given media-call.
API.v1.get(
	'media-calls.livekit.join',
	{ authRequired: true, rateLimiterOptions: { numRequestsAllowed: 10, intervalTimeInMS: 60000 } },
	async function action() {
		const { callId } = this.queryParams as { callId?: string };
		const auth = await authorize.call(this, callId);
		if ('error' in auth) {
			if (auth.error === 'forbidden') return API.v1.forbidden();
			return API.v1.failure(auth.error);
		}

		if (!isLiveKitFullyConfigured()) return API.v1.failure('livekit-not-configured');

		try {
			const cfg = getLiveKitConfig();
			const roomName = livekitRoomNameFor(callId as string);
			const user = this.user;
			const token = await createLiveKitAccessToken({
				identity: this.userId,
				name: user?.name || user?.username || this.userId,
				grant: { roomJoin: true, room: roomName, canPublish: true, canSubscribe: true, canPublishData: true },
			});
			return API.v1.success({ serverUrl: cfg.url, token, roomName });
		} catch (e) {
			logger.error({ msg: 'token mint failed', err: e });
			return API.v1.failure((e as Error).message);
		}
	},
);

API.v1.post(
	'media-calls.livekit.start-recording',
	{ authRequired: true, rateLimiterOptions: { numRequestsAllowed: 5, intervalTimeInMS: 60000 } },
	async function action() {
		const { callId } = this.bodyParams as { callId?: string };
		const auth = await authorize.call(this, callId);
		if ('error' in auth) {
			if (auth.error === 'forbidden') return API.v1.forbidden();
			return API.v1.failure(auth.error);
		}

		try {
			const result = await startMediaCallRecording(callId as string);
			return API.v1.success(result);
		} catch (e) {
			logger.error({ msg: 'start-recording failed', err: e });
			return API.v1.failure((e as Error).message);
		}
	},
);

API.v1.post(
	'media-calls.livekit.stop-recording',
	{ authRequired: true, rateLimiterOptions: { numRequestsAllowed: 5, intervalTimeInMS: 60000 } },
	async function action() {
		const { callId } = this.bodyParams as { callId?: string };
		const auth = await authorize.call(this, callId);
		if ('error' in auth) {
			if (auth.error === 'forbidden') return API.v1.forbidden();
			return API.v1.failure(auth.error);
		}

		try {
			await stopMediaCallRecording(callId as string);
			return API.v1.success();
		} catch (e) {
			return API.v1.failure((e as Error).message);
		}
	},
);

API.v1.get(
	'media-calls.livekit.recording-status',
	{ authRequired: true, rateLimiterOptions: { numRequestsAllowed: 30, intervalTimeInMS: 60000 } },
	async function action() {
		const { callId } = this.queryParams as { callId?: string };
		const auth = await authorize.call(this, callId);
		if ('error' in auth) {
			if (auth.error === 'forbidden') return API.v1.forbidden();
			return API.v1.failure(auth.error);
		}

		return API.v1.success(await getMediaCallRecordingState(callId as string));
	},
);

// ============================================================================
// Transport-agnostic endpoints. These are the preferred shape going forward;
// they take a callId and a generic "transport" concept rather than calling
// out LiveKit specifically. The legacy livekit.* endpoints above remain as
// thin compatibility shims pointing at the same handlers.
// ============================================================================

/**
 * Returns the transport config for a call. Today this means LiveKit-specific
 * { serverUrl, token, roomName } when the call uses LK, or an empty webrtc
 * block (clients use ICE servers from settings directly).
 */
API.v1.get(
	'media-calls.transport.config',
	{ authRequired: true, rateLimiterOptions: { numRequestsAllowed: 10, intervalTimeInMS: 60000 } },
	async function action() {
		const { callId } = this.queryParams as { callId?: string };
		if (!callId) return API.v1.failure('invalid-params');

		const call = await MediaCallsModel.findOneById(callId);
		if (!call) return API.v1.failure('invalid-call');

		const userId = this.userId;

		// Group calls: any room member can fetch transport config.
		// Direct calls: only the two parties can.
		if (call.kind === 'group') {
			const { Rooms } = await import('@rocket.chat/models');
			const { canAccessRoomAsync } = await import('../../../app/authorization/server/functions/canAccessRoom');
			if (!call.rid) return API.v1.failure('invalid-call');
			const room = await Rooms.findOneById(call.rid);
			if (!room || !(await canAccessRoomAsync(room, { _id: userId }))) {
				return API.v1.forbidden();
			}
		} else {
			const isParticipant = call.caller?.id === userId || call.callee?.id === userId;
			if (!isParticipant) return API.v1.forbidden();
		}

		if (call.service !== 'livekit') {
			return API.v1.success({ service: call.service });
		}

		if (!isLiveKitFullyConfigured()) return API.v1.failure('livekit-not-configured');

		try {
			const cfg = getLiveKitConfig();
			const roomName = livekitRoomNameFor(callId);
			const user = this.user;
			const token = await createLiveKitAccessToken({
				identity: userId,
				name: user?.name || user?.username || userId,
				grant: { roomJoin: true, room: roomName, canPublish: true, canSubscribe: true, canPublishData: true },
			});
			return API.v1.success({
				service: 'livekit',
				livekit: { serverUrl: cfg.url, token, roomName },
			});
		} catch (e) {
			logger.error({ msg: 'transport config mint failed', err: e });
			return API.v1.failure((e as Error).message);
		}
	},
);

/**
 * Start recording the call's transport. Today only LiveKit supports recording
 * (P2P has no SFU to record through). Returns the current recording status.
 */
API.v1.post(
	'media-calls.recording.start',
	{ authRequired: true, rateLimiterOptions: { numRequestsAllowed: 5, intervalTimeInMS: 60000 } },
	async function action() {
		const { callId } = this.bodyParams as { callId?: string };
		const auth = await authorize.call(this, callId);
		if ('error' in auth) {
			if (auth.error === 'forbidden') return API.v1.forbidden();
			return API.v1.failure(auth.error);
		}

		try {
			const result = await startMediaCallRecording(callId as string);
			return API.v1.success(result);
		} catch (e) {
			logger.error({ msg: 'start-recording failed', err: e });
			return API.v1.failure((e as Error).message);
		}
	},
);

API.v1.post(
	'media-calls.recording.stop',
	{ authRequired: true, rateLimiterOptions: { numRequestsAllowed: 5, intervalTimeInMS: 60000 } },
	async function action() {
		const { callId } = this.bodyParams as { callId?: string };
		const auth = await authorize.call(this, callId);
		if ('error' in auth) {
			if (auth.error === 'forbidden') return API.v1.forbidden();
			return API.v1.failure(auth.error);
		}
		try {
			await stopMediaCallRecording(callId as string);
			return API.v1.success();
		} catch (e) {
			return API.v1.failure((e as Error).message);
		}
	},
);

/** Returns the current recording state for the call. */
API.v1.get(
	'media-calls.recording',
	{ authRequired: true, rateLimiterOptions: { numRequestsAllowed: 30, intervalTimeInMS: 60000 } },
	async function action() {
		const { callId } = this.queryParams as { callId?: string };
		const auth = await authorize.call(this, callId);
		if ('error' in auth) {
			if (auth.error === 'forbidden') return API.v1.forbidden();
			return API.v1.failure(auth.error);
		}
		return API.v1.success(await getMediaCallRecordingState(callId as string));
	},
);
