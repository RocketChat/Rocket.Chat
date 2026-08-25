import { VIDEO_CONF_RINGING_LIMIT } from '@rocket.chat/core-typings';

export const availabilityErrors = {
	NOT_CONFIGURED: 'video-conf-provider-not-configured',
	NOT_ACTIVE: 'no-active-video-conf-provider',
	NO_APP: 'no-videoconf-provider-app',
};

/**
 * How many of the people in a call are shown as faces in the sidebar list before the rest become a "+N".
 *
 * Shared with the server, which slices the joinable payload to it: sending more would be sending a roster nobody
 * draws. Two is what fits beside a call's name in a sidebar row without pushing it out — the rest are a count.
 */
export const CALL_FACES_SHOWN = 2;

/**
 * The same, on the preflight — a screen rather than a row, so it has room for more of them before the count takes
 * over. The people come from the call window's own copy of the members, so nothing has to travel for these.
 */
export const PREFLIGHT_FACES_SHOWN = 10;

/**
 * How long a conference is kept alive after the last participant leaves, before it is ended.
 * Long enough for a reload to land and cancel it, short enough that a call really over doesn't linger.
 */
export const EMPTY_CALL_GRACE_MS = 10_000;

/** Whether this many recipients is a set worth ringing. See `VIDEO_CONF_RINGING_LIMIT` for why there is a cap. */
export const shouldRingVideoConference = (recipientCount: number): boolean =>
	recipientCount > 0 && recipientCount <= VIDEO_CONF_RINGING_LIMIT;
