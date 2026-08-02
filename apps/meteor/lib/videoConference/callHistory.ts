import type {
	IDirectVideoConference,
	IGroupVideoConference,
	IVideoConferenceHistoryItem,
	IVideoConferenceUser,
	VideoConference,
} from '@rocket.chat/core-typings';
import { hasJoinedVideoConference, isInVideoConference } from '@rocket.chat/core-typings';
import type { InsertionModel } from '@rocket.chat/model-typings';

/** A conference that belongs in a call log: someone called someone, whether one-to-one or as a group. */
export type LoggableVideoConference = IDirectVideoConference | IGroupVideoConference;

/**
 * Whether a conference that just stopped should leave call-history items.
 *
 * Both ways a conference stops lead here — it was ended, or it was expired by the cron for having run past its
 * TTL — because from a member's point of view both are a call that happened. Expiry is not an edge case: a
 * provider that never reports the end back (the bundled Jitsi app, for one) leaves *every* conference to be
 * expired, so writing history only on end writes it almost never.
 *
 * Each path is reachable more than once for the same call — an app can send `ENDED` repeatedly, and the cron
 * runs every three hours — so this must be given the call as it was read *before* `endedAt` was set, and
 * refuses once it is set. Otherwise every member collects a duplicate entry per attempt.
 *
 * Livechat and VoIP conferences are out of scope. A livechat call belongs to a visitor rather than to a user's
 * own call log, and VoIP conferences are already logged as media calls — logging them here would double them up.
 */
export const shouldWriteConferenceHistory = (call: VideoConference): call is LoggableVideoConference =>
	(call.type === 'direct' || call.type === 'videoconference') && !call.endedAt;

/**
 * Whether anyone is still in the call. Used to decide that a conference is over: membership doesn't end when
 * someone leaves, so the only way to tell is that nobody who joined is still there.
 */
export const hasActiveParticipants = (users: Pick<IVideoConferenceUser, 'joined' | 'leftAt'>[]): boolean => users.some(isInVideoConference);

/**
 * Builds one call-history item per conference member, so ending a group conference leaves a record in every
 * member's personal call history. Only members with an entry in `users[]` get one — someone rung as a room
 * subscriber who never joined, was never added, and never declined has no membership entry to build from.
 */
export const buildConferenceCallHistoryItems = (
	call: Pick<LoggableVideoConference, '_id' | 'rid' | 'createdAt' | 'createdBy' | 'users'> & { title?: string },
): InsertionModel<IVideoConferenceHistoryItem>[] => {
	const usersCount = call.users.filter(hasJoinedVideoConference).length;

	return call.users.map((member) => ({
		uid: member._id,
		ts: call.createdAt,
		callId: call._id,
		type: 'video-conference',
		rid: call.rid,
		...(call.title && { title: call.title }),
		usersCount,
		direction: member._id === call.createdBy._id ? 'outbound' : 'inbound',
		// Only members appear here, and a member either joined or was rung and didn't — someone who was never
		// rung has no entry at all. So not having joined *is* not having answered, whether they declined
		// explicitly or just ignored it; showing that as a normal ended call would hide a missed conference.
		state: hasJoinedVideoConference(member) ? 'ended' : 'not-answered',
	}));
};
