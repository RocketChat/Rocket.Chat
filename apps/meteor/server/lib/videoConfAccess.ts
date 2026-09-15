import type { VideoConference } from '@rocket.chat/core-typings';

import { canAccessRoomIdAsync } from './authorization/canAccessRoom';

/**
 * Whether someone may be near a conference at all: the one rule every endpoint that answers about one applies.
 *
 * Membership of the call counts on its own, because someone added from outside the room has no subscription to
 * check. See [video conferences](../../../../docs/features/video-conference.md).
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
