import { isThreadMessage } from '@rocket.chat/core-typings';
import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { memoize } from '@rocket.chat/memo';

import { callWithErrorHandling } from './callWithErrorHandling';
import { RoomHistoryManager } from '../../../app/ui-utils/client';
import { router } from '../../providers/RouterProvider';
import { Subscriptions } from '../../stores';
import { RoomManager } from '../RoomManager';
import { roomCoordinator } from '../rooms/roomCoordinator';

const getRoomById = memoize((rid: IRoom['_id']) => callWithErrorHandling('getRoomById', rid));

type GoToRoomByIdOptions = {
	replace?: boolean;
	routeParamsOverrides?: Record<string, string>;
};

const goToRoomById = async (roomId: IRoom['_id'], options: GoToRoomByIdOptions = {}): Promise<void> => {
	if (!roomId) return;

	const subscription = Subscriptions.state.find((record) => record.rid === roomId);

	if (subscription) {
		roomCoordinator.openRouteLink(subscription.t, subscription, router.getSearchParameters(), options);
		return;
	}

	const room = await getRoomById(roomId);
	roomCoordinator.openRouteLink(room.t, { rid: room._id, ...room }, router.getSearchParameters(), options);
};

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

		if (message.tcount) {
			await RoomHistoryManager.getSurroundingChannelMessages(message);
		} else if (!RoomHistoryManager.isLoaded(message.rid)) {
			await RoomHistoryManager.getMore(message.rid);
		}

		return;
	}

	if (RoomManager.opened === message.rid) {
		await RoomHistoryManager.getSurroundingChannelMessages(message);
		return;
	}

	await goToRoomById(message.rid);

	await RoomHistoryManager.getSurroundingChannelMessages(message);
};
