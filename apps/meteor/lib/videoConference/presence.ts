import type { IUser, IVideoConferenceUser, VideoConferenceLeaveReason } from '@rocket.chat/core-typings';
import { isInVideoConference } from '@rocket.chat/core-typings';

/** Browser constraint: a hidden tab has its timers throttled to roughly one tick a minute. */
export const PRESENCE_THROTTLED_HEARTBEAT_MS = 60_000;

export const PRESENCE_MISSED_TICKS_TOLERATED = 3;

export const PRESENCE_HEARTBEAT_MS = 30_000;

/** Doubles as the grace period a restart waits out before believing any lease. */
export const PRESENCE_LEASE_MS = PRESENCE_THROTTLED_HEARTBEAT_MS * PRESENCE_MISSED_TICKS_TOLERATED;

/** Leave reasons a renewal may undo. A reported departure is never revived. */
export const INFERRED_LEAVE_REASONS: VideoConferenceLeaveReason[] = ['timeout'];

/** A member whose lease has run out, and the last moment they were known to be in the call. */
export type ExpiredPresenceLease = { uid: IUser['_id']; leftAt: Date };

/** Members who joined before leases existed have no `lastSeenAt`, so their join is the last evidence there is. */
const lastEvidence = (user: IVideoConferenceUser): Date => user.lastSeenAt ?? user.joinedAt ?? user.ts;

/**
 * The members whose lease has run out, each with the moment they left.
 *
 * `leftAt` is the last evidence, never the moment of the sweep: stamping "now" on a call recovered after an
 * outage would add the whole outage to everyone's call history.
 */
export const expiredPresenceLeases = (users: IVideoConferenceUser[], now: Date, leaseMs = PRESENCE_LEASE_MS): ExpiredPresenceLease[] =>
	users
		.filter((user) => isInVideoConference(user))
		.map((user) => ({ uid: user._id, leftAt: lastEvidence(user) }))
		.filter(({ leftAt }) => now.getTime() - leftAt.getTime() >= leaseMs);

/**
 * Whether this process has been up long enough for its leases to mean anything.
 *
 * A fresh process cannot tell "everyone left" from "we were not here to be told" — every lease reads as expired
 * either way — so one full lease has to pass before an eviction is believed.
 */
export const isPresenceSweepDue = (uptimeMs: number, leaseMs = PRESENCE_LEASE_MS): boolean => uptimeMs >= leaseMs;
