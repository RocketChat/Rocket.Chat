import type { IMessage } from '@rocket.chat/core-typings';
import { isThreadMessage } from '@rocket.chat/core-typings';

import { goToRoomById } from './goToRoomById';
import { RoomHistoryManager } from '../../../app/ui-utils/client';
import { router } from '../../providers/RouterProvider';
import { RoomManager } from '../RoomManager';

/** @deprecated */
export const legacyJumpToMessage = async (message: IMessage) => {
	if (isThreadMessage(message) || message.tcount) {
		const { tab, context } = router.getRouteParameters();

		if (tab === 'thread' && (context === message.tmid || context === message._id)) {
			return;
		}

		await goToRoomById(message.rid, {
			routeParamsOverrides: { tab: 'thread', context: message.tmid || message._id },
			replace: RoomManager.opened === message.rid,
		});
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
