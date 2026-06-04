import { VideoConferenceStatus } from '@rocket.chat/core-typings';
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

// Broadcast on the `notify-room` streamer so any client subscribed to the
// room hears about call create/end and refreshes its banner state. Replaces
// the previous 5s polling. The event name is not in the typed StreamerEvents
// union, so we cast — `notify-room` allows any event for users with access
// to the room.
const broadcastVideoConferenceState = (rid: string, payload: { action: 'started' | 'ended'; callId: string }) => {
	try {
		(notifications.notifyRoom as any)(rid, 'video-conference-state', payload);
	} catch {
		/* notify is best-effort */
	}
};

const looseSuccessSchema = ajv.compile<Record<string, unknown>>({ type: 'object', additionalProperties: true });
const looseSuccessResponse = {
	200: looseSuccessSchema,
	400: validateBadRequestErrorResponse,
	401: validateUnauthorizedErrorResponse,
	403: validateForbiddenErrorResponse,
};

/**
 * Starts a new LiveKit group call in a room. Idempotent: if there's already
 * an active LiveKit call in this room, returns it instead of creating a new
 * one. The starter is automatically added as the first participant.
 */
API.v1.post(
	'video-conference.livekit.start',
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
		if (!settings.get<boolean>('VideoConf_LiveKit_Enabled')) {
			return API.v1.failure('group-calls-require-livekit');
		}

		// Idempotent: piggy-back on an existing active call if one's there.
		const existing = await VideoConferenceModel.findActiveEmbeddedInRoom(roomId, 'livekit');
		if (existing) {
			return API.v1.success({ call: existing, alreadyActive: true });
		}

		const { user } = this;
		const createdBy = {
			_id: userId,
			name: user?.name || user?.username || userId,
			username: user?.username || userId,
		};

		const callId = await VideoConferenceModel.createGroup({
			rid: roomId,
			title: room.name || '',
			createdBy,
			providerName: 'livekit',
		} as any);

		// LK-specific transport details live under providerData.livekit.
		const roomName = `mc-${callId}`;
		await VideoConferenceModel.setProviderDataById(callId, { livekit: { roomName } });

		// Seed the participants list with the creator so the call is non-empty.
		await VideoConferenceModel.addEmbeddedParticipant(callId, {
			id: userId,
			displayName: user?.name,
			username: user?.username,
			joinedAt: new Date(),
		});

		const call = await VideoConferenceModel.findOneById(callId);
		broadcastVideoConferenceState(roomId, { action: 'started', callId });

		return API.v1.success({ call, alreadyActive: false });
	},
);

/**
 * Join an active LiveKit group call. Adds the user to participants[] and
 * returns the full call doc. If the user already left and rejoins, their
 * leftAt is cleared.
 */
API.v1.post(
	'video-conference.livekit.join',
	{
		authRequired: true,
		rateLimiterOptions: { numRequestsAllowed: 10, intervalTimeInMS: 60000 },
		response: looseSuccessResponse,
	},
	async function action() {
		const { callId } = this.bodyParams as { callId?: string };
		if (!callId) return API.v1.failure('invalid-params');

		const { userId } = this;
		const call = await VideoConferenceModel.findOneById(callId);
		if (!call || call.providerName !== 'livekit') return API.v1.failure('invalid-call');
		if (call.endedAt) return API.v1.failure('invalid-call');
		if (!call.rid) return API.v1.failure('invalid-call');

		// Permission: must have room access.
		const room = await Rooms.findOneById(call.rid);
		if (!room || !(await canAccessRoomAsync(room, { _id: userId }))) {
			return API.v1.forbidden();
		}

		const { user } = this;
		await VideoConferenceModel.addEmbeddedParticipant(callId, {
			id: userId,
			displayName: user?.name,
			username: user?.username,
			joinedAt: new Date(),
		});

		const updated = await VideoConferenceModel.findOneById(callId);
		return API.v1.success({ call: updated });
	},
);

/**
 * Returns the active LiveKit group call in a room (if any) so the
 * channel-header banner can render "Active call — Join". Polled by the room
 * view; ideally we'd push state via a stream, but polling is fine for the
 * MVP.
 */
API.v1.get(
	'video-conference.livekit.activeInRoom',
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

		const call = await VideoConferenceModel.findActiveEmbeddedInRoom(roomId, 'livekit');
		return API.v1.success({ call: call ?? null });
	},
);

/**
 * Mark the current user as having left an active LiveKit group call. The
 * call itself stays open until the last participant leaves or it expires.
 */
API.v1.post(
	'video-conference.livekit.leave',
	{
		authRequired: true,
		rateLimiterOptions: { numRequestsAllowed: 10, intervalTimeInMS: 60000 },
		response: looseSuccessResponse,
	},
	async function action() {
		const { callId } = this.bodyParams as { callId?: string };
		if (!callId) return API.v1.failure('invalid-params');

		const { userId } = this;
		const call = await VideoConferenceModel.findOneById(callId);
		if (!call || call.providerName !== 'livekit') return API.v1.failure('invalid-call');

		await VideoConferenceModel.markEmbeddedParticipantLeft(callId, userId);

		// If every participant has leftAt set, end the call.
		const updated = await VideoConferenceModel.findOneById(callId);
		const stillIn = (updated?.participants ?? []).filter((p) => !p.leftAt);
		if (stillIn.length === 0) {
			await VideoConferenceModel.setEndedById(callId, undefined, new Date());
			await VideoConferenceModel.setStatusById(callId, VideoConferenceStatus.ENDED);
			if (updated?.rid) broadcastVideoConferenceState(updated.rid, { action: 'ended', callId });
			// Fire summary generation. Idempotent and self-gated on the
			// `VideoConf_LiveKit_Summary_Enabled` setting + presence
			// of transcript entries, so it no-ops when not configured.
			const { maybeGenerateSummary } = await import('../lib/livekit-agent/summary');
			void maybeGenerateSummary(callId).catch(() => undefined);
		}

		return API.v1.success({});
	},
);
