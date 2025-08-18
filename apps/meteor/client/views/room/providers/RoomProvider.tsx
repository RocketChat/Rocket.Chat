import type { IRoom } from '@rocket.chat/core-typings';
import type { ReactNode, ContextType, ReactElement } from 'react';
import { useMemo, memo, useEffect, useCallback } from 'react';

import ComposerPopupProvider from './ComposerPopupProvider';
import RoomToolboxProvider from './RoomToolboxProvider';
import UserCardProvider from './UserCardProvider';
import { useRedirectOnSettingsChanged } from './hooks/useRedirectOnSettingsChanged';
import { useUsersNameChanged } from './hooks/useUsersNameChanged';
import { UserAction } from '../../../../app/ui/client/lib/UserAction';
import { RoomHistoryManager } from '../../../../app/ui-utils/client';
import { omit } from '../../../../lib/utils/omit';
import { useFireGlobalEvent } from '../../../hooks/useFireGlobalEvent';
import { useReactiveValue } from '../../../hooks/useReactiveValue';
import { RoomManager } from '../../../lib/RoomManager';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import ImageGalleryProvider from '../../../providers/ImageGalleryProvider';
import { Rooms, Subscriptions } from '../../../stores';
import RoomNotFound from '../RoomNotFound';
import RoomSkeleton from '../RoomSkeleton';
import type { IRoomWithFederationOriginalName } from '../contexts/RoomContext';
import { RoomContext } from '../contexts/RoomContext';

type RoomProviderProps = {
	children: ReactNode;
	rid: IRoom['_id'];
};

const RoomProvider = ({ rid, children }: RoomProviderProps): ReactElement => {
	const room = Rooms.use((state) => state.get(rid));

	const subscritionFromLocal = Subscriptions.use((state) => state.find((record) => record.rid === rid));

	useRedirectOnSettingsChanged(subscritionFromLocal);

	useUsersNameChanged();

	const pseudoRoom: IRoomWithFederationOriginalName | null = useMemo(() => {
		if (!room) {
			return null;
		}

		return {
			...subscritionFromLocal,
			...room,
			name: roomCoordinator.getRoomName(room.t, room),
			federationOriginalName: room.name,
		};
	}, [room, subscritionFromLocal]);

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
			subscription: subscritionFromLocal ?? undefined,
			hasMorePreviousMessages,
			hasMoreNextMessages,
			isLoadingMoreMessages,
		};
	}, [hasMoreNextMessages, hasMorePreviousMessages, isLoadingMoreMessages, pseudoRoom, rid, subscritionFromLocal]);

	const { mutate: fireRoomOpenedEvent } = useFireGlobalEvent('room-opened', rid);

	useEffect(() => {
		if (room) {
			fireRoomOpenedEvent(omit(room, 'usernames'));
		}
	}, [rid, room, fireRoomOpenedEvent]);

	useEffect(() => {
		RoomManager.open(rid);
		return (): void => {
			RoomManager.back(rid);
		};
	}, [rid]);

	const subscribed = !!subscritionFromLocal;

	useEffect(() => {
		if (!subscribed) {
			return;
		}

		return UserAction.addStream(rid);
	}, [rid, subscribed]);

	if (!pseudoRoom) {
		return !room ? <RoomNotFound /> : <RoomSkeleton />;
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
