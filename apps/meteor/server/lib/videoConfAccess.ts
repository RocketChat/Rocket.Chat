import type { VideoConference } from '@rocket.chat/core-typings';

import { canAccessRoomIdAsync } from './authorization/canAccessRoom';

/**
 * Whether someone is allowed near a conference at all — the one rule, for every endpoint that answers about one.
 *
 * Being in the call and being able to read its chat are separate things, so this accepts either: membership of
 * the conference, or access to a room the conference lives in.
 *
 * Membership covers people added from outside the room — they were added to the *call*, not to a room, so there
 * is no subscription to check. This is the case that makes the distinction load-bearing rather than theoretical:
 * a conference started in a DM and joined by a third person gives that person no access to the DM, by design, and
 * checking the room instead of the membership refuses them their own call. The room checks cover everyone who can
 * already see the conversation: `rid` is the room the call started in, and `discussionRid` the discussion its
 * chat may have moved to, whose members may have no access to the parent room.
 *
 * It lives here rather than beside one set of endpoints because more than one set needs it, and two versions of
 * "may this person be here" drift into two different answers for the same person.
 */
export const canAccessConference = async (
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
