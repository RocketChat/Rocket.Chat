import type { OverlayTriggerState } from '@react-stately/overlays';
import { useTooltipTriggerState } from '@react-stately/tooltip';
import { Box, Popover } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useRoomToolbox, UserCardContext } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactNode, UIEvent } from 'react';
import { Suspense, lazy, useMemo, useRef, useState } from 'react';

import { useHoverCardDismissal } from './useHoverCardDismissal';
import { useRoom } from '../contexts/RoomContext';

const UserCard = lazy(() => import('../UserCard'));

const cardTriggerProps = { 'aria-haspopup': 'dialog' } as const;

export type UserCardProviderProps = { children: ReactNode };

const UserCardProvider = ({ children }: UserCardProviderProps) => {
	const room = useRoom();
	const [userCardData, setUserCardData] = useState<ComponentProps<typeof UserCard> | null>(null);
	const triggerRef = useRef<Element | null>(null);
	const state = useOverlayTriggerState({});

	const { openTab } = useRoomToolbox();

	const openUserInfo = useStableCallback((username?: string) => {
		switch (room.t) {
			case 'l':
				openTab('room-info', username);
				break;

			case 'd':
				(room.uids?.length ?? 0) > 2 ? openTab('user-info-group', username) : openTab('user-info', username);
				break;

			default:
				openTab('members-list', username);
				break;
		}
	});

	const closeUserCard = useStableCallback(() => setUserCardData(null));

	const handleSetUserCard = useStableCallback((e: UIEvent, username: string) => {
		triggerRef.current = e.target as Element | null;
		state.open();
		setUserCardData({
			username,
			rid: room._id,
			onOpenUserInfo: () => openUserInfo(username),
			onClose: closeUserCard,
		});
	});

	// Every entry is identity-stable, so the message headers, avatars and mentions subscribed to the context don't re-render when a card opens or closes.
	const contextValue = useMemo(
		() => ({
			openUserCard: handleSetUserCard,
			openUserInfo,
			closeUserCard,
			triggerProps: cardTriggerProps,
		}),
		[handleSetUserCard, openUserInfo, closeUserCard],
	);

	return (
		<UserCardContext.Provider value={contextValue}>
			{children}
			{isOpen && userCardData && (
				<Suspense fallback={null}>
					<Popover placement='top left' triggerRef={triggerRef} state={state}>
						<UserCard {...userCardData} />
					</Popover>
				</Suspense>
			)}
		</UserCardContext.Provider>
	);
};

export default UserCardProvider;
