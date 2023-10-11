import type { IRoom } from '@rocket.chat/core-typings';
import { usePermission, useStream, useUserId, useRouter } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import type { ReactNode, ContextType, ReactElement } from 'react';
import React, { useState, useMemo, memo, useEffect, useCallback } from 'react';

import { ChatRoom, ChatSubscription } from '../../../../app/models/client';
import { RoomHistoryManager } from '../../../../app/ui-utils/client';
import { UserAction } from '../../../../app/ui/client/lib/UserAction';
import ImageGallery from '../../../components/ImageGallery';
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
	const { t: roomType } = room ?? {};

	const [imageUrl, setImageUrl] = useState<string | null>();

	// TODO: move this to omnichannel context only
	useEffect(() => {
		if (roomType !== 'l') {
			return;
		}

		return subscribeToRoom(rid, (room) => {
			queryClient.setQueryData(['rooms', rid], room);
		});
	}, [subscribeToRoom, rid, queryClient, roomType]);

	// TODO: the following effect is a workaround while we don't have a general and definitive solution for it
	const router = useRouter();
	useEffect(() => {
		if (isSuccess && !room) {
			router.navigate('/home');
		}
	}, [isSuccess, room, router]);

	const { _id: servedById } = room?.servedBy ?? {};

	// TODO: Review the necessity of this effect when we move away from cached collections
	useEffect(() => {
		if (roomType !== 'l' || !servedById) {
			return;
		}

		if (!isLivechatAdmin && servedById !== userId) {
			ChatRoom.remove(rid);
			queryClient.removeQueries(['rooms', rid]);
			queryClient.removeQueries(['rooms', { reference: rid, type: 'l' }]);
			queryClient.removeQueries(['/v1/rooms.info', rid]);
		}
	}, [isLivechatAdmin, queryClient, userId, rid, roomType, servedById]);

	useEffect(() => {
		document.addEventListener('click', (event) => {
			const target = event?.target as HTMLImageElement;
			if (target?.classList.contains('gallery-item')) {
				setImageUrl(target?.dataset?.src);
			}
		});
	}, []);
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
				{imageUrl && <ImageGallery url={imageUrl} onClose={() => setImageUrl(null)} />}
				<ComposerPopupProvider room={pseudoRoom}>{children}</ComposerPopupProvider>
			</RoomToolboxProvider>
		</RoomContext.Provider>
	);
};

export default memo(RoomProvider);
