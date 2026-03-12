import { isThreadMessage } from '@rocket.chat/core-typings';
import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { memoize } from '@rocket.chat/memo';
import { useEndpoint, useSearchParameter } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { RoomHistoryManager } from '../../../../../app/ui-utils/client';
import { RoomManager } from '../../../../lib/RoomManager';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';
import { callWithErrorHandling } from '../../../../lib/utils/callWithErrorHandling';
import { router } from '../../../../providers/RouterProvider';
import { Subscriptions } from '../../../../stores';

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
const legacyJumpToMessage = async (message: IMessage) => {
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

export const useLoadSurroundingMessages = () => {
	const msgId = useSearchParameter('msg');
	const jumpToRef = useRef<HTMLElement>(undefined);

	const queryClient = useQueryClient();
	const getMessage = useEndpoint('GET', '/v1/chat.getMessage');

	useEffect(() => {
		if (!msgId) return;

		if (jumpToRef.current) return;

		const abort = new AbortController();

		queryClient
			.fetchQuery({
				queryKey: ['chat.getMessage', msgId],
				queryFn: () => {
					return getMessage({ msgId });
				},
			})
			.then(({ message }) => {
				if (abort.signal.aborted) return;

				// Serialized IMessage dates are strings. For this function, only ts is needed
				legacyJumpToMessage({ ...message, ts: new Date(message.ts) } as any as IMessage);
			})
			.catch((error) => {
				console.warn(error);
			});
		return () => {
			abort.abort();
		};
	}, [msgId, queryClient, getMessage]);

	return { jumpToRef };
};
