import { isDiscussion, isOmnichannelRoom, isPublicRoom, isRoomFederated } from '@rocket.chat/core-typings';

import { getRoomAbacLockContext } from '../../../../server/lib/authorization/getRoomAbacLockContext';
import { callbacks } from '../../../../server/lib/callbacks';
import { beforeCreateRoomCallback } from '../../../../server/lib/callbacks/beforeCreateRoomCallback';

/**
 * Every non-DM creation path funnels through `createRoom`, so guarding here means a new caller
 * cannot become a bypass. DMs return through `createDirectRoom` before this runs.
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

		// `Discussion_enabled` is also held at false; this covers the callers that bypass it.
		if (isDiscussion(room)) {
			throw new Error('error-abac-discussion-creation-blocked');
		}

		if (isPublicRoom(room)) {
			throw new Error('error-abac-public-room-creation-blocked');
		}
	},
	callbacks.priority.HIGH,
	'abac-block-non-compliant-room-creation',
);
