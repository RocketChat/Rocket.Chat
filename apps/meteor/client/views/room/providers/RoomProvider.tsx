import type { IRoom } from '@rocket.chat/core-typings';
import { LayoutContext, useLayout, useSearchParameter } from '@rocket.chat/ui-contexts';
import type { ReactNode, ContextType } from 'react';
import { useMemo, memo, useEffect } from 'react';

import ComposerPopupProvider from './ComposerPopupProvider';
import RoomToolboxProvider from './RoomToolboxProvider';
import UserCardProvider from './UserCardProvider';
import { useRedirectOnSettingsChanged } from './hooks/useRedirectOnSettingsChanged';
import { useUsersNameChanged } from './hooks/useUsersNameChanged';
import { omit } from '../../../../lib/utils/omit';
import { useFireGlobalEvent } from '../../../hooks/useFireGlobalEvent';
import { useRoomRolesQuery } from '../../../hooks/useRoomRolesQuery';
import { RoomHistoryManager, useRoomHistoryState } from '../../../lib/RoomHistoryManager';
import { RoomManager } from '../../../lib/RoomManager';
import { UserAction } from '../../../lib/UserAction';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import ImageGalleryProvider from '../../../providers/ImageGalleryProvider';
import { Rooms, Subscriptions } from '../../../stores';
import RoomNotFound from '../RoomNotFound';
import RoomSkeleton from '../RoomSkeleton';
import type { IRoomWithFederationOriginalName } from '../contexts/RoomContext';
import { RoomContext } from '../contexts/RoomContext';

export type RoomProviderProps = {
	children: ReactNode;
	rid: IRoom['_id'];
	/**
	 * Whether this room is rendered inside something else — a panel beside a call, rather than the workspace's
	 * main content. It is the same answer the embedded *layout* gives (Rocket.Chat inside another application),
	 * and the room reads only this one: no header of its own, a composer sized for a narrow column, links that
	 * stay where they are.
	 *
	 * Defaults to what the layout says, so a room opened the ordinary way behaves exactly as it always has —
	 * this only lets a caller say "embedded" for a room the layout knows nothing about.
	 */
	embedded?: boolean;
};

const RoomProvider = ({ rid, children, embedded }: RoomProviderProps) => {
	const layout = useLayout();
	// Only built when a caller asks for it: the ordinary room passes the layout's own context straight through.
	// `showTopNavbarEmbeddedLayout` is forced off rather than inherited: it is the workspace saying that an
	// embedded *page* should still show the navigation, which is a sentence about an iframe in someone else's
	// site. A room in a panel beside a call has no use for it — `Header` reads exactly these two flags, and with
	// the setting on the panel would have grown the full room header.
	const embeddedLayout = useMemo(() => ({ ...layout, isEmbedded: true, showTopNavbarEmbeddedLayout: false }), [layout]);
	const room = Rooms.use((state) => state.get(rid));

	const messageJumpParam = useSearchParameter('msg');

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

	const hasMorePreviousMessages = useRoomHistoryState(rid, (state) => state.hasMore);
	const hasMoreNextMessages = useRoomHistoryState(rid, (state) => state.hasMoreNext);
	const isLoadingMoreMessages = useRoomHistoryState(rid, (state) => state.isLoading);

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

	// Prefetch first batch of history in parallel with room metadata fetches, instead of waiting
	// for RoomBody's scroll/resize observer in useGetMore to fire.
	useEffect(() => {
		if (!room || messageJumpParam || RoomHistoryManager.isLoaded(rid) || RoomHistoryManager.isLoading(rid)) {
			return;
		}
		void RoomHistoryManager.getMore(rid);
	}, [rid, room, messageJumpParam]);

	// Prefetch room roles alongside history so message rendering doesn't trigger a late fetch.
	useRoomRolesQuery(rid, { enabled: !!room });

	const subscribed = !!subscritionFromLocal;

	useEffect(() => {
		if (!subscribed) {
			return;
		}

		return UserAction.addStream(rid);
	}, [rid, subscribed]);

	if (!pseudoRoom) {
		return !room && !subscritionFromLocal ? <RoomNotFound /> : <RoomSkeleton />;
	}

	const roomTree = (
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

	return embedded && !layout.isEmbedded ? <LayoutContext.Provider value={embeddedLayout}>{roomTree}</LayoutContext.Provider> : roomTree;
};

export default memo(RoomProvider);
