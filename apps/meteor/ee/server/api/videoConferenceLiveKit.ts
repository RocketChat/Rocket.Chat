import { Logger } from '@rocket.chat/logger';
import { VideoConference as VideoConferenceModel } from '@rocket.chat/models';
import {
	ajv,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';

import { API } from '../../../server/api/api';
import { canAccessConference } from '../../../server/lib/videoConfAccess';
import { createLiveKitAccessToken, getLiveKitConfig, isLiveKitFullyConfigured } from '../lib/livekit';

const logger = new Logger('VideoConference/LiveKit/API');

const looseSuccessSchema = ajv.compile<Record<string, unknown>>({ type: 'object', additionalProperties: true });
const looseSuccessResponse = {
	200: looseSuccessSchema,
	400: validateBadRequestErrorResponse,
	401: validateUnauthorizedErrorResponse,
	403: validateForbiddenErrorResponse,
};

const callIdQuerySchema = ajv.compile<{ callId: string }>({
	type: 'object',
	properties: { callId: { type: 'string', minLength: 1 } },
	required: ['callId'],
	additionalProperties: true,
});

const livekitRoomNameFor = (callId: string) => `mc-${callId}`;

/**
 * Resolves the call and verifies the caller is allowed near it. Returns the call doc on success; the endpoint
 * maps the error code to the right HTTP response.
 *
 * Allowed is `canAccessConference` — the same rule the conference endpoints use — and deliberately not "can
 * access the call's room". Membership of a call is granted without any room access, so a conference started in a
 * DM and joined by a third person has a member with no subscription to that DM: checking the room refused them
 * the credentials for their own call, and, because a missing token is indistinguishable from a call that hasn't
 * connected yet, they got a call window showing them alone with controls that did nothing.
 */
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
	if (!(await canAccessConference(call, userId))) {
		return { error: 'forbidden' };
	}
	return { call };
}

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
