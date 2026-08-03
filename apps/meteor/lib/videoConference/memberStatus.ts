import type { IVideoConferenceUser } from '@rocket.chat/core-typings';
import { isInVideoConference, isRingingVideoConferenceMember } from '@rocket.chat/core-typings';

/** Where a member stands with the call, as one thing the UI can label them with. */
export type ConferenceMemberStatus = 'joined' | 'left' | 'declined' | 'invited';

type MemberState = Pick<IVideoConferenceUser, 'joined' | 'declined' | 'declinedAt' | 'leftAt' | 'ringingAt'>;

/**
 * Reduces a membership entry to the one thing worth showing.
 *
 * The entry accumulates rather than replaces — `joined` never goes back to false, and a decline stays recorded
 * after the person changes their mind — so the fields have to be read in order of what happened *last*. Being
 * in the call beats everything; having left beats an earlier decline, since they did answer; a decline beats
 * simply having been invited.
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

/**
 * Whether it makes sense to ring this member *now*. Not while their phone is already ringing — there is nothing
 * to ask for — and not while they are in the call. Once they have declined, ignored it or left, ringing them
 * back is exactly the point.
 */
export const canRingConferenceMember = (member: MemberState, now?: number): boolean =>
	getConferenceMemberStatus(member) !== 'joined' && !isRingingVideoConferenceMember(member, now);
