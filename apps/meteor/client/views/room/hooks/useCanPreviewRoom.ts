import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { usePermission, useSetting } from '@rocket.chat/ui-contexts';

import { canPreviewRoom } from '../lib/canPreviewRoom';

/** Answers whether this reader gets to see the room's messages at all. */
export const useCanPreviewRoom = (room: IRoom, subscription?: ISubscription): boolean => {
	const allowAnonymousRead = useSetting('Accounts_AllowAnonymousRead', false);
	const canPreviewChannelRoom = usePermission('preview-c-room');

	return canPreviewRoom({
		isPublicChannel: room.t === 'c',
		allowAnonymousRead: allowAnonymousRead === true,
		canPreviewChannelRoom,
		subscribed: Boolean(subscription),
	});
};
