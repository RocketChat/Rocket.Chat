import { isDiscussion, isOmnichannelRoom, isPublicRoom, isRoomFederated } from '@rocket.chat/core-typings';

import { getRoomAbacLockContext } from '../../../../server/lib/authorization/getRoomAbacLockContext';
import { callbacks } from '../../../../server/lib/callbacks';
import { beforeCreateRoomCallback } from '../../../../server/lib/callbacks/beforeCreateRoomCallback';

beforeCreateRoomCallback.add(
	({ room }) => {
		const { enforcementOn } = getRoomAbacLockContext();

		if (!enforcementOn) {
			return;
		}

		if (isRoomFederated(room) || isOmnichannelRoom(room)) {
			return;
		}

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
