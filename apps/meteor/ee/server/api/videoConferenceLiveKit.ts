import { Authorization } from '@rocket.chat/core-services';
import { Logger } from '@rocket.chat/logger';
import { VideoConference as VideoConferenceModel } from '@rocket.chat/models';
import {
	ajv,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';

import { API } from '../../../server/api/api';
import { createLiveKitAccessToken, getLiveKitConfig, isLiveKitFullyConfigured } from '../lib/livekit';

const logger = new Logger('VideoConference/LiveKit/API');

type TransportConfigResponse = {
	service: string;
	livekit?: { serverUrl: string; token: string; roomName: string };
};

const transportConfigResponseSchema = ajv.compile<TransportConfigResponse>({
	type: 'object',
	properties: {
		success: { type: 'boolean', enum: [true] },
		service: { type: 'string' },
		livekit: {
			type: 'object',
			properties: {
				serverUrl: { type: 'string' },
				token: { type: 'string' },
				roomName: { type: 'string' },
			},
			required: ['serverUrl', 'token', 'roomName'],
			additionalProperties: false,
		},
	},
	required: ['success', 'service'],
	additionalProperties: false,
});

const callIdQuerySchema = ajv.compile<{ callId: string }>({
	type: 'object',
	properties: { callId: { type: 'string', minLength: 1 } },
	required: ['callId'],
	additionalProperties: false,
});

const livekitRoomNameFor = (callId: string) => `mc-${callId}`;

/** Credentials for the caller's own LiveKit call; other providers answer with their name only. */
API.v1.get(
	'video-conference.livekit.transport.config',
	{
		authRequired: true,
		query: callIdQuerySchema,
		rateLimiterOptions: { numRequestsAllowed: 10, intervalTimeInMS: 60000 },
		response: {
			200: transportConfigResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { callId } = this.queryParams;

		const call = await VideoConferenceModel.findOneById(callId);
		if (!call?.rid) {
			return API.v1.failure('invalid-call');
		}

		// Call membership is granted without room access, so the conference rule applies rather than the room's.
		if (!(await Authorization.canAccessConference(call, this.user._id))) {
			return API.v1.forbidden();
		}

		if (call.providerName !== 'livekit') {
			return API.v1.success({ service: call.providerName });
		}

		if (!isLiveKitFullyConfigured()) {
			return API.v1.failure('livekit-not-configured');
		}

		const roomName = livekitRoomNameFor(callId);
		const token = await createLiveKitAccessToken({
			identity: this.user._id,
			name: this.user.name || this.user.username || this.user._id,
			grant: { roomJoin: true, room: roomName, canPublish: true, canSubscribe: true, canPublishData: true },
		}).catch((err) => {
			logger.error({ msg: 'Failed to mint LiveKit access token', callId, err });
			return undefined;
		});

		if (!token) {
			return API.v1.failure('livekit-token-failed');
		}

		return API.v1.success({
			service: 'livekit',
			livekit: { serverUrl: getLiveKitConfig().url, token, roomName },
		});
	},
);
