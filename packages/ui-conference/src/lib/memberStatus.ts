import type { IVideoConferenceUser } from '@rocket.chat/core-typings';
import { isInVideoConference } from '@rocket.chat/core-typings';

/**
 * `unanswered` is a member who was rung and did nothing. `invited` is one nobody has asked anything yet — which,
 * for a provider that reports presence, is also someone who has joined and is still connecting.
 */
export type ConferenceMemberStatus = 'joined' | 'left' | 'declined' | 'unanswered' | 'invited';

type MemberState = Pick<IVideoConferenceUser, 'joined' | 'declined' | 'declinedAt' | 'leftAt' | 'ringingAt'>;

/**
 * Reduces a membership entry to the one status worth showing. An entry accumulates rather than replaces, so the
 * fields are read in the order of what happened last.
 */
export const getConferenceMemberStatus = (member: MemberState): ConferenceMemberStatus => {
	if (isInVideoConference(member)) {
		return 'joined';
	}

	if (member.leftAt) {
		return 'left';
	}

	if (member.declined) {
		return 'declined';
	}

	return member.ringingAt ? 'unanswered' : 'invited';
};
