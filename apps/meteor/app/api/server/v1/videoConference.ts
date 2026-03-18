import { VideoConf } from '@rocket.chat/core-services';
import type { VideoConference, VideoConferenceCapabilities, VideoConferenceInstructions } from '@rocket.chat/core-typings';
import {
	ajv,
	isVideoConfStartProps,
	isVideoConfJoinProps,
	isVideoConfCancelProps,
	isVideoConfInfoProps,
	isVideoConfListProps,
	validateUnauthorizedErrorResponse,
	validateForbiddenErrorResponse,
	validateBadRequestErrorResponse,
} from '@rocket.chat/rest-typings';

import { availabilityErrors } from '../../../../lib/videoConference/constants';
import { videoConfProviders } from '../../../../server/lib/videoConfProviders';
import { canAccessRoomIdAsync } from '../../../authorization/server/functions/canAccessRoom';
import { canSendMessageAsync } from '../../../authorization/server/functions/canSendMessage';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

const startResponseSchema = ajv.compile<{ data: VideoConferenceInstructions & { providerName: string } }>({
	type: 'object',
	properties: {
		data: {
			allOf: [
				{
					oneOf: [
						{ $ref: '#/components/schemas/DirectCallInstructions' },
						{ $ref: '#/components/schemas/ConferenceInstructions' },
						{ $ref: '#/components/schemas/LivechatInstructions' },
					],
				},
				{ type: 'object', properties: { providerName: { type: 'string' } }, required: ['providerName'] },
			],
		},
		success: { type: 'boolean', enum: [true] },
	},
	required: ['data', 'success'],
	additionalProperties: false,
});

const joinResponseSchema = ajv.compile<{ url: string; providerName: string }>({
	type: 'object',
	properties: {
		url: { type: 'string' },
		providerName: { type: 'string' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['url', 'providerName', 'success'],
	additionalProperties: false,
});

const cancelResponseSchema = ajv.compile<void>({
	type: 'object',
	properties: { success: { type: 'boolean', enum: [true] } },
	required: ['success'],
	additionalProperties: false,
});

const infoResponseSchema = ajv.compile<VideoConference & { capabilities: VideoConferenceCapabilities }>({
	type: 'object',
	properties: {
		capabilities: { $ref: '#/components/schemas/VideoConferenceCapabilities' },
	},
	additionalProperties: true,
});

const listResponseSchema = ajv.compile<{ data: VideoConference[]; count: number; offset: number; total: number }>({
	type: 'object',
	properties: {
		data: {
			type: 'array',
			items: {
				oneOf: [
					{ $ref: '#/components/schemas/IDirectVideoConference' },
					{ $ref: '#/components/schemas/IGroupVideoConference' },
					{ $ref: '#/components/schemas/ILivechatVideoConference' },
					{ $ref: '#/components/schemas/IVoIPVideoConference' },
				],
			},
		},
		count: { type: 'number' },
		offset: { type: 'number' },
		total: { type: 'number' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['data', 'count', 'offset', 'total', 'success'],
	additionalProperties: false,
});

const providersResponseSchema = ajv.compile<{ data: { key: string; label: string }[] }>({
	type: 'object',
	properties: {
		data: {
			type: 'array',
			items: {
				type: 'object',
				properties: { key: { type: 'string' }, label: { type: 'string' } },
				required: ['key', 'label'],
			},
		},
		success: { type: 'boolean', enum: [true] },
	},
	required: ['data', 'success'],
	additionalProperties: false,
});

const capabilitiesResponseSchema = ajv.compile<{ providerName: string; capabilities: VideoConferenceCapabilities }>({
	type: 'object',
	properties: {
		providerName: { type: 'string' },
		capabilities: { $ref: '#/components/schemas/VideoConferenceCapabilities' },
	},
	additionalProperties: true,
});

API.v1.post(
	'video-conference.start',
	{
		authRequired: true,
		body: isVideoConfStartProps,
		rateLimiterOptions: { numRequestsAllowed: 3, intervalTimeInMS: 60000 },
		response: {
			200: startResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { roomId, title, allowRinging: requestRinging } = this.bodyParams;
		const { userId } = this;

		if (!(await hasPermissionAsync(userId, 'call-management', roomId))) {
			return API.v1.forbidden('Not allowed');
		}

		try {
			await canSendMessageAsync(roomId, {
				uid: userId,
				username: this.user.username,
				type: this.user.type ?? 'user',
			});
		} catch {
			return API.v1.forbidden('Not allowed');
		}

		try {
			const providerName = videoConfProviders.getActiveProvider();

			if (!providerName) {
				throw new Error(availabilityErrors.NOT_ACTIVE);
			}

			const allowRinging = Boolean(requestRinging) && (await hasPermissionAsync(userId, 'videoconf-ring-users'));

			return API.v1.success({
				data: {
					...(await VideoConf.start(userId, roomId, { title, allowRinging })),
					providerName,
				},
			});
		} catch (e) {
			return API.v1.failure(await VideoConf.diagnoseProvider(userId, roomId));
		}
	},
);

API.v1.post(
	'video-conference.join',
	{
		authOrAnonRequired: true,
		body: isVideoConfJoinProps,
		rateLimiterOptions: { numRequestsAllowed: 2, intervalTimeInMS: 5000 },
		response: {
			200: joinResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { callId, state } = this.bodyParams;
		const { userId } = this;

		const call = await VideoConf.get(callId);
		if (!call) {
			return API.v1.failure('invalid-params');
		}

		if (!(await canAccessRoomIdAsync(call.rid, userId))) {
			return API.v1.failure('invalid-params');
		}

		let url: string | undefined;

		try {
			url = await VideoConf.join(userId, callId, {
				...(state?.cam !== undefined ? { cam: state.cam } : {}),
				...(state?.mic !== undefined ? { mic: state.mic } : {}),
			});
		} catch (e) {
			if (userId) {
				return API.v1.failure(await VideoConf.diagnoseProvider(userId, call.rid, call.providerName));
			}
		}

		if (!url) {
			return API.v1.failure('failed-to-get-url');
		}

		return API.v1.success({
			url,
			providerName: call.providerName,
		});
	},
);

API.v1.post(
	'video-conference.cancel',
	{
		authRequired: true,
		body: isVideoConfCancelProps,
		rateLimiterOptions: { numRequestsAllowed: 3, intervalTimeInMS: 60000 },
		response: {
			200: cancelResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { callId } = this.bodyParams;
		const { userId } = this;

		const call = await VideoConf.get(callId);
		if (!call) {
			return API.v1.failure('invalid-params');
		}

		if (!userId || !(await canAccessRoomIdAsync(call.rid, userId))) {
			return API.v1.failure('invalid-params');
		}

		await VideoConf.cancel(userId, callId);
		return API.v1.success();
	},
);

API.v1.get(
	'video-conference.info',
	{
		authRequired: true,
		query: isVideoConfInfoProps,
		rateLimiterOptions: { numRequestsAllowed: 15, intervalTimeInMS: 3000 },
		response: {
			200: infoResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { callId } = this.queryParams;
		const { userId } = this;

		const call = await VideoConf.get(callId);
		if (!call) {
			return API.v1.failure('invalid-params');
		}

		if (!userId || !(await canAccessRoomIdAsync(call.rid, userId))) {
			return API.v1.failure('invalid-params');
		}

		const capabilities = await VideoConf.listProviderCapabilities(call.providerName);

		return API.v1.success({
			...(call as VideoConference),
			capabilities,
		});
	},
);

API.v1.get(
	'video-conference.list',
	{
		authRequired: true,
		query: isVideoConfListProps,
		rateLimiterOptions: { numRequestsAllowed: 3, intervalTimeInMS: 1000 },
		response: {
			200: listResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { roomId } = this.queryParams;
		const { userId } = this;

		const { offset, count } = await getPaginationItems(this.queryParams);

		if (!userId || !(await canAccessRoomIdAsync(roomId, userId))) {
			return API.v1.failure('invalid-params');
		}

		const data = await VideoConf.list(roomId, { offset, count });

		return API.v1.success(data);
	},
);

API.v1.get(
	'video-conference.providers',
	{
		authRequired: true,
		rateLimiterOptions: { numRequestsAllowed: 3, intervalTimeInMS: 1000 },
		response: {
			200: providersResponseSchema,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const data = await VideoConf.listProviders();

		return API.v1.success({ data });
	},
);

API.v1.get(
	'video-conference.capabilities',
	{
		authRequired: true,
		rateLimiterOptions: { numRequestsAllowed: 3, intervalTimeInMS: 1000 },
		response: {
			200: capabilitiesResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const data = await VideoConf.listCapabilities();

		return API.v1.success(data);
	},
);
