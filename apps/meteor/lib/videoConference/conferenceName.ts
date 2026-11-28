import type { IRoom, IUser, IVideoConferenceUser, VideoConference } from '@rocket.chat/core-typings';

type NameableConference = {
	type: VideoConference['type'];
	title?: string;
	createdBy: Pick<IUser, '_id'> & Partial<Pick<IUser, 'name' | 'username'>>;
	users: (Pick<IVideoConferenceUser, '_id'> & Partial<Pick<IVideoConferenceUser, 'name' | 'username'>>)[];
};

const displayName = (person?: Partial<Pick<IUser, 'name' | 'username'>>): string => person?.name || person?.username || '';

/**
 * Who a direct call is with, from this viewer's side.
 *
 * The creator rather than "the other member", because a direct call can hold more than two people and the one
 * who matters to a newcomer is whoever brought them in.
 */
const otherParty = (call: NameableConference, viewerId: IUser['_id'] | undefined) =>
	call.createdBy._id !== viewerId ? call.createdBy : call.users.find(({ _id }) => _id !== viewerId);

/**
 * What to call a conference, for the person looking at it.
 *
 * Returns `''` when only the room can answer, leaving the lookup to the caller. See
 * [video conferences](../../../../docs/features/video-conference.md) for how a call gets its name.
 */
export const conferenceNameFor = (
	call: NameableConference,
	viewerId: IUser['_id'] | undefined,
	subscriptionName?: string,
	roomType?: IRoom['t'],
): string => {
	const isDM = call.type === 'direct' || roomType === 'd';

	// In a DM the title is `room.fname` as the creator sees it, which is wrong for every other viewer.
	if (!isDM && call.type === 'videoconference' && call.title) {
		return call.title;
	}

	if (subscriptionName) {
		return subscriptionName;
	}

	return isDM ? displayName(otherParty(call, viewerId)) : '';
};
