import type { IMessage } from '@rocket.chat/core-typings';
import { isThreadMessage } from '@rocket.chat/core-typings';

import { goToRoomById } from './goToRoomById';
import { RoomHistoryManager } from '../../../app/ui-utils/client';
import { router } from '../../providers/RouterProvider';
import { Rooms } from '../../stores';
import { RoomManager } from '../RoomManager';

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
					name: Rooms.state.get(message.rid)?.name ?? '',
				},
				search: {
					...router.getSearchParameters(),
					msg: message._id,
				},
			},
			{ replace: false },
		);
		await RoomHistoryManager.getSurroundingMessages(message);

		return;
	}

	if (RoomManager.opened === message.rid) {
		await RoomHistoryManager.getSurroundingMessages(message);
		return;
	}

	await goToRoomById(message.rid);

	await RoomHistoryManager.getSurroundingMessages(message);
};
