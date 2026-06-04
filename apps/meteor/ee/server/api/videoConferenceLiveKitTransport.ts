import { Logger } from '@rocket.chat/logger';
import { VideoConference as VideoConferenceModel } from '@rocket.chat/models';
import {
	ajv,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';

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

const looseSuccessSchema = ajv.compile<Record<string, unknown>>({ type: 'object', additionalProperties: true });
const looseSuccessResponse = {
	200: looseSuccessSchema,
	400: validateBadRequestErrorResponse,
	401: validateUnauthorizedErrorResponse,
	403: validateForbiddenErrorResponse,
};

const logger = new Logger('VideoConference/LiveKit/API');

const livekitRoomNameFor = (callId: string) => `mc-${callId}`;

async function authorize(this: { userId: string }, callId: string | undefined) {
	if (!callId) return { error: 'invalid-params' as const };
	if (!settings.get<boolean>('VideoConf_LiveKit_Enabled')) {
		return { error: 'livekit-not-enabled' as const };
	}
	const call = await VideoConferenceModel.findOneById(callId);
	if (!call) return { error: 'invalid-call' as const };
	const { userId } = this;

	// LiveKit calls are always room-scoped: any member of the call's room can
	// access transport/recording controls.
	const { Rooms } = await import('@rocket.chat/models');
	const { canAccessRoomAsync } = await import('../../../app/authorization/server/functions/canAccessRoom');
	if (!call.rid) return { error: 'invalid-call' as const };
	const room = await Rooms.findOneById(call.rid);
	if (!room || !(await canAccessRoomAsync(room, { _id: userId }))) {
		return { error: 'forbidden' as const };
	}
	return { call };
}

API.v1.post(
	'video-conference.livekit.recording.start',
	{
		authRequired: true,
		rateLimiterOptions: { numRequestsAllowed: 5, intervalTimeInMS: 60000 },
		response: looseSuccessResponse,
	},
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
	'video-conference.livekit.recording.stop',
	{
		authRequired: true,
		rateLimiterOptions: { numRequestsAllowed: 5, intervalTimeInMS: 60000 },
		response: looseSuccessResponse,
	},
	async function action() {
		const { callId } = this.bodyParams as { callId?: string };
		const auth = await authorize.call(this, callId);
		if ('error' in auth) {
			if (auth.error === 'forbidden') return API.v1.forbidden();
			return API.v1.failure(auth.error);
		}

		try {
			await stopMediaCallRecording(callId as string);
			return API.v1.success({});
		} catch (e) {
			return API.v1.failure((e as Error).message);
		}
	},
);

API.v1.get(
	'video-conference.livekit.recording.status',
	{
		authRequired: true,
		rateLimiterOptions: { numRequestsAllowed: 30, intervalTimeInMS: 60000 },
		response: looseSuccessResponse,
	},
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

/**
 * Returns the transport config for a LiveKit conference: a freshly minted
 * { serverUrl, token, roomName } the client can hand to the LiveKit SDK.
 * Other (URL-based) providers don't need this — they hand off via a URL.
 */
API.v1.get(
	'video-conference.livekit.transport.config',
	{
		authRequired: true,
		rateLimiterOptions: { numRequestsAllowed: 10, intervalTimeInMS: 60000 },
		response: looseSuccessResponse,
	},
	async function action() {
		const { callId } = this.queryParams as { callId?: string };
		if (!callId) return API.v1.failure('invalid-params');

		const call = await VideoConferenceModel.findOneById(callId);
		if (!call) return API.v1.failure('invalid-call');

		const { userId } = this;

		// Any room member can fetch transport config.
		const { Rooms } = await import('@rocket.chat/models');
		const { canAccessRoomAsync } = await import('../../../app/authorization/server/functions/canAccessRoom');
		if (!call.rid) return API.v1.failure('invalid-call');
		const room = await Rooms.findOneById(call.rid);
		if (!room || !(await canAccessRoomAsync(room, { _id: userId }))) {
			return API.v1.forbidden();
		}

		if (call.providerName !== 'livekit') {
			return API.v1.success({ service: call.providerName });
		}

		if (!isLiveKitFullyConfigured()) return API.v1.failure('livekit-not-configured');

		try {
			const cfg = getLiveKitConfig();
			const roomName = livekitRoomNameFor(callId);
			const { user } = this;
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
