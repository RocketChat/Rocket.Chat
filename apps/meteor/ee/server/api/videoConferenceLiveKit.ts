import { VideoConferenceStatus } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { VideoConference as VideoConferenceModel, Rooms } from '@rocket.chat/models';
import {
	ajv,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';

import { API } from '../../../app/api/server/api';
import { canAccessRoomAsync } from '../../../app/authorization/server/functions/canAccessRoom';
import notifications from '../../../app/notifications/server/lib/Notifications';
import { settings } from '../../../app/settings/server';
import {
	createLiveKitAccessToken,
	getLiveKitConfig,
	isLiveKitFullyConfigured,
	startMediaCallRecording,
	stopMediaCallRecording,
	getMediaCallRecordingState,
} from '../lib/livekit';

const logger = new Logger('VideoConference/LiveKit/API');

const looseSuccessSchema = ajv.compile<Record<string, unknown>>({ type: 'object', additionalProperties: true });
const looseSuccessResponse = {
	200: looseSuccessSchema,
	400: validateBadRequestErrorResponse,
	401: validateUnauthorizedErrorResponse,
	403: validateForbiddenErrorResponse,
};

const callIdBodySchema = ajv.compile<{ callId: string }>({
	type: 'object',
	properties: { callId: { type: 'string', minLength: 1 } },
	required: ['callId'],
	additionalProperties: true,
});

const callIdQuerySchema = ajv.compile<{ callId: string }>({
	type: 'object',
	properties: { callId: { type: 'string', minLength: 1 } },
	required: ['callId'],
	additionalProperties: true,
});

const livekitRoomNameFor = (callId: string) => `mc-${callId}`;

// Resolves the call + verifies the caller has access to the call's room.
// Returns the call doc on success; the API endpoint maps the error code to
// the right HTTP response. LiveKit calls are always room-scoped, so any
// room member is allowed to drive transport/recording/transcription state.
async function authorizeCall(
	callId: string | undefined,
	userId: string,
): Promise<
	| { call: NonNullable<Awaited<ReturnType<typeof VideoConferenceModel.findOneById>>> }
	| { error: 'invalid-params' | 'invalid-call' | 'forbidden' }
> {
	if (!callId) return { error: 'invalid-params' };
	const call = await VideoConferenceModel.findOneById(callId);
	if (!call) return { error: 'invalid-call' };
	if (!call.rid) return { error: 'invalid-call' };
	const room = await Rooms.findOneById(call.rid);
	if (!room || !(await canAccessRoomAsync(room, { _id: userId }))) {
		return { error: 'forbidden' };
	}
	return { call };
}

const broadcastVideoConferenceState = (rid: string, payload: { action: 'started' | 'ended'; callId: string }) => {
	try {
		(notifications.notifyRoom as any)(rid, 'video-conference-state', payload);
	} catch {
		/* notify is best-effort */
	}
};

// ============================================================================
// Lifecycle
// ============================================================================

/**
 * Mark the current user as having left an active LiveKit group call. The
 * call itself stays open until the last participant leaves or it expires.
 * Called by the bridge on disconnect + on tab close via fetch keepalive.
 */
API.v1.post(
	'video-conference.livekit.leave',
	{
		authRequired: true,
		body: callIdBodySchema,
		rateLimiterOptions: { numRequestsAllowed: 10, intervalTimeInMS: 60000 },
		response: looseSuccessResponse,
	},
	async function action() {
		const { callId } = this.bodyParams;
		const call = await VideoConferenceModel.findOneById(callId);
		if (call?.providerName !== 'livekit') return API.v1.failure('invalid-call');

		await VideoConferenceModel.markEmbeddedParticipantLeft(callId, this.userId);

		// If every participant has leftAt set, end the call.
		const updated = await VideoConferenceModel.findOneById(callId);
		const stillIn = (updated?.participants ?? []).filter((p) => !p.leftAt);
		if (stillIn.length === 0) {
			await VideoConferenceModel.setEndedById(callId, undefined, new Date());
			await VideoConferenceModel.setStatusById(callId, VideoConferenceStatus.ENDED);
			if (updated?.rid) broadcastVideoConferenceState(updated.rid, { action: 'ended', callId });
			// Fire summary generation. Idempotent and self-gated on the
			// `VideoConf_LiveKit_Summary_Enabled` setting + presence of
			// transcript entries, so it no-ops when not configured.
			const { maybeGenerateSummary } = await import('../lib/livekit-agent/summary');
			void maybeGenerateSummary(callId).catch(() => undefined);
		}

		return API.v1.success({});
	},
);

// ============================================================================
// Transport (LK credentials)
// ============================================================================

/**
 * Returns the transport config for a LiveKit conference: a freshly minted
 * { serverUrl, token, roomName } the client can hand to the LiveKit SDK.
 * Other (URL-based) providers don't need this — they hand off via a URL.
 */
API.v1.get(
	'video-conference.livekit.transport.config',
	{
		authRequired: true,
		query: callIdQuerySchema,
		rateLimiterOptions: { numRequestsAllowed: 10, intervalTimeInMS: 60000 },
		response: looseSuccessResponse,
	},
	async function action() {
		const { callId } = this.queryParams;
		const auth = await authorizeCall(callId, this.userId);
		if ('error' in auth) {
			if (auth.error === 'forbidden') return API.v1.forbidden();
			return API.v1.failure(auth.error);
		}
		const { call } = auth;

		if (call.providerName !== 'livekit') {
			return API.v1.success({ service: call.providerName });
		}

		if (!isLiveKitFullyConfigured()) return API.v1.failure('livekit-not-configured');

		try {
			const cfg = getLiveKitConfig();
			const roomName = livekitRoomNameFor(callId);
			const { user } = this;
			const token = await createLiveKitAccessToken({
				identity: this.userId,
				name: user?.name || user?.username || this.userId,
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

// ============================================================================
// Recording
// ============================================================================

API.v1.post(
	'video-conference.livekit.recording.start',
	{
		authRequired: true,
		body: callIdBodySchema,
		rateLimiterOptions: { numRequestsAllowed: 5, intervalTimeInMS: 60000 },
		response: looseSuccessResponse,
	},
	async function action() {
		if (!settings.get<boolean>('VideoConf_LiveKit_Enabled')) return API.v1.failure('livekit-not-enabled');
		const { callId } = this.bodyParams;
		const auth = await authorizeCall(callId, this.userId);
		if ('error' in auth) {
			if (auth.error === 'forbidden') return API.v1.forbidden();
			return API.v1.failure(auth.error);
		}
		try {
			return API.v1.success(await startMediaCallRecording(callId));
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
		body: callIdBodySchema,
		rateLimiterOptions: { numRequestsAllowed: 5, intervalTimeInMS: 60000 },
		response: looseSuccessResponse,
	},
	async function action() {
		const { callId } = this.bodyParams;
		const auth = await authorizeCall(callId, this.userId);
		if ('error' in auth) {
			if (auth.error === 'forbidden') return API.v1.forbidden();
			return API.v1.failure(auth.error);
		}
		try {
			await stopMediaCallRecording(callId);
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
		query: callIdQuerySchema,
		rateLimiterOptions: { numRequestsAllowed: 30, intervalTimeInMS: 60000 },
		response: looseSuccessResponse,
	},
	async function action() {
		const { callId } = this.queryParams;
		const auth = await authorizeCall(callId, this.userId);
		if ('error' in auth) {
			if (auth.error === 'forbidden') return API.v1.forbidden();
			return API.v1.failure(auth.error);
		}
		return API.v1.success(await getMediaCallRecordingState(callId));
	},
);

// ============================================================================
// Transcription ("take notes") + transcript ingestion
// ============================================================================

/** Turn on per-call transcription (take notes). Idempotent. */
API.v1.post(
	'video-conference.livekit.transcription.start',
	{
		authRequired: true,
		body: callIdBodySchema,
		rateLimiterOptions: { numRequestsAllowed: 30, intervalTimeInMS: 60_000 },
		response: looseSuccessResponse,
	},
	async function action() {
		if (!settings.get<boolean>('VideoConf_LiveKit_Summary_Enabled')) return API.v1.failure('transcription-not-enabled');
		const { callId } = this.bodyParams;
		const auth = await authorizeCall(callId, this.userId);
		if ('error' in auth) {
			if (auth.error === 'forbidden') return API.v1.forbidden();
			return API.v1.failure(auth.error);
		}
		await VideoConferenceModel.setTranscriptionById(callId, {
			enabled: true,
			startedAt: new Date(),
			startedBy: this.userId,
		});
		return API.v1.success({ success: true });
	},
);

/** Turn off per-call transcription. Existing transcript entries are preserved. */
API.v1.post(
	'video-conference.livekit.transcription.stop',
	{
		authRequired: true,
		body: callIdBodySchema,
		rateLimiterOptions: { numRequestsAllowed: 30, intervalTimeInMS: 60_000 },
		response: looseSuccessResponse,
	},
	async function action() {
		const { callId } = this.bodyParams;
		const auth = await authorizeCall(callId, this.userId);
		if ('error' in auth) {
			if (auth.error === 'forbidden') return API.v1.forbidden();
			return API.v1.failure(auth.error);
		}
		// Preserve startedAt/startedBy from prior transcription block so the
		// summary job can still attribute who turned it on for this call.
		const prev = auth.call.transcription;
		await VideoConferenceModel.setTranscriptionById(callId, {
			enabled: false,
			startedAt: prev?.startedAt,
			startedBy: prev?.startedBy,
			endedAt: new Date(),
		});
		return API.v1.success({ success: true });
	},
);

/** Current per-call transcription state — drives the "take notes" pill UI. */
API.v1.get(
	'video-conference.livekit.transcription.status',
	{
		authRequired: true,
		query: callIdQuerySchema,
		rateLimiterOptions: { numRequestsAllowed: 600, intervalTimeInMS: 60_000 },
		response: looseSuccessResponse,
	},
	async function action() {
		const { callId } = this.queryParams;
		const auth = await authorizeCall(callId, this.userId);
		if ('error' in auth) {
			if (auth.error === 'forbidden') return API.v1.forbidden();
			return API.v1.failure(auth.error);
		}
		const available = Boolean(
			settings.get<boolean>('VideoConf_LiveKit_Summary_Enabled') && settings.get<string>('VideoConf_LiveKit_Agent_Mode') === 'embedded',
		);
		return API.v1.success({
			success: true,
			available,
			enabled: Boolean(auth.call.transcription?.enabled),
		});
	},
);

const transcriptAppendBodySchema = ajv.compile<{
	callId: string;
	participantId: string;
	text: string;
	startedAt: string;
	endedAt: string;
}>({
	type: 'object',
	properties: {
		callId: { type: 'string', minLength: 1 },
		participantId: { type: 'string', minLength: 1 },
		text: { type: 'string', minLength: 1 },
		startedAt: { type: 'string' },
		endedAt: { type: 'string' },
	},
	required: ['callId', 'participantId', 'text', 'startedAt', 'endedAt'],
	additionalProperties: true,
});

/**
 * Agent → server transcript ingestion. Called once per finalized utterance
 * by the LiveKit agent worker. Auth is a shared-secret bearer token —
 * `lkagent:<LK_API_SECRET>` — because the worker is a Meteor subprocess
 * (it has the secret via env) and isn't acting as a Rocket.Chat user.
 */
API.v1.post(
	'video-conference.livekit.transcript.append',
	{
		authRequired: false,
		body: transcriptAppendBodySchema,
		rateLimiterOptions: { numRequestsAllowed: 600, intervalTimeInMS: 60_000 },
		response: looseSuccessResponse,
	},
	async function action() {
		const auth = this.request.headers.get('authorization') || '';
		const expected = `Bearer lkagent:${settings.get<string>('VideoConf_LiveKit_Api_Secret') || ''}`;
		if (!auth || auth !== expected) return API.v1.unauthorized();

		const { callId, participantId, text, startedAt, endedAt } = this.bodyParams;
		const call = await VideoConferenceModel.findOneById(callId);
		if (!call) return API.v1.failure('invalid-call');

		// Per-call "take notes" gate. The agent posts every final transcript
		// it produces; the server decides to drop them when note-taking
		// hasn't been opted into for this call. Returning success keeps the
		// worker's retry logic happy without writing anything.
		if (!call.transcription?.enabled) return API.v1.success({ success: true, skipped: true });

		try {
			await VideoConferenceModel.appendTranscriptEntryById(callId, {
				participantId,
				text,
				startedAt: new Date(startedAt),
				endedAt: new Date(endedAt),
			});
		} catch (err) {
			logger.warn({ msg: 'failed to append transcript entry', err, callId });
			return API.v1.failure('persist-failed');
		}

		return API.v1.success({ success: true });
	},
);
