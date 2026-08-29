import { Logger } from '@rocket.chat/logger';

import { isLiveKitFullyConfigured } from './config';
import { listRoomParticipantIdentities } from './roomService';
import { videoConfPresence } from '../../../../server/lib/videoConfPresence';

const logger = new Logger('LiveKit/Presence');

const livekitRoomNameFor = (callId: string) => `mc-${callId}`;

/**
 * Lets the presence sweep ask LiveKit who is in a call, instead of only inferring it from what call windows
 * report.
 *
 * Presence is held by leases the conference window renews, which is what makes it work for every provider. This
 * adds nothing to that mechanism and replaces no part of it — it renews the same leases from the server side,
 * which matters because a browser throttles the timers of a window that isn't in front, and a call is usually
 * something you listen to while looking at something else. LiveKit's answer is immune to all of that.
 *
 * Not configured means not registered: with no API credentials there is nothing to ask, and the leases carry on
 * alone exactly as they do for a provider reached by URL.
 */
export function registerLiveKitPresenceProbe(): void {
	if (!isLiveKitFullyConfigured()) {
		videoConfPresence.unregisterProbe('livekit');
		return;
	}

	videoConfPresence.registerProbe('livekit', async ({ _id }) => listRoomParticipantIdentities(livekitRoomNameFor(_id)));
	logger.debug({ msg: 'LiveKit presence probe registered' });
}
