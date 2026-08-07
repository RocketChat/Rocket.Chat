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
};
