import { Logger } from '@rocket.chat/logger';
import { VideoConference as VideoConferenceModel } from '@rocket.chat/models';
import { ajv, validateBadRequestErrorResponse, validateUnauthorizedErrorResponse } from '@rocket.chat/rest-typings';

import { API } from '../../../app/api/server/api';
import { settings } from '../../../app/settings/server';

const logger = new Logger('VideoConference/LiveKit/Transcript/API');

const successSchema = ajv.compile<{ success: true }>({
	type: 'object',
	properties: { success: { type: 'boolean' } },
	required: ['success'],
	additionalProperties: true,
});

const successResponse = {
	200: successSchema,
	400: validateBadRequestErrorResponse,
	401: validateUnauthorizedErrorResponse,
};

const bodySchema = ajv.compile<{
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
 *
 * Endpoint is intentionally minimal: it validates, looks up the call,
 * appends a TranscriptEntry, and returns. The downstream summary job
 * reads `IVideoConference.transcript` once the call has ended.
 */
API.v1.post(
	'video-conference.livekit.transcript.append',
	{
		authRequired: false,
		body: bodySchema,
		response: successResponse,
		rateLimiterOptions: { numRequestsAllowed: 600, intervalTimeInMS: 60_000 },
	},
	async function action() {
		const auth = this.request.headers.get('authorization') || '';
		const expected = `Bearer lkagent:${settings.get<string>('VideoConf_LiveKit_Api_Secret') || ''}`;
		if (!auth || auth !== expected) {
			return API.v1.unauthorized();
		}

		const { callId, participantId, text, startedAt, endedAt } = this.bodyParams;
		const call = await VideoConferenceModel.findOneById(callId);
		if (!call) {
			return API.v1.failure('invalid-call');
		}

		// Per-call "take notes" gate. The agent posts every final transcript
		// it produces; the server is the one that decides to drop them when
		// the user hasn't opted into note-taking for this call. Returning
		// success (with skipped=true) makes the worker's retry logic happy
		// without us writing anything.
		if (!call.transcription?.enabled) {
			return API.v1.success({ success: true, skipped: true });
		}

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

// --- Per-call "take notes" toggle (transcription on/off) ---

const toggleBodySchema = ajv.compile<{ callId: string }>({
	type: 'object',
	properties: { callId: { type: 'string', minLength: 1 } },
	required: ['callId'],
	additionalProperties: true,
});

const statusQuerySchema = ajv.compile<{ callId: string }>({
	type: 'object',
	properties: { callId: { type: 'string', minLength: 1 } },
	required: ['callId'],
	additionalProperties: true,
});

// Membership check for an embedded VC: the user must be able to access the
// room the call belongs to. The transcription endpoints don't gate by
// "must have already joined the call" — the take-notes flag is a property
// of the call, not the participant.
const isCallMember = async (call: { rid?: string }, userId: string): Promise<boolean> => {
	if (!call.rid) return false;
	const { Rooms } = await import('@rocket.chat/models');
	const { canAccessRoomAsync } = await import('../../../app/authorization/server/functions/canAccessRoom');
	const room = await Rooms.findOneById(call.rid);
	return Boolean(room && (await canAccessRoomAsync(room, { _id: userId })));
};

/** Turn on per-call transcription (take notes). Idempotent. */
API.v1.post(
	'video-conference.livekit.transcription.start',
	{
		authRequired: true,
		body: toggleBodySchema,
		response: successResponse,
		rateLimiterOptions: { numRequestsAllowed: 30, intervalTimeInMS: 60_000 },
	},
	async function action() {
		if (!settings.get<boolean>('VideoConf_LiveKit_Summary_Enabled')) {
			return API.v1.failure('transcription-not-enabled');
		}
		const { callId } = this.bodyParams;
		const call = await VideoConferenceModel.findOneById(callId);
		if (!call) return API.v1.failure('invalid-call');
		if (!(await isCallMember(call, this.userId))) return API.v1.unauthorized();
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
		body: toggleBodySchema,
		response: successResponse,
		rateLimiterOptions: { numRequestsAllowed: 30, intervalTimeInMS: 60_000 },
	},
	async function action() {
		const { callId } = this.bodyParams;
		const call = await VideoConferenceModel.findOneById(callId);
		if (!call) return API.v1.failure('invalid-call');
		if (!(await isCallMember(call, this.userId))) return API.v1.unauthorized();
		// Preserve startedAt/startedBy from prior transcription block so the
		// summary job can still attribute who turned it on for this call.
		const prev = call.transcription;
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
		query: statusQuerySchema,
		response: successResponse,
		rateLimiterOptions: { numRequestsAllowed: 600, intervalTimeInMS: 60_000 },
	},
	async function action() {
		const { callId } = this.queryParams;
		const call = await VideoConferenceModel.findOneById(callId);
		if (!call) return API.v1.failure('invalid-call');
		if (!(await isCallMember(call, this.userId))) return API.v1.unauthorized();
		const transcriptionFeatureEnabled = Boolean(
			settings.get<boolean>('VideoConf_LiveKit_Summary_Enabled') && settings.get<string>('VideoConf_LiveKit_Agent_Mode') === 'embedded',
		);
		return API.v1.success({
			success: true,
			available: transcriptionFeatureEnabled,
			enabled: Boolean(call.transcription?.enabled),
		});
	},
);
