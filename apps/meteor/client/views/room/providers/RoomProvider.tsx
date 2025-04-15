import type { IRoom } from '@rocket.chat/core-typings';
import type { ReactNode, ContextType, ReactElement } from 'react';
import { useMemo, memo, useEffect, useCallback } from 'react';

import ComposerPopupProvider from './ComposerPopupProvider';
import RoomToolboxProvider from './RoomToolboxProvider';
import UserCardProvider from './UserCardProvider';
import { useRedirectOnSettingsChanged } from './hooks/useRedirectOnSettingsChanged';
import { useRoomQuery } from './hooks/useRoomQuery';
import { useUsersNameChanged } from './hooks/useUsersNameChanged';
import { Subscriptions } from '../../../../app/models/client';
import { UserAction } from '../../../../app/ui/client/lib/UserAction';
import { RoomHistoryManager } from '../../../../app/ui-utils/client';
import { omit } from '../../../../lib/utils/omit';
import { useFireGlobalEvent } from '../../../hooks/useFireGlobalEvent';
import { useReactiveQuery } from '../../../hooks/useReactiveQuery';
import { useReactiveValue } from '../../../hooks/useReactiveValue';
import { useRoomInfoEndpoint } from '../../../hooks/useRoomInfoEndpoint';
import { useSidePanelNavigation } from '../../../hooks/useSidePanelNavigation';
import { RoomManager } from '../../../lib/RoomManager';
import { subscriptionsQueryKeys } from '../../../lib/queryKeys';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import ImageGalleryProvider from '../../../providers/ImageGalleryProvider';
import RoomNotFound from '../RoomNotFound';
import RoomSkeleton from '../RoomSkeleton';
import type { IRoomWithFederationOriginalName } from '../contexts/RoomContext';
import { RoomContext } from '../contexts/RoomContext';

type RoomProviderProps = {
	children: ReactNode;
	rid: IRoom['_id'];
};

const RoomProvider = ({ rid, children }: RoomProviderProps): ReactElement => {
	const resultFromServer = useRoomInfoEndpoint(rid);

	const resultFromLocal = useRoomQuery(rid);

	const subscriptionQuery = useReactiveQuery(subscriptionsQueryKeys.subscription(rid), () => Subscriptions.findOne({ rid }) ?? null);

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

	const { mutate: fireRoomOpenedEvent } = useFireGlobalEvent('room-opened', rid);

	useEffect(() => {
		if (resultFromLocal.data) {
			fireRoomOpenedEvent(omit(resultFromLocal.data, 'usernames'));
		}
	}, [rid, resultFromLocal.data, fireRoomOpenedEvent]);

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
