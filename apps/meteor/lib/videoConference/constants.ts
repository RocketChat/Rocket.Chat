import { RING_RECIPIENTS_LIMIT } from '@rocket.chat/core-typings';

export const availabilityErrors = {
	NOT_CONFIGURED: 'video-conf-provider-not-configured',
	NOT_ACTIVE: 'no-active-video-conf-provider',
	NO_APP: 'no-videoconf-provider-app',
};

/** The server slices the joinable payload to this, so a busy channel does not send a roster to draw two. */
export const CALL_FACES_SHOWN = 2;

/**
 * Where a call's persistent chat lives — the two answers the `VideoConf_Persistent_Chat_Mode` setting can give.
 *
 * A type and not a value: nothing here validates the setting, so a runtime array would be an export with no
 * reader pretending to be a shared contract. The server resolves the setting in `getPersistentChatMode` and the
 * call window reads it in `useConferenceEmbedded`; the day either of them checks a value against a list, this is
 * where the list goes.
 */
export type PersistentChatMode = 'thread' | 'main_room';

/** How long a conference outlives its last participant, so a reload can cancel the ending. */
export const EMPTY_CALL_GRACE_MS = 10_000;

export const shouldRingRecipients = (recipientCount: number): boolean => recipientCount > 0 && recipientCount <= RING_RECIPIENTS_LIMIT;
