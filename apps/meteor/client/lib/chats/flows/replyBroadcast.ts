import type { IMessage } from '@rocket.chat/core-typings';

import { router } from '../../../providers/RouterProvider';
import { roomCoordinator } from '../../rooms/roomCoordinator';
import type { ChatAPI } from '../ChatAPI';

export const replyBroadcast = async (_chat: ChatAPI, message: IMessage) => {
	roomCoordinator.openRouteLink(
		'd',
		{ name: message.u.username },
		{
			...router.getSearchParameters(),
			reply: message._id,
		},
	);
};
