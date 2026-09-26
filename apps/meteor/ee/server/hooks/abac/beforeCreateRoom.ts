import { isDiscussion, isOmnichannelRoom, isPublicRoom, isRoomFederated } from '@rocket.chat/core-typings';

import { getRoomAbacLockContext } from '../../../../server/lib/authorization/getRoomAbacLockContext';
import { callbacks } from '../../../../server/lib/callbacks';
import { beforeCreateRoomCallback } from '../../../../server/lib/callbacks/beforeCreateRoomCallback';

/**
 * While enforcement is on, neither a public channel nor a discussion can be made compliant, so both
 * are refused at creation (ABAC-P4/D6, D7).
 *
 * `beforeCreateRoomCallback` is the seam because every non-DM creation path funnels through
 * `createRoom`, so a new caller cannot become a new bypass. DMs return through `createDirectRoom`
 * before this runs, which is why D1 needs no condition.
 */
beforeCreateRoomCallback.add(
	({ room }) => {
		const { enforcementOn } = getRoomAbacLockContext();

		if (!enforcementOn) {
			return;
		}

		if (isRoomFederated(room) || isOmnichannelRoom(room)) {
			return;
		}

		// `Discussion_enabled` is also held at false (D10); this covers the callers that bypass it.
		if (isDiscussion(room)) {
			throw new Error('error-abac-discussion-creation-blocked');
		}

		// Enforcement locks ABAC-managed on, which forces Private on.
		if (isPublicRoom(room)) {
			throw new Error('error-abac-public-room-creation-blocked');
		}
	},
	callbacks.priority.HIGH,
	'abac-block-non-compliant-room-creation',
);
