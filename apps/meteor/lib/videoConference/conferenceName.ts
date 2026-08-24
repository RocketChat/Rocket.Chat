import type { IRoom, IUser, IVideoConferenceUser, VideoConference } from '@rocket.chat/core-typings';

type NameableConference = {
	type: VideoConference['type'];
	title?: string;
	createdBy: Pick<IUser, '_id'> & Partial<Pick<IUser, 'name' | 'username'>>;
	users: (Pick<IVideoConferenceUser, '_id'> & Partial<Pick<IVideoConferenceUser, 'name' | 'username'>>)[];
};

const displayName = (person?: Partial<Pick<IUser, 'name' | 'username'>>): string => person?.name || person?.username || '';

/**
 * Who a direct call is *with*, from this viewer's side. Whoever started it, unless that is the viewer themselves,
 * in which case it is whoever else is on the call.
 *
 * The creator rather than "the other member" because a direct call can hold more than two people: someone added
 * to a call in a DM has two others to choose from, and the one who matters to them is the one who brought them in.
 */
const otherParty = (call: NameableConference, viewerId: IUser['_id'] | undefined) =>
	call.createdBy._id !== viewerId ? call.createdBy : call.users.find(({ _id }) => _id !== viewerId);

/**
 * What to call a conference, for the person looking at it. Returns `''` when only the room can answer, leaving
 * that to the caller — which is also what keeps the room lookup off the path that doesn't need it.
 *
 * A direct call has no name of its own, so it is named after a person. Ordinarily that name comes from the
 * viewer's own subscription, since a DM is named per side and the name lives there rather than on the room. But
 * conference membership grants no room access, so a member added from outside a DM has no subscription to read —
 * and the room can't help either: a DM room carries neither `name` nor `fname`, so falling back to it ended in
 * `getRoomName`'s last resort, the raw room id. That is what put a hash in front of the person who was invited.
 * Naming the call after whoever brought them in answers the question they actually have, which is who is calling.
 */
export const conferenceNameFor = (
	call: NameableConference,
	viewerId: IUser['_id'] | undefined,
	subscriptionName?: string,
	roomType?: IRoom['t'],
): string => {
	const isDM = call.type === 'direct' || roomType === 'd';

	// A group conference has a name of its own, and it wins — except in a DM, where the "title" is
	// `room.fname` from the creator's perspective and is wrong for every other viewer.  There the
	// per-viewer subscription name is the right answer.
	if (!isDM && call.type === 'videoconference' && call.title) {
		return call.title;
	}

	if (subscriptionName) {
		return subscriptionName;
	}

	return isDM ? displayName(otherParty(call, viewerId)) : '';
};
