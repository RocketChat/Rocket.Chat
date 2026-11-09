import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IUser } from './IUser';

/**
 * A conference somebody booked ahead of time, as it was asked for.
 *
 * It is never consumed: every conference started from it is built from the same record, and its alias stays
 * reserved for it, so the same link and number keep reaching a fresh conference after the last one ended.
 */
export interface IScheduledConference extends IRocketChatRecord {
	/** The user the requester's email address resolved to, who is made the creator — and so the host — of every conference. */
	uid: IUser['_id'];
	requesterEmail: string;
	/** As received: matched to users each time a conference starts, so people who join the workspace later count. */
	inviteeEmails: string[];
	title?: string;
	sipAlias?: string;
	createdAt: Date;
}

export type ConferenceSchedulingOptions = {
	canSchedule: boolean;
	canUseSipAlias: boolean;
};

export type ConferenceScheduleRequest = {
	invitees: string[];
	sipAlias: boolean;
	title?: string;
};

export type ScheduledConferenceInvitation = {
	url: string;
	sipAlias?: string;
};
