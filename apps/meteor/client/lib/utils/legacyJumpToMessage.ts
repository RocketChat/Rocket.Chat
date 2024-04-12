import type { IMessage } from '@rocket.chat/core-typings';
import { isThreadMessage } from '@rocket.chat/core-typings';

import { ChatRoom } from '../../../app/models/client';
import { RoomHistoryManager } from '../../../app/ui-utils/client';
import { router } from '../../providers/RouterProvider';
import { RoomManager } from '../RoomManager';
import { goToRoomById } from './goToRoomById';

/** @deprecated */
export const legacyJumpToMessage = async (message: IMessage) => {
	if (isThreadMessage(message) || message.tcount) {
		const { tab, context } = router.getRouteParameters();

		if (tab === 'thread' && (context === message.tmid || context === message._id)) {
			return;
		}

		router.navigate(
			{
				name: router.getRouteName()!,
				params: {
					tab: 'thread',
					context: message.tmid || message._id,
					rid: message.rid,
					name: ChatRoom.findOne({ _id: message.rid })?.name ?? '',
				},
				search: {
					...router.getSearchParameters(),
					msg: message._id,
				},
			},
			{ replace: false },
		);
		return;
	}

	if (RoomManager.opened === message.rid) {
		RoomHistoryManager.getSurroundingMessages(message);
		return;
	}

	await goToRoomById(message.rid);

	setTimeout(() => {
		RoomHistoryManager.getSurroundingMessages(message);
	}, 400);
};
