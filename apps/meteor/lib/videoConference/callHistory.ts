import type { IGroupVideoConference, IVideoConferenceHistoryItem, VideoConference } from '@rocket.chat/core-typings';
import { hasJoinedVideoConference, isGroupVideoConference } from '@rocket.chat/core-typings';
import type { InsertionModel } from '@rocket.chat/model-typings';

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
 * Direct and livechat conferences are out of scope: they have no `title` and aren't the many-participants case
 * this covers.
 */
export const shouldWriteConferenceHistory = (call: VideoConference): call is IGroupVideoConference =>
	isGroupVideoConference(call) && !call.endedAt;

/**
 * Builds one call-history item per conference member, so ending a group conference leaves a record in every
 * member's personal call history. Only members with an entry in `users[]` get one — someone rung as a room
 * subscriber who never joined, was never added, and never declined has no membership entry to build from.
 */
export const buildConferenceCallHistoryItems = (
	call: Pick<IGroupVideoConference, '_id' | 'rid' | 'title' | 'createdAt' | 'createdBy' | 'users'>,
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
