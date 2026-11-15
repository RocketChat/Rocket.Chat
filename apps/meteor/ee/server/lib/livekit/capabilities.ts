import type { VideoConferenceCapabilities } from '@rocket.chat/core-typings';

/**
 * What the LiveKit provider tells the rest of Rocket.Chat it can do. A capability left out does not fail anywhere:
 * the feature gated on it is silently off.
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
	/** The call gets a discussion of its own in main-room mode. */
	persistentChat: true,
} satisfies VideoConferenceCapabilities;
