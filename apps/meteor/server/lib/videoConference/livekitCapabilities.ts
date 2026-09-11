import type { VideoConferenceCapabilities } from '@rocket.chat/core-typings';

/**
 * What the LiveKit provider tells the rest of Rocket.Chat it can do.
 *
 * Every call-window and persistent-chat path is gated on one of these, so an omission here does not fail — it
 * quietly turns a feature off. `persistentChat` was missing, so a LiveKit call in main-room mode got no
 * discussion: `maybeCreateDiscussion` asks for the capability and stopped there, silently, leaving the mode
 * looking implemented and doing nothing.
 *
 * Declared apart from the registration so it can be read on its own, and so what it unlocks is written down
 * where the capabilities are rather than at the gates that ask.
 */
export const LIVEKIT_CAPABILITIES = {
	/** Offers a microphone toggle on the preflight, and takes the choice into the call. */
	mic: true,
	/** Offers a camera toggle, and a self-view to go with it. */
	cam: true,
	/** The call can be named, which is what the preflight's name field and `video-conference.rename` write. */
	title: true,
	/** The call runs inside Rocket.Chat: presence leases, per-member lifecycle, the ring-on-arrival rule. */
	embedded: true,
	/**
	 * The call gets a discussion of its own in main-room mode, which is what `maybeCreateDiscussion` asks about.
	 * Not thread mode: a thread off the call's message is read in our call window's chat panel, so it follows the
	 * window rather than the provider — see `VideoConfService.chatLivesInAThread`.
	 */
	persistentChat: true,
} satisfies VideoConferenceCapabilities;
