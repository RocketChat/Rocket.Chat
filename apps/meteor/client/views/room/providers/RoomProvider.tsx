import type { IRoom } from '@rocket.chat/core-typings';
import { useRouter } from '@rocket.chat/ui-contexts';
import type { ReactNode, ContextType, ReactElement } from 'react';
import React, { useMemo, memo, useEffect, useCallback } from 'react';

import { ChatSubscription } from '../../../../app/models/client';
import { RoomHistoryManager } from '../../../../app/ui-utils/client';
import { UserAction } from '../../../../app/ui/client/lib/UserAction';
import { useReactiveQuery } from '../../../hooks/useReactiveQuery';
import { useReactiveValue } from '../../../hooks/useReactiveValue';
import { useRoomInfoEndpoint } from '../../../hooks/useRoomInfoEndpoint';
import { useSidePanelNavigation } from '../../../hooks/useSidePanelNavigation';
import { RoomManager } from '../../../lib/RoomManager';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import ImageGalleryProvider from '../../../providers/ImageGalleryProvider';
import RoomNotFound from '../RoomNotFound';
import RoomSkeleton from '../RoomSkeleton';
import { useRoomRolesManagement } from '../body/hooks/useRoomRolesManagement';
import type { IRoomWithFederationOriginalName } from '../contexts/RoomContext';
import { RoomContext } from '../contexts/RoomContext';
import ComposerPopupProvider from './ComposerPopupProvider';
import RoomToolboxProvider from './RoomToolboxProvider';
import UserCardProvider from './UserCardProvider';
import { useRedirectOnSettingsChanged } from './hooks/useRedirectOnSettingsChanged';
import { useRoomQuery } from './hooks/useRoomQuery';
import { useUsersNameChanged } from './hooks/useUsersNameChanged';

type RoomProviderProps = {
	children: ReactNode;
	rid: IRoom['_id'];
};

const RoomProvider = ({ rid, children }: RoomProviderProps): ReactElement => {
	useRoomRolesManagement(rid);

	const resultFromServer = useRoomInfoEndpoint(rid);

	const resultFromLocal = useRoomQuery(rid);

	// TODO: the following effect is a workaround while we don't have a general and definitive solution for it
	const router = useRouter();
	useEffect(() => {
		if (resultFromLocal.isSuccess && !resultFromLocal.data) {
			router.navigate('/home');
		}
	}, [resultFromLocal.data, resultFromLocal.isSuccess, resultFromServer, router]);

	const subscriptionQuery = useReactiveQuery(['subscriptions', { rid }], () => ChatSubscription.findOne({ rid }) ?? null);

	useRedirectOnSettingsChanged(subscriptionQuery.data);

	useUsersNameChanged();

	const pseudoRoom: IRoomWithFederationOriginalName | null = useMemo(() => {
		const room = resultFromLocal.data;
		if (!room) {
			return null;
		}

		return {
			...subscriptionQuery.data,
			...room,
			name: roomCoordinator.getRoomName(room.t, room),
			federationOriginalName: room.name,
		};
	}, [resultFromLocal.data, subscriptionQuery.data]);

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

	const isSidepanelFeatureEnabled = useSidePanelNavigation();

	useEffect(() => {
		if (isSidepanelFeatureEnabled) {
			if (resultFromServer.isSuccess) {
				if (resultFromServer.data.room?.teamMain) {
					if (
						resultFromServer.data.room.sidepanel?.items.includes('channels') ||
						resultFromServer.data.room?.sidepanel?.items.includes('discussions')
					) {
						RoomManager.openSecondLevel(rid, rid);
					} else {
						RoomManager.open(rid);
					}
					return (): void => {
						RoomManager.back(rid);
					};
				}

				switch (true) {
					case resultFromServer.data.room?.prid &&
						resultFromServer.data.parent &&
						resultFromServer.data.parent.sidepanel?.items.includes('discussions'):
						RoomManager.openSecondLevel(resultFromServer.data.parent._id, rid);
						break;
					case resultFromServer.data.team?.roomId &&
						!resultFromServer.data.room?.teamMain &&
						resultFromServer.data.parent?.sidepanel?.items.includes('channels'):
						RoomManager.openSecondLevel(resultFromServer.data.team.roomId, rid);
						break;

					default:
						if (
							resultFromServer.data.parent?.sidepanel?.items.includes('channels') ||
							resultFromServer.data.parent?.sidepanel?.items.includes('discussions')
						) {
							RoomManager.openSecondLevel(rid, rid);
						} else {
							RoomManager.open(rid);
						}
						break;
				}
			}
			return (): void => {
				RoomManager.back(rid);
			};
		}

		RoomManager.open(rid);
		return (): void => {
			RoomManager.back(rid);
		};
	}, [
		isSidepanelFeatureEnabled,
		rid,
		resultFromServer.data?.room?.prid,
		resultFromServer.data?.room?.teamId,
		resultFromServer.data?.room?.teamMain,
		resultFromServer.isSuccess,
		resultFromServer.data?.parent,
		resultFromServer.data?.team?.roomId,
		resultFromServer.data,
	]);

	const subscribed = !!subscriptionQuery.data;

	useEffect(() => {
		if (!subscribed) {
			return;
		}

		return UserAction.addStream(rid);
	}, [rid, subscribed]);

	if (!pseudoRoom) {
		return resultFromLocal.isSuccess && !resultFromLocal.data ? <RoomNotFound /> : <RoomSkeleton />;
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
