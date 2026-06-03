import { Logger } from '@rocket.chat/logger';
import { MediaCalls as MediaCallsModel } from '@rocket.chat/models';
import { ajv, validateBadRequestErrorResponse, validateUnauthorizedErrorResponse } from '@rocket.chat/rest-typings';

import { API } from '../../../app/api/server/api';
import { settings } from '../../../app/settings/server';

const logger = new Logger('MediaCalls/Transcript/API');

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
 * reads `IMediaCall.transcript` once the call has ended.
 */
API.v1.post(
	'media-calls.transcript.append',
	{
		authRequired: false,
		body: bodySchema,
		response: successResponse,
		rateLimiterOptions: { numRequestsAllowed: 600, intervalTimeInMS: 60_000 },
	},
	async function action() {
		const auth = this.request.headers.get('authorization') || '';
		const expected = `Bearer lkagent:${settings.get<string>('VoIP_TeamCollab_LiveKit_Api_Secret') || ''}`;
		if (!auth || auth !== expected) {
			return API.v1.unauthorized();
		}

		const { callId, participantId, text, startedAt, endedAt } = this.bodyParams;
		const call = await MediaCallsModel.findOneById(callId);
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
			await MediaCallsModel.appendTranscriptEntry(callId, {
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

const isCallMember = async (call: any, userId: string): Promise<boolean> => {
	if (call.kind === 'group') {
		const { Rooms } = await import('@rocket.chat/models');
		const { canAccessRoomAsync } = await import('../../../app/authorization/server/functions/canAccessRoom');
		if (!call.rid) return false;
		const room = await Rooms.findOneById(call.rid);
		return Boolean(room && (await canAccessRoomAsync(room, { _id: userId })));
	}
	return call.caller?.id === userId || call.callee?.id === userId;
};

/** Turn on per-call transcription (take notes). Idempotent. */
API.v1.post(
	'media-calls.transcription.start',
	{
		authRequired: true,
		body: toggleBodySchema,
		response: successResponse,
		rateLimiterOptions: { numRequestsAllowed: 30, intervalTimeInMS: 60_000 },
	},
	async function action() {
		if (!settings.get<boolean>('VoIP_TeamCollab_LiveKit_Summary_Enabled')) {
			return API.v1.failure('transcription-not-enabled');
		}
		const { callId } = this.bodyParams;
		const call = await MediaCallsModel.findOneById(callId);
		if (!call) return API.v1.failure('invalid-call');
		if (!(await isCallMember(call, this.userId))) return API.v1.unauthorized();
		await MediaCallsModel.setTranscriptionEnabled(callId, true, this.userId);
		return API.v1.success({ success: true });
	},
);

/** Turn off per-call transcription. Existing transcript entries are preserved. */
API.v1.post(
	'media-calls.transcription.stop',
	{
		authRequired: true,
		body: toggleBodySchema,
		response: successResponse,
		rateLimiterOptions: { numRequestsAllowed: 30, intervalTimeInMS: 60_000 },
	},
	async function action() {
		const { callId } = this.bodyParams;
		const call = await MediaCallsModel.findOneById(callId);
		if (!call) return API.v1.failure('invalid-call');
		if (!(await isCallMember(call, this.userId))) return API.v1.unauthorized();
		await MediaCallsModel.setTranscriptionEnabled(callId, false);
		return API.v1.success({ success: true });
	},
);

/** Current per-call transcription state — drives the pill UI. */
API.v1.get(
	'media-calls.transcription.status',
	{
		authRequired: true,
		query: statusQuerySchema,
		response: successResponse,
		rateLimiterOptions: { numRequestsAllowed: 600, intervalTimeInMS: 60_000 },
	},
	async function action() {
		const { callId } = this.queryParams;
		const call = await MediaCallsModel.findOneById(callId);
		if (!call) return API.v1.failure('invalid-call');
		if (!(await isCallMember(call, this.userId))) return API.v1.unauthorized();
		const transcriptionFeatureEnabled = Boolean(
			settings.get<boolean>('VoIP_TeamCollab_LiveKit_Summary_Enabled') &&
				settings.get<string>('VoIP_TeamCollab_LiveKit_Agent_Mode') === 'embedded',
		);
		return API.v1.success({
			success: true,
			available: transcriptionFeatureEnabled,
			enabled: Boolean(call.transcription?.enabled),
		});
	},
);
