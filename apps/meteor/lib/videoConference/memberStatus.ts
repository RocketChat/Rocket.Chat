import type { IVideoConferenceUser } from '@rocket.chat/core-typings';
import { hasJoinedVideoConference, isInVideoConference, isRingingVideoConferenceMember } from '@rocket.chat/core-typings';

type MemberState = Pick<IVideoConferenceUser, 'joined' | 'declined' | 'declinedAt' | 'leftAt' | 'ringingAt'>;

/** A member worth ringing is one who is neither in the call already nor hearing a phone right now. */
export const canRingConferenceMember = (member: MemberState, now?: number): boolean =>
	!isInVideoConference(member) && !isRingingVideoConferenceMember(member, now);

/** Whether this member has never been asked to answer at all — never rung, never in the call, never declined. */
export const isUnaskedConferenceMember = (member: Pick<IVideoConferenceUser, 'joined' | 'declined' | 'ringingAt'>): boolean =>
	!member.ringingAt && !hasJoinedVideoConference(member) && !member.declined;
