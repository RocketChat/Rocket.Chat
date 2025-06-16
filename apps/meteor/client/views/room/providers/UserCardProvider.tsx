import { Popover } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps, ReactNode, UIEvent } from 'react';
import { Suspense, lazy, useCallback, useMemo, useRef, useState } from 'react';
import { useOverlayTrigger } from 'react-aria';
import { useOverlayTriggerState } from 'react-stately';

import { useRoom } from '../contexts/RoomContext';
import { useRoomToolbox } from '../contexts/RoomToolboxContext';
import { UserCardContext } from '../contexts/UserCardContext';

const UserCard = lazy(() => import('../UserCard'));

const UserCardProvider = ({ children }: { children: ReactNode }) => {
	const room = useRoom();
	const [userCardData, setUserCardData] = useState<ComponentProps<typeof UserCard> | null>(null);

	const triggerRef = useRef<Element | null>(null);
	const state = useOverlayTriggerState({});
	const { triggerProps, overlayProps } = useOverlayTrigger({ type: 'dialog' }, state, triggerRef);
	delete triggerProps.onPress;

	const { openTab } = useRoomToolbox();

	const openUserInfo = useEffectEvent((username?: string) => {
		switch (room.t) {
			case 'l':
				openTab('room-info', username);
				break;

			case 'v':
				openTab('voip-room-info', username);
				break;

			case 'd':
				(room.uids?.length ?? 0) > 2 ? openTab('user-info-group', username) : openTab('user-info', username);
				break;

			default:
				openTab('members-list', username);
				break;
		}
	});

	const handleSetUserCard = useCallback(
		(e: UIEvent, username: string) => {
			triggerRef.current = e.target as Element | null;
			state.open();
			setUserCardData({
				username,
				rid: room._id,
				onOpenUserInfo: () => openUserInfo(username),
				onClose: () => setUserCardData(null),
			});
		},
		[openUserInfo, room._id, state],
	);

	const contextValue = useMemo(
		() => ({
			openUserCard: handleSetUserCard,
			closeUserCard: () => setUserCardData(null),
			triggerProps,
			triggerRef,
			state,
		}),
		[handleSetUserCard, state, triggerProps],
	);

	return (
		<UserCardContext.Provider value={contextValue}>
			{children}
			{state.isOpen && userCardData && (
				<Suspense fallback={null}>
					<Popover placement='top left' triggerRef={triggerRef} state={state}>
						<UserCard {...userCardData} {...overlayProps} />
					</Popover>
				</Suspense>
			)}
		</UserCardContext.Provider>
	);
};

export default UserCardProvider;
