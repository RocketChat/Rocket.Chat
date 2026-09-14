import type { IVideoConferenceUser } from '@rocket.chat/core-typings';
import { hasJoinedVideoConference, isInVideoConference, isRingingVideoConferenceMember } from '@rocket.chat/core-typings';

/** Where a member stands with the call, as one thing the UI can label them with. */
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

/** Whether ringing this member now would ask them anything they are not already being asked. */
export const canRingConferenceMember = (member: MemberState, now?: number): boolean =>
	getConferenceMemberStatus(member) !== 'joined' && !isRingingVideoConferenceMember(member, now);

/** Whether this member has never been asked to answer at all — never rung, never in the call, never declined. */
export const isUnaskedConferenceMember = (member: Pick<IVideoConferenceUser, 'joined' | 'declined' | 'ringingAt'>): boolean =>
	!member.ringingAt && !hasJoinedVideoConference(member) && !member.declined;
