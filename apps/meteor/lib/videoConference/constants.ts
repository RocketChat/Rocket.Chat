import { VIDEO_CONF_RINGING_LIMIT } from '@rocket.chat/core-typings';

export const availabilityErrors = {
	NOT_CONFIGURED: 'video-conf-provider-not-configured',
	NOT_ACTIVE: 'no-active-video-conf-provider',
	NO_APP: 'no-videoconf-provider-app',
};

/** Whether this many recipients is a set worth ringing. See `VIDEO_CONF_RINGING_LIMIT` for why there is a cap. */
export const shouldRingVideoConference = (recipientCount: number): boolean =>
	recipientCount > 0 && recipientCount <= VIDEO_CONF_RINGING_LIMIT;
