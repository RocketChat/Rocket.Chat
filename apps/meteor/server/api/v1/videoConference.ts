import { VideoConf } from '@rocket.chat/core-services';
import type { VideoConference, VideoConferenceCapabilities, VideoConferenceInstructions } from '@rocket.chat/core-typings';
import {
	ajv,
	isVideoConfStartProps,
	isVideoConfJoinProps,
	isVideoConfRingProps,
	isVideoConfCallIdProps,
	isVideoConfInfoProps,
	isVideoConfListProps,
	isVideoConfAddParticipantsProps,
	isVideoConfRenameProps,
	isVideoConfShareChatProps,
	validateUnauthorizedErrorResponse,
	validateForbiddenErrorResponse,
	validateBadRequestErrorResponse,
	validateNotFoundErrorResponse,
} from '@rocket.chat/rest-typings';

import { availabilityErrors } from '../../../lib/videoConference/constants';
import { canAccessRoomIdAsync } from '../../lib/authorization/canAccessRoom';
import { canSendMessageAsync } from '../../lib/authorization/canSendMessage';
import { hasPermissionAsync } from '../../lib/authorization/hasPermission';
import { canAccessConference } from '../../lib/videoConfAccess';
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

const joinResponseSchema = ajv.compile<{ url: string; providerName: string; callId?: string; rid?: string }>({
	type: 'object',
	properties: {
		url: { type: 'string' },
		providerName: { type: 'string' },
		callId: { type: 'string' },
		rid: { type: 'string' },
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
 * How every conference endpoint below starts: the call has to exist, and the caller has to be allowed near it.
 *
 * Both failures answer a bare 404, vague about which it was, so a stranger cannot learn that a call id is
 * real. Endpoints published before this rule still answer 400 until a major may change it.
 */
const loadAccessibleConference = async (
	callId: VideoConference['_id'],
	userId: string,
): Promise<Omit<VideoConference, 'providerData'> | undefined> => {
	const call = await VideoConf.get(callId);
	if (!call || !(await canAccessConference(call, userId))) {
		return undefined;
	}

	return call;
};

/**
 * The conference endpoints answer with one value beside `success`, so their schemas differ in a single property.
 */
const oneValueResponseSchema = <T>(name: string, value: Record<string, unknown>) =>
	ajv.compile<T>({
		type: 'object',
		properties: { [name]: value, success: { type: 'boolean', enum: [true] } },
		required: [name, 'success'],
		additionalProperties: false,
	});

const addParticipantsResponseSchema = oneValueResponseSchema<{ added: string[] }>('added', {
	type: 'array',
	items: { type: 'string' },
	description: 'Ids of the users newly added as members.',
});

const joinableResponseSchema = oneValueResponseSchema<{ calls: unknown[] }>('calls', {
	type: 'array',
	items: { type: 'object' },
	description: 'Calls running now that the caller may join.',
});

const ringResponseSchema = oneValueResponseSchema<{ rang: boolean }>('rang', {
	type: 'boolean',
	description:
		'Whether the member was rung. False when there was nothing to do — they are in the call, their phone is already ringing, or the call has ended.',
});

const shareChatResponseSchema = oneValueResponseSchema<{ rid: string }>('rid', {
	type: 'string',
	description: 'The room the conference chat now lives in.',
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

		if (!(await hasPermissionAsync(this.user, 'call-management', roomId))) {
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

			const allowRinging = Boolean(requestRinging) && (await hasPermissionAsync(this.user, 'videoconf-ring-users'));

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
		// TODO: 404, once a published endpoint may change status — see `loadAccessibleConference`.
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

		// An embedded call renders inline and has no URL to hand back. For every other provider the URL is the
		// whole point of joining, so coming back without one is a failure.
		if (!url && !videoConfProviders.getProviderCapabilities(call.providerName)?.embedded) {
			return API.v1.failure('failed-to-get-url');
		}

		return API.v1.success({
			url: url ?? '',
			providerName: call.providerName,
			callId: call._id,
			rid: call.rid,
		});
	},
);

API.v1.post(
	'video-conference.cancel',
	{
		authRequired: true,
		body: isVideoConfCallIdProps,
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
		// TODO: 404, once a published endpoint may change status — see `loadAccessibleConference`.
		if (!call) {
			return API.v1.failure('invalid-params');
		}

		if (!(await canAccessRoomIdAsync(call.rid, userId))) {
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
		body: isVideoConfCallIdProps,
		rateLimiterOptions: { numRequestsAllowed: 10, intervalTimeInMS: 60000 },
		response: {
			200: cancelResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			404: validateNotFoundErrorResponse,
		},
	},
	async function action() {
		const { callId } = this.bodyParams;

		const call = await loadAccessibleConference(callId, this.userId);
		if (!call) {
			return API.v1.notFound();
		}

		// Records the decline against the caller's own membership only. Declining is deliberately not a way to
		// end someone else's conference, so this takes no target user and never touches the call's status.
		await VideoConf.declineCall(this.userId, callId);

		return API.v1.success();
	},
);

API.v1.post(
	'video-conference.leave',
	{
		authRequired: true,
		body: isVideoConfCallIdProps,
		// Sent when the call window closes, which a user can do repeatedly across rejoins.
		rateLimiterOptions: { numRequestsAllowed: 20, intervalTimeInMS: 60000 },
		response: {
			200: cancelResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			404: validateNotFoundErrorResponse,
		},
	},
	async function action() {
		const { callId } = this.bodyParams;

		const call = await loadAccessibleConference(callId, this.userId);
		if (!call) {
			return API.v1.notFound();
		}

		// Only ever marks the caller as gone. The conference ends as a consequence of nobody being left in it,
		// not because one participant asked for it — the same rule declining follows.
		await VideoConf.leaveCall(this.userId, callId);

		return API.v1.success();
	},
);

/**
 * Renews the caller's presence lease on a call.
 *
 * The counterpart of `video-conference.leave`, and what makes a lost leave survivable.
 */
API.v1.post(
	'video-conference.heartbeat',
	{
		authRequired: true,
		body: isVideoConfCallIdProps,
		// Renewals are every `PRESENCE_HEARTBEAT_MS`, so twice a minute, plus one whenever the window is brought
		// back to the front. The allowance is for that: bursts of attention, not a higher steady rate.
		rateLimiterOptions: { numRequestsAllowed: 20, intervalTimeInMS: 60000 },
		response: {
			200: cancelResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			404: validateNotFoundErrorResponse,
		},
	},
	async function action() {
		const { callId } = this.bodyParams;

		const call = await loadAccessibleConference(callId, this.userId);
		if (!call) {
			return API.v1.notFound();
		}

		await VideoConf.renewPresence(this.userId, callId);

		return API.v1.success();
	},
);

API.v1.post(
	'video-conference.ring',
	{
		authRequired: true,
		body: isVideoConfRingProps,
		// The same permission `video-conference.start` demands before ringing anyone — having access to a
		// conference must not be a way around it.
		permissionsRequired: ['videoconf-ring-users'],
		// Ringing again is a deliberate, repeatable act, but not one worth hammering someone with.
		rateLimiterOptions: { numRequestsAllowed: 5, intervalTimeInMS: 60000 },
		response: {
			200: ringResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
			404: validateNotFoundErrorResponse,
		},
	},
	async function action() {
		const { callId, userId } = this.bodyParams;

		const call = await loadAccessibleConference(callId, this.userId);
		if (!call) {
			return API.v1.notFound();
		}

		const rang = await VideoConf.ringMember(this.userId, callId, userId);

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
			404: validateNotFoundErrorResponse,
		},
	},
	async function action() {
		const { callId, users, ring } = this.bodyParams;

		const call = await loadAccessibleConference(callId, this.userId);
		if (!call) {
			return API.v1.notFound();
		}

		// Membership authorizes joining the call and nothing else — it puts nobody in a room.
		const added = await VideoConf.addMembers(this.userId, callId, users, {
			// Not ringing unless asked: adding someone to a call in progress is often to have them join when
			// they can, and an unrequested ring is an interruption nobody chose.
			ring: (ring ?? false) && (await hasPermissionAsync(this.user, 'videoconf-ring-users')),
		});

		return API.v1.success({ added });
	},
);

API.v1.post(
	'video-conference.rename',
	{
		authRequired: true,
		body: isVideoConfRenameProps,
		rateLimiterOptions: { numRequestsAllowed: 10, intervalTimeInMS: 60000 },
		response: {
			200: cancelResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			404: validateNotFoundErrorResponse,
		},
	},
	async function action() {
		const { callId, title } = this.bodyParams;

		const call = await loadAccessibleConference(callId, this.userId);
		if (!call) {
			return API.v1.notFound();
		}

		// Whether this particular user may *name* the call is the service's to decide — access only settles
		// whether they may be here at all. Its refusal travels as `error-not-allowed`, the same way every other
		// endpoint in the API lets one travel, so there is nothing here to translate.
		await VideoConf.renameCall(this.userId, callId, title);

		return API.v1.success();
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
			404: validateNotFoundErrorResponse,
		},
	},
	async function action() {
		const { callId, mode } = this.bodyParams;

		const call = await loadAccessibleConference(callId, this.userId);
		if (!call) {
			return API.v1.notFound();
		}

		return API.v1.success({ rid: await VideoConf.shareChatWithMembers(this.userId, callId, mode) });
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

		const call = await loadAccessibleConference(callId, this.userId);
		// TODO: 404, once a published endpoint may change status — see `loadAccessibleConference`.
		if (!call) {
			return API.v1.failure('invalid-params');
		}

		// Membership grants no room access, so some members may not be able to read the chat. The conference UI
		// surfaces them and offers the remedy, which is why this ships with the conference rather than needing
		// its own round trip.
		const [capabilities, chatAccess] = await Promise.all([
			VideoConf.listProviderCapabilities(call.providerName),
			VideoConf.getChatAccess(this.userId, callId),
		]);

		return API.v1.success({
			...(call as VideoConference),
			capabilities,
			chatAccess,
		});
	},
);

API.v1.get(
	'video-conference.joinable',
	{
		authRequired: true,
		// Discovery is event-driven: a per-user `video-conference` event — a ring, an arrival, a call ending —
		// is what sends a client back here. The poll behind it is a fallback for what an event cannot cover,
		// a missed message or a reconnection, so this has to tolerate a steady trickle as well as bursts.
		rateLimiterOptions: { numRequestsAllowed: 30, intervalTimeInMS: 60000 },
		response: {
			200: joinableResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		return API.v1.success({ calls: await VideoConf.listJoinableCalls(this.userId) });
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

		// TODO: 404, once a published endpoint may change status — see `loadAccessibleConference`.
		if (!(await canAccessRoomIdAsync(roomId, userId))) {
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
