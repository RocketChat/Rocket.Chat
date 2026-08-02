import { VideoConf } from '@rocket.chat/core-services';
import type { VideoConference, VideoConferenceCapabilities, VideoConferenceInstructions } from '@rocket.chat/core-typings';
import {
	ajv,
	isVideoConfStartProps,
	isVideoConfJoinProps,
	isVideoConfLeaveProps,
	isVideoConfRingProps,
	isVideoConfCancelProps,
	isVideoConfInfoProps,
	isVideoConfListProps,
	isVideoConfAddParticipantsProps,
	isVideoConfDeclineProps,
	isVideoConfShareChatProps,
	validateUnauthorizedErrorResponse,
	validateForbiddenErrorResponse,
	validateBadRequestErrorResponse,
} from '@rocket.chat/rest-typings';

import { availabilityErrors } from '../../../lib/videoConference/constants';
import { canAccessRoomIdAsync } from '../../lib/authorization/canAccessRoom';
import { canSendMessageAsync } from '../../lib/authorization/canSendMessage';
import { hasPermissionAsync } from '../../lib/authorization/hasPermission';
import { videoConfProviders } from '../../lib/videoConfProviders';
import { API } from '../api';
import { getPaginationItems } from '../lib/getPaginationItems';

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

/**
 * Being in the call and being able to read its chat are separate things, so authorization accepts either:
 * membership of the conference, or access to a room the conference lives in.
 *
 * Membership covers people added from outside the room — they were added to the *call*, not to a room, so
 * there is no subscription to check. The room checks cover everyone who can already see the conversation:
 * `rid` is the room the call started in, and `discussionRid` the discussion its chat may have moved to,
 * whose members may have no access to the parent room.
 */
const canAccessConference = async (
	call: Pick<VideoConference, 'rid' | 'discussionRid' | 'users'>,
	userId: string | undefined,
): Promise<boolean> => {
	if (!userId) {
		return false;
	}

	if (call.users.some(({ _id }) => _id === userId)) {
		return true;
	}

	if (await canAccessRoomIdAsync(call.rid, userId)) {
		return true;
	}

	return !!call.discussionRid && canAccessRoomIdAsync(call.discussionRid, userId);
};

const addParticipantsResponseSchema = ajv.compile<{ added: string[] }>({
	type: 'object',
	properties: {
		added: { type: 'array', items: { type: 'string' }, description: 'Ids of the users newly added as members.' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['added', 'success'],
	additionalProperties: false,
});

const ringResponseSchema = ajv.compile<{ rang: string[] }>({
	type: 'object',
	properties: {
		rang: { type: 'array', items: { type: 'string' }, description: 'Ids of the members who were rung.' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['rang', 'success'],
	additionalProperties: false,
});

const shareChatResponseSchema = ajv.compile<{ rid: string }>({
	type: 'object',
	properties: {
		rid: { type: 'string', description: 'The room the conference chat now lives in.' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['rid', 'success'],
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

		if (!(await canAccessConference(call, userId))) {
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

API.v1.post(
	'video-conference.decline',
	{
		authRequired: true,
		body: isVideoConfDeclineProps,
		rateLimiterOptions: { numRequestsAllowed: 10, intervalTimeInMS: 60000 },
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

		if (!(await canAccessConference(call, userId)) || !userId) {
			return API.v1.failure('invalid-params');
		}

		// Records the decline against the caller's own membership only. Declining is deliberately not a way to
		// end someone else's conference, so this takes no target user and never touches the call's status.
		await VideoConf.declineCall(userId, callId);

		return API.v1.success();
	},
);

API.v1.post(
	'video-conference.leave',
	{
		authRequired: true,
		body: isVideoConfLeaveProps,
		// Sent when the call window closes, which a user can do repeatedly across rejoins.
		rateLimiterOptions: { numRequestsAllowed: 20, intervalTimeInMS: 60000 },
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

		if (!(await canAccessConference(call, userId)) || !userId) {
			return API.v1.failure('invalid-params');
		}

		// Only ever marks the caller as gone. The conference ends as a consequence of nobody being left in it,
		// not because one participant asked for it — the same rule declining follows.
		await VideoConf.leaveCall(userId, callId);

		return API.v1.success();
	},
);

API.v1.post(
	'video-conference.ring',
	{
		authRequired: true,
		body: isVideoConfRingProps,
		// Ringing again is a deliberate, repeatable act, but not one worth hammering someone with.
		rateLimiterOptions: { numRequestsAllowed: 5, intervalTimeInMS: 60000 },
		response: {
			200: ringResponseSchema,
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

		if (!(await canAccessConference(call, userId)) || !userId) {
			return API.v1.failure('invalid-params');
		}

		const rang = await VideoConf.ringMembers(userId, callId);

		return API.v1.success({ rang });
	},
);

API.v1.post(
	'video-conference.add-participants',
	{
		authRequired: true,
		body: isVideoConfAddParticipantsProps,
		rateLimiterOptions: { numRequestsAllowed: 5, intervalTimeInMS: 60000 },
		response: {
			200: addParticipantsResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { callId, users } = this.bodyParams;
		const { userId } = this;

		const call = await VideoConf.get(callId);
		if (!call) {
			return API.v1.failure('invalid-params');
		}

		if (!(await canAccessConference(call, userId))) {
			return API.v1.failure('invalid-params');
		}

		// Registers the users as conference members — it deliberately does not put them in any room. Being a
		// member authorizes joining the call; whether they can read the chat is surfaced separately.
		const added = await VideoConf.addMembers(userId, callId, users);

		return API.v1.success({ added });
	},
);

API.v1.post(
	'video-conference.share-chat',
	{
		authRequired: true,
		body: isVideoConfShareChatProps,
		rateLimiterOptions: { numRequestsAllowed: 5, intervalTimeInMS: 60000 },
		response: {
			200: shareChatResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { callId, mode } = this.bodyParams;
		const { userId } = this;

		const call = await VideoConf.get(callId);
		if (!call) {
			return API.v1.failure('invalid-params');
		}

		if (!(await canAccessConference(call, userId)) || !userId) {
			return API.v1.failure('invalid-params');
		}

		const rid = await VideoConf.shareChatWithMembers(userId, callId, mode);

		return API.v1.success({ rid });
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

		if (!(await canAccessConference(call, userId))) {
			return API.v1.failure('invalid-params');
		}

		// Membership grants no room access, so some members may not be able to read the chat. The conference UI
		// surfaces them and offers the remedy, which is why this ships with the conference rather than needing
		// its own round trip.
		const [capabilities, chatAccess] = await Promise.all([
			VideoConf.listProviderCapabilities(call.providerName),
			VideoConf.getChatAccess(userId, callId),
		]);

		return API.v1.success({
			...(call as VideoConference),
			capabilities,
			chatAccess,
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
