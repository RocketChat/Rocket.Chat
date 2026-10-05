import type { OverlayTriggerState } from '@react-stately/overlays';
import { useTooltipTriggerState } from '@react-stately/tooltip';
import type { IRoom } from '@rocket.chat/core-typings';
import { Box, Popover } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { UserCardContext } from '@rocket.chat/ui-contexts';
import type { ReactNode, UIEvent } from 'react';
import { Suspense, lazy, useMemo, useRef, useState } from 'react';

import { RoomHoverCardContext } from './RoomHoverCardContext';
import { useHoverCardDismissal } from '../../views/room/providers/useHoverCardDismissal';

const RoomHoverCard = lazy(() => import('./RoomHoverCardWithData'));

const HOVER_OPEN_DELAY = 500;
const HOVER_CLOSE_DELAY = 300;

// The card sits 0.75rem away from the room it describes; the positioning engine takes px.
const getPopoverOffset = () => 0.75 * parseFloat(window.getComputedStyle(document.documentElement).fontSize || '16');

// A tap also fires mouse events, and a card that opens half a second after tapping into a room is in the way.
const canHover = () => window.matchMedia('(hover: hover)').matches;

export type RoomHoverCardProviderProps = { children: ReactNode };

/**
 * Shows a card describing a sidebar room when the pointer rests on it: who or what it is, its last message, and the
 * actions most often taken on it from the list.
 */
const RoomHoverCardProvider = ({ children }: RoomHoverCardProviderProps) => {
	const [rid, setRid] = useState<IRoom['_id'] | null>(null);
	const triggerRef = useRef<Element | null>(null);
	const isPointerOnTriggerRef = useRef(false);

	// Hover intent: opens after a delay and lingers briefly after the pointer leaves. Once a card is showing, moving to
	// another room hands it over right away.
	const state = useTooltipTriggerState({
		delay: HOVER_OPEN_DELAY,
		closeDelay: HOVER_CLOSE_DELAY,
		onOpenChange: (open) => {
			if (!open) {
				setRid(null);
			}
		},
	});

	// The pointer left: close after the linger delay, or cancel an open still waiting on the hover delay.
	const closeRoomHoverCard = useStableCallback(() => state.close());

	// The pointer is back on the card or its room: keep it open.
	const keepRoomHoverCardOpen = useStableCallback(() => state.open(true));

	// The user asked for no card (Escape, a click on the room, an action, a scroll): close now.
	const dismissRoomHoverCard = useStableCallback(() => state.close(true));

	// Rooms sit edge to edge, so the pointer reaches the next room before it is reported leaving the previous one, or
	// the card. Only leaving the room the card now belongs to, for somewhere other than the card, closes it.
	const handleTriggerLeave = useStableCallback((e: Event) => {
		if (e.currentTarget !== triggerRef.current) {
			return;
		}

		isPointerOnTriggerRef.current = false;
		closeRoomHoverCard();
	});

	const handleCardLeave = useStableCallback(() => {
		if (!isPointerOnTriggerRef.current) {
			closeRoomHoverCard();
		}
	});

	const openRoomHoverCard = useStableCallback((e: UIEvent, nextRid: IRoom['_id']) => {
		if (!canHover()) {
			return;
		}

		const trigger = e.currentTarget;
		trigger.addEventListener('mouseleave', handleTriggerLeave, { once: true });
		isPointerOnTriggerRef.current = true;

		if (state.isOpen && rid === nextRid) {
			triggerRef.current = trigger;
			keepRoomHoverCardOpen();
			return;
		}

		// Sweeping across the list doesn't open a card: a room still waiting on the hover delay starts it over.
		if (!state.isOpen) {
			state.close(true);
		}

		triggerRef.current = trigger;
		setRid(nextRid);
		state.open(state.isOpen);
	});

	const cardRef = useHoverCardDismissal({
		onPointerEnter: keepRoomHoverCardOpen,
		onPointerLeave: handleCardLeave,
		onDismiss: dismissRoomHoverCard,
	});

	// The popover's own dismissals (a scroll of the room list) are explicit, so they close right away.
	const popoverState: OverlayTriggerState = {
		isOpen: state.isOpen,
		setOpen: (open) => (open ? state.open(true) : dismissRoomHoverCard()),
		open: () => state.open(true),
		close: dismissRoomHoverCard,
		toggle: () => (state.isOpen ? dismissRoomHoverCard() : state.open(true)),
	};

	const contextValue = useMemo(
		() => ({ openRoomHoverCard, closeRoomHoverCard: dismissRoomHoverCard }),
		[openRoomHoverCard, dismissRoomHoverCard],
	);

	// The card's call actions come from the user card, and close whatever card they were started from.
	const userCardContextValue = useMemo(
		() => ({
			openUserCard: () => undefined,
			openUserInfo: () => undefined,
			closeUserCard: dismissRoomHoverCard,
			triggerProps: {},
		}),
		[dismissRoomHoverCard],
	);

	return (
		<RoomHoverCardContext.Provider value={contextValue}>
			{children}
			{state.isOpen && rid && (
				// Non-modal: a modal popover would aria-hide the page and lock scroll for a card the pointer just passed over.
				// Keyed by room so handing the card to another room repositions it next to the new one.
				<Popover key={rid} isNonModal placement='end top' offset={getPopoverOffset()} triggerRef={triggerRef} state={popoverState}>
					<Box ref={cardRef} tabIndex={-1}>
						<UserCardContext.Provider value={userCardContextValue}>
							<Suspense fallback={null}>
								<RoomHoverCard rid={rid} onClose={dismissRoomHoverCard} />
							</Suspense>
						</UserCardContext.Provider>
					</Box>
				</Popover>
			)}
		</RoomHoverCardContext.Provider>
	);
};

export default RoomHoverCardProvider;
