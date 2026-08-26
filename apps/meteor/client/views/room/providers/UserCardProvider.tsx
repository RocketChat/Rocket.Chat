import { useOverlayTriggerState } from '@react-stately/overlays';
import { Box, Popover } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useRoomToolbox, UserCardContext } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactNode, UIEvent } from 'react';
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useRoom } from '../contexts/RoomContext';

const UserCard = lazy(() => import('../UserCard'));

const HOVER_OPEN_DELAY = 500;
const HOVER_CLOSE_DELAY = 300;

// Anchored elements sit 0.25rem (4px at the default root font size) away
// from their trigger. The positioning engine takes px, so the offset is
// derived from the current root font size to stay rem-based.
const getPopoverOffset = () => 0.25 * parseFloat(window.getComputedStyle(document.documentElement).fontSize || '16');

// Static trigger attributes shared by every trigger in the room. Stateful
// attributes (aria-expanded/aria-controls) are deliberately left out: with a
// single provider serving hundreds of triggers, they would be announced on
// all of them whenever any one card opens.
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
	const cardRef = useRef<HTMLElement | null>(null);
	const openedViaKeyboardRef = useRef(false);

	const openTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const closeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

	const clearTimers = useCallback(() => {
		clearTimeout(openTimerRef.current);
		clearTimeout(closeTimerRef.current);
		openTimerRef.current = undefined;
		closeTimerRef.current = undefined;
	}, []);

	// Single close path for every dismissal (Escape, outside interaction,
	// hover-out tracking and programmatic closes all funnel through here).
	const handleOpenChange = useStableCallback((open: boolean) => {
		if (open) return;
		clearTimers();
		setUserCardData(null);
		if (openedViaKeyboardRef.current) {
			openedViaKeyboardRef.current = false;
			(triggerRef.current as HTMLElement | null)?.focus?.();
		}
	});

	const state = useOverlayTriggerState({ onOpenChange: handleOpenChange });

	useEffect(() => clearTimers, [clearTimers]);

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

	const closeUserCard = useStableCallback(() => {
		state.close();
	});

	// Opens the full profile straight from a message trigger (avatar/name
	// click), dismissing any pending or open card on the way.
	const handleOpenUserInfo = useStableCallback((username?: string) => {
		clearTimers();
		state.close();
		openUserInfo(username);
	});

	const handleTriggerLeave = useStableCallback(() => {
		// Only cancels a pending open; once the card is open, closing is
		// handled by the document mousemove tracking below.
		clearTimeout(openTimerRef.current);
		openTimerRef.current = undefined;
	});

	const handleSetUserCard = useStableCallback((e: UIEvent, username: string) => {
		const trigger = (e.currentTarget ?? e.target) as Element | null;

		clearTimers();

		const open = () => {
			triggerRef.current = trigger;
			state.open();
			setUserCardData({
				username,
				rid: room._id,
				onOpenUserInfo: () => openUserInfo(username),
				onClose: closeUserCard,
			});
		};

		if (e.type === 'click' || e.type === 'keydown') {
			openedViaKeyboardRef.current = e.type === 'keydown';
			open();
			return;
		}

		openedViaKeyboardRef.current = false;
		trigger?.addEventListener('mouseleave', handleTriggerLeave, { once: true });
		openTimerRef.current = setTimeout(open, HOVER_OPEN_DELAY);
	});

	const isOpen = state.isOpen && !!userCardData;

	// The card content is lazy-loaded, so focus is moved on mount via a ref
	// callback rather than an effect (which could run before Suspense resolves).
	const handleCardRef = useCallback((node: HTMLElement | null) => {
		cardRef.current = node;
		if (node && openedViaKeyboardRef.current) {
			node.focus();
		}
	}, []);

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		// Synthetic mouseenter/mouseleave are unreliable on the popover (it is
		// portaled and re-renders under a resting pointer), so hover intent is
		// tracked geometrically: the card stays open while the pointer is over
		// the card, its trigger, or a menu popup spawned from the card (e.g.
		// the kebab actions menu, which is portaled outside the card's rect),
		// and closes shortly after it leaves them all.
		const isPointerOverCard = (x: number, y: number) => {
			if (isPointInside(cardRef.current, x, y) || isPointInside(triggerRef.current, x, y)) {
				return true;
			}
			return Array.from(document.querySelectorAll('[role="menu"]')).some((menu) => isPointInside(menu, x, y));
		};

		const handleMouseMove = (e: MouseEvent) => {
			// A keyboard-opened card must not be dismissed by stray pointer
			// movement; it closes via Escape, the close button or an action.
			if (openedViaKeyboardRef.current) return;
			if (isPointerOverCard(e.clientX, e.clientY)) {
				clearTimeout(closeTimerRef.current);
				closeTimerRef.current = undefined;
				return;
			}

			if (closeTimerRef.current === undefined) {
				closeTimerRef.current = setTimeout(closeUserCard, HOVER_CLOSE_DELAY);
			}
		};

		const handleDocumentLeave = () => {
			clearTimeout(closeTimerRef.current);
			closeTimerRef.current = setTimeout(closeUserCard, HOVER_CLOSE_DELAY);
		};

		// The card is a non-modal popover, so react-aria only handles Escape
		// while focus is inside it; a hover-opened card keeps focus wherever it
		// was, so Escape is also handled at the document level (WCAG 1.4.13).
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				closeUserCard();
			}
		};

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('keydown', handleKeyDown);
		document.documentElement.addEventListener('mouseleave', handleDocumentLeave);
		return () => {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('keydown', handleKeyDown);
			document.documentElement.removeEventListener('mouseleave', handleDocumentLeave);
		};
	}, [isOpen, closeUserCard]);

	// Every entry is identity-stable, so consumers subscribed to the context
	// (every message header, avatar and mention in the room) never re-render
	// because a card opened or closed elsewhere.
	const contextValue = useMemo(
		() => ({
			openUserCard: handleSetUserCard,
			openUserInfo: handleOpenUserInfo,
			closeUserCard,
			triggerProps: cardTriggerProps,
		}),
		[handleSetUserCard, handleOpenUserInfo, closeUserCard],
	);

	return (
		<UserCardContext.Provider value={contextValue}>
			{children}
			{isOpen && userCardData && (
				<Suspense fallback={null}>
					{/* isNonModal: a modal popover would aria-hide the rest of the page
					    and lock scroll — hostile to a card that opens on mere hover
					    while focus stays in the message list. */}
					<Popover isNonModal placement='top left' offset={getPopoverOffset()} triggerRef={triggerRef} state={state}>
						<Box ref={handleCardRef} tabIndex={-1}>
							<UserCard {...userCardData} />
						</Box>
					</Popover>
				</Suspense>
			)}
		</UserCardContext.Provider>
	);
};

export default UserCardProvider;
