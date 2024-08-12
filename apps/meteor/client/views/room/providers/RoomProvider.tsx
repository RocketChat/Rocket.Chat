import type { IRoom } from '@rocket.chat/core-typings';
import { useFeaturePreview } from '@rocket.chat/ui-client';
import { useRouter } from '@rocket.chat/ui-contexts';
import type { ReactNode, ContextType, ReactElement } from 'react';
import React, { useMemo, memo, useEffect, useCallback } from 'react';

import { ChatSubscription } from '../../../../app/models/client';
import { RoomHistoryManager } from '../../../../app/ui-utils/client';
import { UserAction } from '../../../../app/ui/client/lib/UserAction';
import { useReactiveQuery } from '../../../hooks/useReactiveQuery';
import { useReactiveValue } from '../../../hooks/useReactiveValue';
import { useRoomInfoEndpoint } from '../../../hooks/useRoomInfoEndpoint';
import { RoomManager } from '../../../lib/RoomManager';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import ImageGalleryProvider from '../../../providers/ImageGalleryProvider';
import RoomNotFound from '../RoomNotFound';
import RoomSkeleton from '../RoomSkeleton';
import { useRoomRolesManagement } from '../body/hooks/useRoomRolesManagement';
import { RoomContext } from '../contexts/RoomContext';
import ComposerPopupProvider from './ComposerPopupProvider';
import RoomToolboxProvider from './RoomToolboxProvider';
import UserCardProvider from './UserCardProvider';
import { useRedirectOnSettingsChanged } from './hooks/useRedirectOnSettingsChanged';
import { useUsersNameChanged } from './hooks/useUsersNameChanged';

type RoomProviderProps = {
	children: ReactNode;
	rid: IRoom['_id'];
};

const RoomProvider = ({ rid, children }: RoomProviderProps): ReactElement => {
	useRoomRolesManagement(rid);

	const { data, isSuccess } = useRoomInfoEndpoint(rid);

	// TODO: the following effect is a workaround while we don't have a general and definitive solution for it
	const router = useRouter();
	useEffect(() => {
		if (isSuccess && !data.room) {
			router.navigate('/home');
		}
	}, [isSuccess, data?.room, router]);

	const subscriptionQuery = useReactiveQuery(['subscriptions', { rid }], () => ChatSubscription.findOne({ rid }) ?? null);

	useRedirectOnSettingsChanged(subscriptionQuery.data);

	useUsersNameChanged();

	const pseudoRoom = useMemo(() => {
		if (!data?.room) {
			return null;
		}

		return {
			...subscriptionQuery.data,
			...data.room,
			name: roomCoordinator.getRoomName(data.room.t, data.room),
			federationOriginalName: data.room.name,
		};
	}, [data?.room, subscriptionQuery.data]);

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

	const isSidepanelFeatureEnabled = useFeaturePreview('sidepanelNavigation');

	useEffect(() => {
		if (!isSidepanelFeatureEnabled) {
			RoomManager.open(rid);
			return (): void => {
				RoomManager.back(rid);
			};
		}

		if (isSuccess && data) {
			if (data.room?.prid && data.parent?.sidepanel?.items.includes('discussions')) {
				RoomManager.openSecondLevel(data.parent._id, rid);
			}
			if (data.team?.roomId && !data.room?.teamMain && data.parent?.sidepanel?.items.includes('channels')) {
				RoomManager.openSecondLevel(data.team.roomId, rid);
			}
		}

		if ((!data?.room?.teamId || data?.room?.teamMain) && !data?.room?.prid) {
			RoomManager.open(rid);
		}

		return (): void => {
			RoomManager.back(rid);
		};
	}, [
		isSidepanelFeatureEnabled,
		rid,
		data?.room?.prid,
		data?.room?.teamId,
		data?.room?.teamMain,
		isSuccess,
		data?.parent,
		data?.team?.roomId,
		data,
	]);

	const subscribed = !!subscriptionQuery.data;

	useEffect(() => {
		if (!subscribed) {
			return;
		}

		return UserAction.addStream(rid);
	}, [rid, subscribed]);

	if (!pseudoRoom) {
		return isSuccess && !data.room ? <RoomNotFound /> : <RoomSkeleton />;
	}

	return (
		<RoomContext.Provider value={context}>
			<RoomToolboxProvider>
				<ImageGalleryProvider>
					<UserCardProvider>
						<ComposerPopupProvider room={pseudoRoom}>{children}</ComposerPopupProvider>
					</UserCardProvider>
				</ImageGalleryProvider>
			</RoomToolboxProvider>
		</RoomContext.Provider>
	);
};

export default memo(RoomProvider);
