import { randomUUID } from 'crypto';

import { MediaCalls as MediaCallsModel, Rooms } from '@rocket.chat/models';
import {
	ajv,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';

import { API } from '../../../app/api/server/api';
import { canAccessRoomAsync } from '../../../app/authorization/server/functions/canAccessRoom';
import { settings } from '../../../app/settings/server';

const looseSuccessSchema = ajv.compile<Record<string, unknown>>({ type: 'object', additionalProperties: true });
const looseSuccessResponse = {
	200: looseSuccessSchema,
	400: validateBadRequestErrorResponse,
	401: validateUnauthorizedErrorResponse,
	403: validateForbiddenErrorResponse,
};

/**
 * Starts a new group call in a room. Idempotent: if there's already an active
 * group call in this room, returns it instead of creating a new one. The
 * starter is automatically added as the first participant. Other room members
 * discover the active call via the activeInRoom polling endpoint.
 */
API.v1.post(
	'media-calls.startGroup',
	{
		authRequired: true,
		rateLimiterOptions: { numRequestsAllowed: 5, intervalTimeInMS: 60000 },
		response: looseSuccessResponse,
	},
	async function action() {
		const { roomId } = this.bodyParams as { roomId?: string };
		if (!roomId) return API.v1.failure('invalid-params');

		const { userId } = this;
		const room = await Rooms.findOneById(roomId);
		if (!room) return API.v1.failure('invalid-room');

		// Permission: any channel member who can access the room can start a call.
		if (!(await canAccessRoomAsync(room, { _id: userId }))) {
			return API.v1.forbidden();
		}

		// Group calls require an SFU (LiveKit). The P2P-mesh path is a future
		// enhancement; for now, group only works when LK is configured.
		if (!settings.get<boolean>('VoIP_TeamCollab_LiveKit_Enabled')) {
			return API.v1.failure('group-calls-require-livekit');
		}

		// Idempotent: piggy-back on an existing active call if one's there.
		const existing = await MediaCallsModel.findActiveGroupCallInRoom(roomId);
		if (existing) {
			return API.v1.success({ call: existing, alreadyActive: true });
		}

		const { user } = this;
		const createdBy = {
			type: 'user' as const,
			id: userId,
			displayName: user?.name,
			username: user?.username,
		};
		// Group calls don't really have a caller/callee distinction. We populate
		// both with the creator as a placeholder so the existing signals/agents
		// code that reads call.caller/call.callee keeps working. The real
		// participant list lives in `participants`.
		const creatorAsSignedContact = { ...createdBy, contractId: 'group-call-placeholder' };

		const now = new Date();
		const callId = randomUUID();
		const doc = {
			_id: callId,
			service: 'livekit' as const,
			kind: 'group' as const,
			state: 'active' as const,
			createdBy,
			createdAt: now,
			caller: creatorAsSignedContact,
			callee: createdBy,
			rid: roomId,
			participants: [{ ...createdBy, joinedAt: now }],
			uids: [userId],
			ended: false,
			expiresAt: new Date(now.getTime() + 8 * 60 * 60 * 1000), // 8h max-life cap
			features: ['audio', 'video', 'screen-share'],
		};

		await MediaCallsModel.insertOne(doc as any);

		return API.v1.success({ call: doc, alreadyActive: false });
	},
);

/**
 * Join an active group call. Adds the user to participants[] and returns the
 * full call doc. If the user already left and rejoins, their leftAt is cleared.
 */
API.v1.post(
	'media-calls.joinGroup',
	{
		authRequired: true,
		rateLimiterOptions: { numRequestsAllowed: 10, intervalTimeInMS: 60000 },
		response: looseSuccessResponse,
	},
	async function action() {
		const { callId } = this.bodyParams as { callId?: string };
		if (!callId) return API.v1.failure('invalid-params');

		const { userId } = this;
		const call = await MediaCallsModel.findOneById(callId);
		if (call?.kind !== 'group' || call.ended) return API.v1.failure('invalid-call');
		if (!call.rid) return API.v1.failure('invalid-call');

		// Permission: must have room access.
		const room = await Rooms.findOneById(call.rid);
		if (!room || !(await canAccessRoomAsync(room, { _id: userId }))) {
			return API.v1.forbidden();
		}

		const { user } = this;
		await MediaCallsModel.addGroupParticipant(callId, {
			type: 'user',
			id: userId,
			displayName: user?.name,
			username: user?.username,
		});

		const updated = await MediaCallsModel.findOneById(callId);
		return API.v1.success({ call: updated });
	},
);

/**
 * Returns the active group call in a room (if any) so the channel-header
 * banner can render "Active call — Join". Polled by the room view; ideally
 * we'd push state via a stream, but polling is fine for the MVP.
 */
API.v1.get(
	'media-calls.activeInRoom',
	{
		authRequired: true,
		rateLimiterOptions: { numRequestsAllowed: 30, intervalTimeInMS: 60000 },
		response: looseSuccessResponse,
	},
	async function action() {
		const { roomId } = this.queryParams as { roomId?: string };
		if (!roomId) return API.v1.failure('invalid-params');

		const { userId } = this;
		const room = await Rooms.findOneById(roomId);
		if (!room || !(await canAccessRoomAsync(room, { _id: userId }))) {
			return API.v1.forbidden();
		}

		const call = await MediaCallsModel.findActiveGroupCallInRoom(roomId);
		return API.v1.success({ call: call ?? null });
	},
);

/**
 * Mark the current user as having left an active group call. The call itself
 * stays open until the last participant leaves or it expires.
 */
API.v1.post(
	'media-calls.leaveGroup',
	{
		authRequired: true,
		rateLimiterOptions: { numRequestsAllowed: 10, intervalTimeInMS: 60000 },
		response: looseSuccessResponse,
	},
	async function action() {
		const { callId } = this.bodyParams as { callId?: string };
		if (!callId) return API.v1.failure('invalid-params');

		const { userId } = this;
		const call = await MediaCallsModel.findOneById(callId);
		if (call?.kind !== 'group') return API.v1.failure('invalid-call');

		await MediaCallsModel.markGroupParticipantLeft(callId, userId);

		// If every participant has leftAt set, end the call.
		const updated = await MediaCallsModel.findOneById(callId);
		const stillIn = (updated?.participants ?? []).filter((p: any) => !p.leftAt);
		if (stillIn.length === 0) {
			await MediaCallsModel.hangupCallById(callId, { reason: 'all-participants-left' });
		}

		return API.v1.success({});
	},
);
