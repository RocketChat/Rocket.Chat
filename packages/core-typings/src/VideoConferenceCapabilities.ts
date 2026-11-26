export type VideoConferenceCapabilities = {
	mic?: boolean;
	cam?: boolean;
	title?: boolean;
	persistentChat?: boolean;
	/**
	 * When true, the call is rendered embedded inside Rocket.Chat (via an
	 * SFU like LiveKit) rather than handed off to an external URL/popup.
	 * Consumers gate URL-generation on the inverse: URL-based providers
	 * (Jitsi/Meet/Zoom) leave this false/undefined.
	 */
	embedded?: boolean;
	/**
	 * When true, the provider itself reports who is connected, and that report alone decides whether a member
	 * is in the call: joining from Rocket.Chat only makes them a member, and leaving it reports nothing.
	 */
	providerPresence?: boolean;
};
