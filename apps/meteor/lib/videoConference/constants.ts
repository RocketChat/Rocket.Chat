import { RING_RECIPIENTS_LIMIT } from '@rocket.chat/core-typings';

export const availabilityErrors = {
	NOT_CONFIGURED: 'video-conf-provider-not-configured',
	NOT_ACTIVE: 'no-active-video-conf-provider',
	NO_APP: 'no-videoconf-provider-app',
};

/** The server slices the joinable payload to this, so a busy channel does not send a roster to draw two. */
export const CALL_FACES_SHOWN = 2;

/**
 * Where a call's persistent chat lives. Written down once because both halves read the same setting and have to
 * agree on what it can say — the server through `getPersistentChatMode`, the call window through
 * `useConferenceEmbedded`.
 */
export const PERSISTENT_CHAT_MODES = ['thread', 'main_room'] as const;

export type PersistentChatMode = (typeof PERSISTENT_CHAT_MODES)[number];

export const PREFLIGHT_FACES_SHOWN = 10;

/** How long a conference outlives its last participant, so a reload can cancel the ending. */
export const EMPTY_CALL_GRACE_MS = 10_000;

export const shouldRingRecipients = (recipientCount: number): boolean => recipientCount > 0 && recipientCount <= RING_RECIPIENTS_LIMIT;
