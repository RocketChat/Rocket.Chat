export const availabilityErrors = {
	NOT_CONFIGURED: 'video-conf-provider-not-configured',
	NOT_ACTIVE: 'no-active-video-conf-provider',
	NO_APP: 'no-videoconf-provider-app',
};

/**
 * How many people a single call event may ring. Ringing is decided per event against the list being rung:
 * starting a call rings the room's members, so a large room rings nobody, while adding participants rings
 * just the people added — which is why an add is capped at the same number and therefore always rings.
 */
export const VIDEO_CONF_RINGING_LIMIT = 10;

export const shouldRingVideoConference = (recipientCount: number): boolean =>
	recipientCount > 0 && recipientCount <= VIDEO_CONF_RINGING_LIMIT;
