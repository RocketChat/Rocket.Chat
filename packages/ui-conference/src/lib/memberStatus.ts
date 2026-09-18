import type { IVideoConferenceUser } from '@rocket.chat/core-typings';
import { isInVideoConference } from '@rocket.chat/core-typings';

export type ConferenceMemberStatus = 'joined' | 'left' | 'declined' | 'invited';

type MemberState = Pick<IVideoConferenceUser, 'joined' | 'declined' | 'declinedAt' | 'leftAt' | 'ringingAt'>;

/**
 * Reduces a membership entry to the one status worth showing.
 *
 * A membership entry accumulates rather than replaces — `joined` never returns to false, a decline stays
 * recorded — so the fields are read in the order of what happened last.
 */
export const getConferenceMemberStatus = (member: MemberState): ConferenceMemberStatus => {
	if (isInVideoConference(member)) {
		return 'joined';
	}

	if (member.leftAt) {
		return 'left';
	}

	return member.declined ? 'declined' : 'invited';
};
