import { Subscriptions } from '@rocket.chat/models';

import { videoConfTypes } from '../lib/videoConfTypes';

// Maximum number of room members for which ringing is enabled in CE.
// Mirrors the EE limit so that behavior is consistent: EE handlers (priority 1) take
// precedence for EE installs; this handler (priority 0) activates only when no higher-
// priority handler matched (i.e. pure CE, or EE rooms that the EE handler excluded).
// Using the same cap means EE rooms that were intentionally excluded (>10 members) are
// also excluded here — no unintended ringing for large EE rooms.
const MAX_RINGING_MEMBERS = 10;

videoConfTypes.registerVideoConferenceType(
	{ type: 'videoconference', ringing: true },
	async ({ _id, t }, allowRinging) => {
		if (!allowRinging || t === 'l') {
			return false;
		}

		return (await Subscriptions.countByRoomId(_id)) <= MAX_RINGING_MEMBERS;
	},
	0,
);
