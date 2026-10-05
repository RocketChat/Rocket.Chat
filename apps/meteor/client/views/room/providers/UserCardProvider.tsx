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

const HOVER_OPEN_DELAY = 500;
const HOVER_CLOSE_DELAY = 300;

// Anchored elements sit 0.25rem away from their trigger; the positioning engine takes px.
const getPopoverOffset = () => 0.25 * parseFloat(window.getComputedStyle(document.documentElement).fontSize || '16');

const cardTriggerProps = { 'aria-haspopup': 'dialog' } as const;

export type UserCardProviderProps = { children: ReactNode };

const UserCardProvider = ({ children }: UserCardProviderProps) => {
	const room = useRoom();
	const [userCardData, setUserCardData] = useState<ComponentProps<typeof UserCard> | null>(null);
	const triggerRef = useRef<Element | null>(null);

	// Hover intent: opens after a delay and lingers briefly after the pointer leaves. Once a card has been shown, the
	// next one opens right away, so moving from one author to another hands the card over.
	const state = useTooltipTriggerState({
		delay: HOVER_OPEN_DELAY,
		closeDelay: HOVER_CLOSE_DELAY,
		onOpenChange: (open) => {
			if (!open) {
				setUserCardData(null);
			}
		},
	});

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

	// The pointer left: close after the linger delay, or cancel an open still waiting on the hover delay.
	const closeUserCard = useStableCallback(() => state.close());

	// The pointer is back on the card or its trigger: keep it open.
	const keepUserCardOpen = useStableCallback(() => state.open(true));

	// The user asked for no card (Escape, the card's own close, an action, a scroll): close now.
	const dismissUserCard = useStableCallback(() => state.close(true));

	const handleOpenUserInfo = useStableCallback((username: string) => {
		dismissUserCard();
		openUserInfo(username);
	});

	const handleSetUserCard = useStableCallback((e: UIEvent, username: string) => {
		const trigger = (e.currentTarget ?? e.target) as Element | null;
		const viaClick = e.type === 'click';

		if (!viaClick) {
			trigger?.addEventListener('mouseleave', closeUserCard, { once: true });
		}

		// Another trigger for the user already shown (their avatar next to the name): keep the card where it is.
		if (state.isOpen && userCardData?.username === username) {
			keepUserCardOpen();
			return;
		}

		triggerRef.current = trigger;
		setUserCardData({
			username,
			rid: room._id,
			onOpenUserInfo: () => openUserInfo(username),
			onClose: dismissUserCard,
		});

		// A click, or a card already showing for another author, switches right away; otherwise hover waits.
		state.open(viaClick || state.isOpen);
	});

	const cardRef = useHoverCardDismissal({
		onPointerEnter: keepUserCardOpen,
		onPointerLeave: closeUserCard,
		onDismiss: dismissUserCard,
	});

	// The popover's own dismissals (a scroll of the list holding the trigger) are explicit, so they close right away.
	const popoverState: OverlayTriggerState = {
		isOpen: state.isOpen,
		setOpen: (open) => (open ? state.open(true) : dismissUserCard()),
		open: () => state.open(true),
		close: dismissUserCard,
		toggle: () => (state.isOpen ? dismissUserCard() : state.open(true)),
	};

	// Every entry is identity-stable, so the message headers, avatars and mentions subscribed to the context don't re-render when a card opens or closes.
	const contextValue = useMemo(
		() => ({
			openUserCard: handleSetUserCard,
			openUserInfo: handleOpenUserInfo,
			closeUserCard: dismissUserCard,
			triggerProps: cardTriggerProps,
		}),
		[handleSetUserCard, handleOpenUserInfo, dismissUserCard],
	);

	return (
		<UserCardContext.Provider value={contextValue}>
			{children}
			{state.isOpen && userCardData && (
				// Non-modal: a modal popover would aria-hide the page and lock scroll for a card the pointer just passed
				// over. Keyed by user so handing the card to another author repositions it over the new trigger.
				<Popover
					key={userCardData.username}
					isNonModal
					placement='top left'
					offset={getPopoverOffset()}
					triggerRef={triggerRef}
					state={popoverState}
				>
					<Box ref={cardRef} tabIndex={-1}>
						<Suspense fallback={null}>
							<UserCard {...userCardData} />
						</Suspense>
					</Box>
				</Popover>
			)}
		</UserCardContext.Provider>
	);
};

export default UserCardProvider;
