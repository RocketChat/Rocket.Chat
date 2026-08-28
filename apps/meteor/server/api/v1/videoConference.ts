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
 * Both failures are answered the same way — `invalid-params`, deliberately vague about which of the two it was,
 * so a stranger can't use the endpoint to learn that a call id is real. Returning the caller's id alongside the
 * call is what lets the handlers use it without re-checking that they are signed in.
 */
const loadAccessibleConference = async (
	callId: VideoConference['_id'],
	userId: string | undefined,
): Promise<{ call: Omit<VideoConference, 'providerData'>; userId: string } | undefined> => {
	if (!userId) {
		return undefined;
	}

	const call = await VideoConf.get(callId);
	if (!call || !(await canAccessConference(call, userId))) {
		return undefined;
	}

	return { call, userId };
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

		// Embedded providers (LiveKit) intentionally return an empty url —
		// they're rendered inline rather than opened as an external popup.
		// Include rid so the client can route the join into its embedded
		// provider context without an extra round-trip to look it up.
		// For every other provider the url is the whole point of joining,
		// so coming back without one is a failure.
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
		body: isVideoConfCallIdProps,
		rateLimiterOptions: { numRequestsAllowed: 10, intervalTimeInMS: 60000 },
		response: {
			200: cancelResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { callId } = this.bodyParams;

		const conference = await loadAccessibleConference(callId, this.userId);
		if (!conference) {
			return API.v1.failure('invalid-params');
		}

		// Records the decline against the caller's own membership only. Declining is deliberately not a way to
		// end someone else's conference, so this takes no target user and never touches the call's status.
		await VideoConf.declineCall(conference.userId, callId);

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
		},
	},
	async function action() {
		const { callId } = this.bodyParams;

		const conference = await loadAccessibleConference(callId, this.userId);
		if (!conference) {
			return API.v1.failure('invalid-params');
		}

		// Only ever marks the caller as gone. The conference ends as a consequence of nobody being left in it,
		// not because one participant asked for it — the same rule declining follows.
		await VideoConf.leaveCall(conference.userId, callId);

		return API.v1.success();
	},
);

/**
 * Renews the caller's presence lease on a call — the conference window saying it is still in it.
 *
 * The counterpart of `video-conference.leave`, and the reason a lost leave is survivable: leaving is inferred from
 * renewals stopping, so nothing has to reach us at the moment someone goes. Provider-agnostic, because the window
 * doing the renewing is ours whatever runs the media.
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
		},
	},
	async function action() {
		const { callId } = this.bodyParams;

		const conference = await loadAccessibleConference(callId, this.userId);
		if (!conference) {
			return API.v1.failure('invalid-params');
		}

		await VideoConf.renewPresence(conference.userId, callId);

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
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { callId, userId } = this.bodyParams;

		// The same permission `video-conference.start` demands before ringing anyone — having access to a
		// conference must not be a way around it.
		if (!(await hasPermissionAsync(this.userId, 'videoconf-ring-users'))) {
			return API.v1.forbidden('Not allowed');
		}

		const conference = await loadAccessibleConference(callId, this.userId);
		if (!conference) {
			return API.v1.failure('invalid-params');
		}

		const rang = await VideoConf.ringMember(conference.userId, callId, userId);

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
		const { callId, users, ring } = this.bodyParams;

		const conference = await loadAccessibleConference(callId, this.userId);
		if (!conference) {
			return API.v1.failure('invalid-params');
		}

		// Registers the users as conference members — it deliberately does not put them in any room. Being a
		// member authorizes joining the call; whether they can read the chat is surfaced separately.
		// Adding is open to anyone with access to the conference; the ring that usually accompanies it needs the
		// same permission `video-conference.start` demands, and degrades silently without it — same as `start`.
		const added = await VideoConf.addMembers(conference.userId, callId, users, {
			// Not ringing unless asked: adding someone to a call in progress is often to have them join when
			// they can, and an unrequested ring is an interruption nobody chose.
			ring: (ring ?? false) && (await hasPermissionAsync(this.userId, 'videoconf-ring-users')),
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
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { callId, title } = this.bodyParams;

		const conference = await loadAccessibleConference(callId, this.userId);
		if (!conference) {
			return API.v1.failure('invalid-params');
		}

		// Whether this particular user may *name* the call is the service's call to make — access is only the
		// question of whether they may be here at all. Its refusal is an authorization answer, not a failure,
		// so it maps to 403 rather than surfacing as an internal error.
		try {
			await VideoConf.renameCall(conference.userId, callId, title);
		} catch (e) {
			if (e instanceof Error && e.message === 'error-not-allowed') {
				return API.v1.forbidden('Not allowed');
			}
			throw e;
		}

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
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { callId, mode } = this.bodyParams;

		const conference = await loadAccessibleConference(callId, this.userId);
		if (!conference) {
			return API.v1.failure('invalid-params');
		}

		// The service refuses a mode the room can't do, and discussion creation the caller isn't permitted —
		// authorization answers, not failures, so they map to 403 rather than surfacing as internal errors.
		try {
			return API.v1.success({ rid: await VideoConf.shareChatWithMembers(conference.userId, callId, mode) });
		} catch (e) {
			if (e instanceof Error && e.message === 'error-not-allowed') {
				return API.v1.forbidden('Not allowed');
			}
			throw e;
		}
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

		const conference = await loadAccessibleConference(callId, this.userId);
		if (!conference) {
			return API.v1.failure('invalid-params');
		}

		const { call, userId } = conference;

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
	'video-conference.joinable',
	{
		authRequired: true,
		// Polled by the sidebar, so it has to tolerate a steady trickle.
		rateLimiterOptions: { numRequestsAllowed: 30, intervalTimeInMS: 60000 },
		response: {
			200: joinableResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { userId } = this;
		if (!userId) {
			return API.v1.failure('invalid-params');
		}

		return API.v1.success({ calls: await VideoConf.listJoinableCalls(userId) });
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
