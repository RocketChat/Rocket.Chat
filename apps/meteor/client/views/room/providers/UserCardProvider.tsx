import type { OverlayTriggerState } from '@react-stately/overlays';
import { useTooltipTriggerState } from '@react-stately/tooltip';
import { Box, Popover } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useRoomToolbox, UserCardContext } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactNode, UIEvent } from 'react';
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useHoverCardDismissal } from './useHoverCardDismissal';
import { useRoom } from '../contexts/RoomContext';

const UserCard = lazy(() => import('../UserCard'));

const HOVER_OPEN_DELAY = 500;
const HOVER_CLOSE_DELAY = 300;

// Anchored elements sit 0.25rem away from their trigger; the positioning engine takes px.
const getPopoverOffset = () => 0.25 * parseFloat(window.getComputedStyle(document.documentElement).fontSize || '16');

const cardTriggerProps = { 'aria-haspopup': 'dialog' } as const;

const isPointInside = (el: Element | null, x: number, y: number): boolean => {
	if (!el) {
		return false;
	}
	const rect = el.getBoundingClientRect();
	return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
};

export type UserCardProviderProps = { children: ReactNode };

const UserCardProvider = ({ children }: UserCardProviderProps) => {
	const room = useRoom();
	const [userCardData, setUserCardData] = useState<ComponentProps<typeof UserCard> | null>(null);
	const triggerRef = useRef<Element | null>(null);
	// Only a click-opened card is announced on its trigger; a hover card is a pointer-only preview.
	const [openedByClick, setOpenedByClick] = useState(false);

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

		triggerRef.current = trigger;
		setOpenedByClick(viaClick);
		setUserCardData({
			username,
			rid: room._id,
			onOpenUserInfo: () => openUserInfo(username),
			onClose: dismissUserCard,
		});

		if (!viaClick) {
			trigger?.addEventListener('mouseleave', closeUserCard, { once: true });
		}

		// A click, or a card already showing for another author, switches right away; otherwise hover waits.
		state.open(viaClick || state.isOpen);
	});

	// Wires the document listeners for as long as the card is mounted.
	const handleCardRef = useCallback(
		(card: HTMLElement | null) => {
			if (!card) {
				return;
			}

			// A card opened by hover never holds focus, so react-aria's focus-scoped Escape never fires (WCAG 1.4.13).
			// Captured and stopped here so it doesn't also close an underlying contextual bar; an open menu owns Escape instead.
			const handleKeyDown = (e: KeyboardEvent) => {
				if (e.key !== 'Escape' || document.querySelector('[role="menu"]')) {
					return;
				}
				e.stopImmediatePropagation();
				dismissUserCard();
			};

			// Synthetic mouseenter/mouseleave are unreliable on a portaled popover that re-renders under a resting
			// pointer, so hover is tracked geometrically: the card stays open while the pointer is over the card, its
			// trigger, or a menu spawned from it (portaled outside the card's rect). Other menus on the page, such as the
			// composer's, only count while the card's own menu is the one open.
			const isPointerOverCard = (x: number, y: number) =>
				isPointInside(card, x, y) ||
				isPointInside(triggerRef.current, x, y) ||
				(!!card.querySelector('[aria-expanded="true"]') &&
					Array.from(document.querySelectorAll('[role="menu"]')).some((menu) => isPointInside(menu, x, y)));

			const handleMouseMove = (e: MouseEvent) => {
				if (isPointerOverCard(e.clientX, e.clientY)) {
					keepUserCardOpen();
					return;
				}
				closeUserCard();
			};

			document.addEventListener('keydown', handleKeyDown, { capture: true });
			document.addEventListener('mousemove', handleMouseMove);
			document.documentElement.addEventListener('mouseleave', closeUserCard);
			return () => {
				document.removeEventListener('keydown', handleKeyDown, { capture: true });
				document.removeEventListener('mousemove', handleMouseMove);
				document.documentElement.removeEventListener('mouseleave', closeUserCard);
			};
		},
		[keepUserCardOpen, closeUserCard, dismissUserCard],
	);

	const isOpen = state.isOpen && !!userCardData;

	// Only the trigger that opened the card is expanded; the shared triggerProps can't carry this state.
	useEffect(() => {
		const trigger = triggerRef.current;
		if (!isOpen || !openedByClick || !trigger) {
			return;
		}
		trigger.setAttribute('aria-expanded', 'true');
		return () => trigger.removeAttribute('aria-expanded');
	}, [isOpen, openedByClick, userCardData]);

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
			{isOpen && userCardData && (
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
					<Box ref={handleCardRef} tabIndex={-1}>
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
