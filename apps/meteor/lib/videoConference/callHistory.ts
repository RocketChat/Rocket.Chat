import type { IGroupVideoConference, IVideoConferenceHistoryItem } from '@rocket.chat/core-typings';
import { hasJoinedVideoConference } from '@rocket.chat/core-typings';
import type { InsertionModel } from '@rocket.chat/model-typings';

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
