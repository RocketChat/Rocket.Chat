import type { IRoom } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { usePermission, useStream, useUserId, useRouter } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import type { ReactNode, ContextType, ReactElement } from 'react';
import React, { useMemo, memo, useEffect, useCallback } from 'react';

import { ChatRoom, ChatSubscription } from '../../../../app/models/client';
import { RoomHistoryManager } from '../../../../app/ui-utils/client';
import { UserAction } from '../../../../app/ui/client/lib/UserAction';
import { useReactiveQuery } from '../../../hooks/useReactiveQuery';
import { useReactiveValue } from '../../../hooks/useReactiveValue';
import { RoomManager } from '../../../lib/RoomManager';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import RoomNotFound from '../RoomNotFound';
import RoomSkeleton from '../RoomSkeleton';
import { useRoomRolesManagement } from '../body/hooks/useRoomRolesManagement';
import { RoomContext } from '../contexts/RoomContext';
import ComposerPopupProvider from './ComposerPopupProvider';
import RoomToolboxProvider from './RoomToolboxProvider';
import { useRoomQuery } from './hooks/useRoomQuery';

type RoomProviderProps = {
	children: ReactNode;
	rid: IRoom['_id'];
};

const RoomProvider = ({ rid, children }: RoomProviderProps): ReactElement => {
	useRoomRolesManagement(rid);

	const { data: room, isSuccess } = useRoomQuery(rid);

	const subscribeToRoom = useStream('room-data');

	const queryClient = useQueryClient();
	const userId = useUserId();
	const isLivechatAdmin = usePermission('view-livechat-rooms');

	// TODO: move this to omnichannel context only
	useEffect(() => {
		if (!room || !isOmnichannelRoom(room)) {
			return;
		}

		return subscribeToRoom(rid, (room) => {
			queryClient.setQueryData(['rooms', rid], room);
		});
	}, [subscribeToRoom, rid, queryClient, room]);

	// TODO: the following effect is a workaround while we don't have a general and definitive solution for it
	const router = useRouter();
	useEffect(() => {
		if (isSuccess && !room) {
			router.navigate('/home');
		}
	}, [isSuccess, room, router]);

	// TODO: Review the necessity of this effect when we move away from cached collections
	useEffect(() => {
		if (!room || !isOmnichannelRoom(room) || !room.servedBy) {
			return;
		}

		if (!isLivechatAdmin && room.servedBy._id !== userId) {
			ChatRoom.remove(room._id);
			queryClient.removeQueries(['rooms', room._id]);
			queryClient.removeQueries(['rooms', { reference: room._id, type: 'l' }]);
			queryClient.removeQueries(['/v1/rooms.info', room._id]);
		}
	}, [isLivechatAdmin, queryClient, userId, room]);

	const subscriptionQuery = useReactiveQuery(['subscriptions', { rid }], () => ChatSubscription.findOne({ rid }) ?? null);

	const pseudoRoom = useMemo(() => {
		if (!room) {
			return null;
		}

		return {
			...subscriptionQuery.data,
			...room,
			name: roomCoordinator.getRoomName(room.t, room),
			federationOriginalName: room.name,
		};
	}, [room, subscriptionQuery.data]);

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

	if (!pseudoRoom) {
		return isSuccess && !room ? <RoomNotFound /> : <RoomSkeleton />;
	}

	return (
		<RoomContext.Provider value={context}>
			<RoomToolboxProvider>
				<ComposerPopupProvider room={pseudoRoom}>{children}</ComposerPopupProvider>
			</RoomToolboxProvider>
		</RoomContext.Provider>
	);
};

export default memo(RoomProvider);
