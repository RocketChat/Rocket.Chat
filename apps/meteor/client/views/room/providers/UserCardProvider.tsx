import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { HoverCardPopover, useHoverCard } from '@rocket.chat/ui-client';
import { useRoomToolbox, UserCardContext } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { lazy, useMemo } from 'react';

import { useRoom } from '../contexts/RoomContext';

const UserCard = lazy(() => import('../UserCard'));

// Anchored elements sit 0.25rem away from their trigger; the positioning engine takes px.
const getPopoverOffset = () => 0.25 * parseFloat(window.getComputedStyle(document.documentElement).fontSize || '16');

const cardTriggerProps = { 'aria-haspopup': 'dialog' } as const;

export type UserCardProviderProps = { children: ReactNode };

const UserCardProvider = ({ children }: UserCardProviderProps) => {
	const room = useRoom();
	const hoverCard = useHoverCard<string>();
	const { open, dismiss, shownKey: username } = hoverCard;

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

	const handleOpenUserInfo = useStableCallback((username: string) => {
		dismiss();
		openUserInfo(username);
	});

	// Every entry is identity-stable, so the message headers, avatars and mentions subscribed to the context don't re-render when a card opens or closes.
	const contextValue = useMemo(
		() => ({
			openUserCard: open,
			openUserInfo: handleOpenUserInfo,
			closeUserCard: dismiss,
			triggerProps: cardTriggerProps,
		}),
		[open, handleOpenUserInfo, dismiss],
	);

	return (
		<UserCardContext.Provider value={contextValue}>
			{children}
			<HoverCardPopover hoverCard={hoverCard} placement='top left' offset={getPopoverOffset()}>
				{username && <UserCard username={username} rid={room._id} onOpenUserInfo={() => openUserInfo(username)} onClose={dismiss} />}
			</HoverCardPopover>
		</UserCardContext.Provider>
	);
};

export default UserCardProvider;
