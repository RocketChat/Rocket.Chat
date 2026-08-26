import { useSetting } from '@rocket.chat/ui-contexts';

/**
 * The one switch for the call-window experience.
 *
 * Everything the feature changes about placing, answering and ending a call hangs off this: the in-product
 * conference page, the preflight that is where a call is actually created, the ongoing-calls list that replaces
 * the incoming-call popup, and the membership-based flow around them. With it off, every one of those sites
 * takes the path it took before the feature existed.
 *
 * It is deliberately *not* `VideoConf_Enable_Persistent_Chat`, which keeps meaning only what it always meant —
 * a discussion or thread per call — so a workspace already running persistent chat sees no change until this is
 * turned on.
 *
 * One hook rather than a `useSetting` call at each site, so there is a single answer to "what is gated on this"
 * and a single place to find every gate.
 */
export const useConferenceWindowEnabled = (): boolean => useSetting('VideoConf_Conference_Window_Enabled', false);
