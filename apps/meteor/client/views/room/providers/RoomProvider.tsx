import type { IRoom } from '@rocket.chat/core-typings';
import { useRoute } from '@rocket.chat/ui-contexts';
import type { ReactNode, ContextType, ReactElement } from 'react';
import React, { useMemo, memo, useEffect, useCallback } from 'react';

import { RoomHistoryManager } from '../../../../app/ui-utils/client';
import { UserAction } from '../../../../app/ui/client';
import { useReactiveQuery } from '../../../hooks/useReactiveQuery';
import { useReactiveValue } from '../../../hooks/useReactiveValue';
import { RoomManager } from '../../../lib/RoomManager';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import RoomNotFound from '../RoomNotFound';
import RoomSkeleton from '../RoomSkeleton';
import { useRoomRolesManagement } from '../components/body/useRoomRolesManagement';
import { RoomAPIContext } from '../contexts/RoomAPIContext';
import { RoomContext } from '../contexts/RoomContext';
import ToolboxProvider from './ToolboxProvider';

type RoomProviderProps = {
	children: ReactNode;
	rid: IRoom['_id'];
};

const RoomProvider = ({ rid, children }: RoomProviderProps): ReactElement => {
	useRoomRolesManagement(rid);

	const roomQuery = useReactiveQuery(['rooms', rid], ({ rooms }) => rooms.findOne({ _id: rid }));

	// TODO: the following effect is a workaround while we don't have a general and definitive solution for it
	const homeRoute = useRoute('home');
	useEffect(() => {
		if (roomQuery.isSuccess && !roomQuery.data) {
			homeRoute.push();
		}
	}, [roomQuery.isSuccess, roomQuery.data, homeRoute]);

	const subscriptionQuery = useReactiveQuery(['subscriptions', { rid }], ({ subscriptions }) => subscriptions.findOne({ rid }) ?? null);

	const pseudoRoom = useMemo(() => {
		if (!roomQuery.data) {
			return null;
		}

		return {
			...subscriptionQuery.data,
			...roomQuery.data,
			name: roomCoordinator.getRoomName(roomQuery.data.t, roomQuery.data),
		};
	}, [roomQuery.data, subscriptionQuery.data]);

	const { hasMorePreviousMessages, hasMoreNextMessages, isLoadingMoreMessages } = useReactiveValue(
		useCallback(() => {
			const { hasMore, hasMoreNext, isLoading } = RoomHistoryManager.getRoom(rid);

			return {
				hasMorePreviousMessages: hasMore.get(),
				hasMoreNextMessages: hasMoreNext.get(),
				isLoadingMoreMessages: isLoading.get(),
			};
		}, [rid]),
	);

	const context = useMemo((): ContextType<typeof RoomContext> => {
		if (!pseudoRoom) {
			return null;
		}

		return {
			rid,
			room: pseudoRoom,
			subscription: subscriptionQuery.data ?? undefined,
			hasMorePreviousMessages,
			hasMoreNextMessages,
			isLoadingMoreMessages,
		};
	}, [hasMoreNextMessages, hasMorePreviousMessages, isLoadingMoreMessages, pseudoRoom, rid, subscriptionQuery.data]);

	useEffect(() => {
		RoomManager.open(rid);
		return (): void => {
			RoomManager.back(rid);
		};
	}, [rid]);

	useEffect(() => {
		if (!subscriptionQuery.data) {
			return;
		}

		UserAction.addStream(rid);
		return (): void => {
			UserAction.cancel(rid);
		};
	}, [rid, subscriptionQuery.data]);

	const api = useMemo(() => ({}), []);

	if (!pseudoRoom) {
		return roomQuery.isSuccess ? <RoomNotFound /> : <RoomSkeleton />;
	}

	return (
		<RoomAPIContext.Provider value={api}>
			<RoomContext.Provider value={context}>
				<ToolboxProvider room={pseudoRoom}>{children}</ToolboxProvider>
			</RoomContext.Provider>
		</RoomAPIContext.Provider>
	);
};

export default memo(RoomProvider);
