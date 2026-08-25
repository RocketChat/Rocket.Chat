import type { IUser, IVideoConferenceUser, VideoConferenceLeaveReason } from '@rocket.chat/core-typings';
import { isInVideoConference } from '@rocket.chat/core-typings';

/**
 * Presence in a call as a lease the call window keeps renewing, rather than a departure it promises to report.
 *
 * A report is the fast, accurate path and it usually works — but it can only be sent by a live client to a live
 * server, and neither is guaranteed. The case that started this: the workspace goes down while the call carries
 * on in the provider (LiveKit, Pexip and friends are separate services), people leave during the outage, and
 * their leave never reaches anyone. The same hole swallows a crashed tab, a killed browser, a dead battery and a
 * `keepalive` fetch that didn't make it. What all of those have in common is that *renewals stop*, which is the
 * signal this infers a departure from.
 *
 * Deliberately provider-agnostic: the renewal comes from our own conference window, which exists whoever runs the
 * media — an iframe provider renders inside our page, so our code is alive there too. Where a provider *can* be
 * asked who is in the room, its answer renews leases as well (see `videoConfPresence`), which keeps someone in
 * the call whose browser has throttled their heartbeat. Nothing here requires that integration to exist.
 */

/**
 * How often a call window renews its lease.
 *
 * Well under the lease it renews, because a hidden tab — a call you are listening to while working in another
 * window — has its timers throttled to roughly one a minute by every current browser.
 */
export const PRESENCE_HEARTBEAT_MS = 30_000;

/**
 * How long one renewal is good for.
 *
 * Long enough to survive throttling (two missed ticks at a browser's throttled rate) and a brief network drop,
 * short enough that a ghost in the members list is a curiosity rather than a lie. It doubles as the grace period
 * a departing member gets before their absence is written, which is why this is also what a restart waits out.
 */
export const PRESENCE_LEASE_MS = 180_000;

/** The reasons a departure was inferred rather than reported, so a renewal can undo them and a report cannot. */
export const INFERRED_LEAVE_REASONS: VideoConferenceLeaveReason[] = ['timeout'];

/** A member whose lease has run out, and the last moment we know they were still in the call. */
export type ExpiredPresenceLease = { uid: IUser['_id']; leftAt: Date };

/**
 * The last moment there was evidence this member was in the call. Members who joined before leases existed have
 * no renewal to read, so their join stands as the last thing we know — and failing even that, their membership.
 */
const lastEvidence = (user: IVideoConferenceUser): Date => user.lastSeenAt ?? user.joinedAt ?? user.ts;

/**
 * Which members are to be treated as gone, and when they left.
 *
 * `leftAt` is the last evidence rather than the moment of the sweep, which is the whole point of keeping a
 * watermark: stamping "now" on a call recovered after a 20-minute outage would add 20 minutes to everyone's call
 * history. The honest answer is "we last saw you before the lights went out", and that is what this returns.
 */
export const expiredPresenceLeases = (users: IVideoConferenceUser[], now: Date, leaseMs = PRESENCE_LEASE_MS): ExpiredPresenceLease[] =>
	users
		.filter((user) => isInVideoConference(user))
		.map((user) => ({ uid: user._id, leftAt: lastEvidence(user) }))
		.filter(({ leftAt }) => now.getTime() - leftAt.getTime() >= leaseMs);

/**
 * Whether leases may be acted on yet, given how long this process has been up.
 *
 * The guard that makes leases correct across a restart. From the database, "everyone left" and "we were not here
 * to be told" are the same picture: every lease is expired either way. So a freshly started process waits out a
 * full lease before evicting anyone — whoever is still in the call renews within it (their window heartbeats
 * every `PRESENCE_HEARTBEAT_MS`, throttled to a minute at worst), and whoever is genuinely gone is still gone
 * afterwards, with the departure timestamp they had all along.
 *
 * In a multi-instance workspace this costs nothing: the instances that stayed up were never absent and keep
 * sweeping throughout.
 */
export const isPresenceSweepDue = (uptimeMs: number, leaseMs = PRESENCE_LEASE_MS): boolean => uptimeMs >= leaseMs;
