import { RING_RECIPIENTS_LIMIT } from '@rocket.chat/core-typings';

export const availabilityErrors = {
	NOT_CONFIGURED: 'video-conf-provider-not-configured',
	NOT_ACTIVE: 'no-active-video-conf-provider',
	NO_APP: 'no-videoconf-provider-app',
};

/** Faces shown in a sidebar row before the rest become a "+N". The server slices the payload to it. */
export const CALL_FACES_SHOWN = 2;

/** The same on the preflight, which has a screen rather than a row to fit them in. */
export const PREFLIGHT_FACES_SHOWN = 10;

/** How long a conference outlives its last participant, so a reload can cancel the ending. */
export const EMPTY_CALL_GRACE_MS = 10_000;

/** Whether this many recipients is a set worth ringing. */
export const shouldRingRecipients = (recipientCount: number): boolean => recipientCount > 0 && recipientCount <= RING_RECIPIENTS_LIMIT;
