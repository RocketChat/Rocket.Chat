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

	// A card opened from the keyboard takes focus and stays until dismissed; one opened by hover follows the pointer.
	const [openedByKeyboard, setOpenedByKeyboard] = useState(false);
	const openedByKeyboardRef = useRef(false);

	const openTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const closeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

	const clearCloseTimer = useCallback(() => {
		clearTimeout(closeTimerRef.current);
		closeTimerRef.current = undefined;
	}, []);

	const clearTimers = useCallback(() => {
		clearTimeout(openTimerRef.current);
		openTimerRef.current = undefined;
		clearCloseTimer();
	}, [clearCloseTimer]);

	const closingOnHoverOutRef = useRef(false);

	// Every dismissal funnels through here. Closing because the pointer left keeps a pending open alive, so moving
	// straight from an open card to another author's name still shows the next card; any other dismissal (an outside
	// click, for instance) cancels it.
	const handleOpenChange = useStableCallback((open: boolean) => {
		if (open) return;
		if (closingOnHoverOutRef.current) {
			clearCloseTimer();
		} else {
			clearTimers();
		}
		if (openedByKeyboardRef.current) {
			(triggerRef.current as HTMLElement | null)?.focus();
		}
		setUserCardData(null);
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
		closingOnHoverOutRef.current = true;
		state.close();
		closingOnHoverOutRef.current = false;
	});

	// The user asked for no card (Escape, the card's own close, an action that closes it): a pending hover
	// open must not bring one back a moment later.
	const dismissUserCard = useStableCallback(() => {
		clearTimers();
		state.close();
	});

	const handleOpenUserInfo = useStableCallback((username: string) => {
		dismissUserCard();
		openUserInfo(username);
	});

	const handleTriggerLeave = useStableCallback(() => {
		clearTimeout(openTimerRef.current);
		openTimerRef.current = undefined;
	});

	const handleSetUserCard = useStableCallback((e: UIEvent, username: string) => {
		const trigger = (e.currentTarget ?? e.target) as Element | null;

		clearTimers();

		const open = (viaKeyboard = false) => {
			triggerRef.current = trigger;
			openedByKeyboardRef.current = viaKeyboard;
			setOpenedByKeyboard(viaKeyboard);
			state.open();
			setUserCardData({
				username,
				rid: room._id,
				onOpenUserInfo: () => openUserInfo(username),
				onClose: dismissUserCard,
			});
		};

		// The keyboard and a click open right away; hover waits out the intent delay.
		if (e.type === 'keydown') {
			open(true);
			return;
		}

		if (e.type === 'click') {
			open();
			return;
		}

		trigger?.addEventListener('mouseleave', handleTriggerLeave, { once: true });
		openTimerRef.current = setTimeout(() => open(), HOVER_OPEN_DELAY);
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

			document.addEventListener('keydown', handleKeyDown, { capture: true });

			if (openedByKeyboardRef.current) {
				card.focus();
				return () => document.removeEventListener('keydown', handleKeyDown, { capture: true });
			}

			// Synthetic mouseenter/mouseleave are unreliable on a portaled popover that re-renders under a resting
			// pointer, so hover is tracked geometrically: the card stays open while the pointer is over the card, its
			// trigger, or a menu spawned from it (portaled outside the card's rect).
			const isPointerOverCard = (x: number, y: number) =>
				isPointInside(card, x, y) ||
				isPointInside(triggerRef.current, x, y) ||
				Array.from(document.querySelectorAll('[role="menu"]')).some((menu) => isPointInside(menu, x, y));

			const handleMouseMove = (e: MouseEvent) => {
				if (isPointerOverCard(e.clientX, e.clientY)) {
					clearCloseTimer();
					return;
				}

				if (closeTimerRef.current === undefined) {
					closeTimerRef.current = setTimeout(closeUserCard, HOVER_CLOSE_DELAY);
				}
			};

			const handleDocumentLeave = () => {
				clearCloseTimer();
				closeTimerRef.current = setTimeout(closeUserCard, HOVER_CLOSE_DELAY);
			};

			document.addEventListener('mousemove', handleMouseMove);
			document.documentElement.addEventListener('mouseleave', handleDocumentLeave);
			return () => {
				document.removeEventListener('mousemove', handleMouseMove);
				document.removeEventListener('keydown', handleKeyDown, { capture: true });
				document.documentElement.removeEventListener('mouseleave', handleDocumentLeave);
			};
		},
		[clearCloseTimer, closeUserCard, dismissUserCard],
	);

	const isOpen = state.isOpen && !!userCardData;

	// Only the trigger that opened the card is expanded; the shared triggerProps can't carry this state.
	useEffect(() => {
		const trigger = triggerRef.current;
		if (!isOpen || !trigger) {
			return;
		}
		trigger.setAttribute('aria-expanded', 'true');
		return () => trigger.removeAttribute('aria-expanded');
	}, [isOpen, userCardData]);

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
				// Non-modal on hover: a modal popover would aria-hide the page and lock scroll for a card the pointer just
				// passed over. Keyed by user so handing the card to another author repositions it over the new trigger,
				// and by input mode so reopening the same author's card from the keyboard switches it to keyboard mode.
				<Popover
					key={`${userCardData.username}-${openedByKeyboard ? 'keyboard' : 'pointer'}`}
					isNonModal={!openedByKeyboard}
					placement='top left'
					offset={getPopoverOffset()}
					triggerRef={triggerRef}
					state={state}
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
