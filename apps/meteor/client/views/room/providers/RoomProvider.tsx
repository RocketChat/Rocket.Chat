import type { IRoom } from '@rocket.chat/core-typings';
import { useRoute } from '@rocket.chat/ui-contexts';
import type { ReactNode, ContextType, ReactElement } from 'react';
import React, { useMemo, memo, useEffect, useCallback } from 'react';

import { ChatSubscription, ChatRoom } from '../../../../app/models/client';
import { RoomHistoryManager } from '../../../../app/ui-utils/client';
import { UserAction } from '../../../../app/ui/client/lib/UserAction';
import { useReactiveQuery } from '../../../hooks/useReactiveQuery';
import { useReactiveValue } from '../../../hooks/useReactiveValue';
import { RoomManager } from '../../../lib/RoomManager';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import RoomNotFound from '../RoomNotFound';
import RoomSkeleton from '../RoomSkeleton';
import { useRoomRolesManagement } from '../components/body/hooks/useRoomRolesManagement';
import { RoomAPIContext } from '../contexts/RoomAPIContext';
import { RoomContext } from '../contexts/RoomContext';
import ComposerPopupProvider from './ComposerPopupProvider';
import ToolboxProvider from './ToolboxProvider';

type RoomProviderProps = {
	children: ReactNode;
	rid: IRoom['_id'];
};

const RoomProvider = ({ rid, children }: RoomProviderProps): ReactElement => {
	useRoomRolesManagement(rid);

	const roomQuery = useReactiveQuery(['rooms', rid], () => ChatRoom.findOne({ _id: rid }));

	// TODO: the following effect is a workaround while we don't have a general and definitive solution for it
	const homeRoute = useRoute('home');
	useEffect(() => {
		if (roomQuery.isSuccess && roomQuery.data === undefined) {
			homeRoute.push();
		}
	}, [roomQuery.isSuccess, roomQuery.data, homeRoute]);

	const subscriptionQuery = useReactiveQuery(['subscriptions', { rid }], () => ChatSubscription.findOne({ rid }) ?? null);

	const pseudoRoom = useMemo(() => {
		if (!roomQuery.data) {
			return null;
		}

		return {
			...subscriptionQuery.data,
			...roomQuery.data,
			name: roomCoordinator.getRoomName(roomQuery.data.t, roomQuery.data),
			federationOriginalName: roomQuery.data.name,
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

	const subscribed = !!subscriptionQuery.data;

	useEffect(() => {
		if (!subscribed) {
			return;
		}

		UserAction.addStream(rid);
		return (): void => {
			try {
				UserAction.cancel(rid);
			} catch (error) {
				// Do nothing
			}
		};
	}, [rid, subscribed]);

	const api = useMemo(() => ({}), []);

	if (!pseudoRoom) {
		return roomQuery.isSuccess && roomQuery.data === undefined ? <RoomNotFound /> : <RoomSkeleton />;
	}

	return (
		<RoomAPIContext.Provider value={api}>
			<RoomContext.Provider value={context}>
				<ToolboxProvider room={pseudoRoom}>
					<ComposerPopupProvider room={pseudoRoom}>{children}</ComposerPopupProvider>
				</ToolboxProvider>
			</RoomContext.Provider>
		</RoomAPIContext.Provider>
	);
};

export default memo(RoomProvider);
