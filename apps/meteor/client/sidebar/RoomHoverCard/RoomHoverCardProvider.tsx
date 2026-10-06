import type { OverlayTriggerState } from '@react-stately/overlays';
import type { IRoom } from '@rocket.chat/core-typings';
import { Box, Popover } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { UserCardContext } from '@rocket.chat/ui-contexts';
import type { ReactNode, UIEvent } from 'react';
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';

import { RoomHoverCardContext } from './RoomHoverCardContext';
import { RoomHoverCardSurfaceContext } from './RoomHoverCardSurfaceContext';
import { useHoverCardDismissal } from '../../views/room/providers/useHoverCardDismissal';

const loadRoomHoverCard = () => import('./RoomHoverCardWithData');
const RoomHoverCard = lazy(loadRoomHoverCard);

const HOVER_OPEN_DELAY = 500;
const HOVER_CLOSE_DELAY = 300;

// The card sits 0.75rem away from the room it describes; the positioning engine takes px.
const getPopoverOffset = () => 0.75 * parseFloat(window.getComputedStyle(document.documentElement).fontSize || '16');

// A tap also fires mouse events, and a card that opens half a second after tapping into a room is in the way.
const canHover = () => window.matchMedia('(hover: hover)').matches;

type PointerState = {
	// The room the pointer is on, if any.
	trigger: Element | null;
	onCard: boolean;
	openTimer?: ReturnType<typeof setTimeout>;
	closeTimer?: ReturnType<typeof setTimeout>;
};

export type RoomHoverCardProviderProps = { children: ReactNode };

/**
 * Shows a card describing a sidebar room when the pointer rests on it: who or what it is, its last message, its
 * unread threads, and the actions most often taken on it from the list.
 */
const RoomHoverCardProvider = ({ children }: RoomHoverCardProviderProps) => {
	const [rid, setRid] = useState<IRoom['_id'] | null>(null);
	const shownRidRef = useRef<IRoom['_id'] | null>(null);
	const triggerRef = useRef<Element | null>(null);
	const pointer = useRef<PointerState>({ trigger: null, onCard: false });

	const cancelOpen = useStableCallback(() => {
		clearTimeout(pointer.current.openTimer);
		pointer.current.openTimer = undefined;
	});

	const cancelClose = useStableCallback(() => {
		clearTimeout(pointer.current.closeTimer);
		pointer.current.closeTimer = undefined;
	});

	const show = useStableCallback((nextRid: IRoom['_id'] | null, trigger: Element | null = null) => {
		pointer.current.onCard = false;
		shownRidRef.current = nextRid;
		triggerRef.current = trigger;
		setRid(nextRid);
	});

	// The user asked for no card (Escape, a click on the room, an action, a scroll): close now.
	const dismissRoomHoverCard = useStableCallback(() => {
		cancelOpen();
		cancelClose();
		show(null);
	});

	// The pointer left the room and the card: close after a short linger, so it can still be reached.
	const closeAfterLinger = useStableCallback(() => {
		if (!shownRidRef.current || pointer.current.closeTimer) {
			return;
		}
		pointer.current.closeTimer = setTimeout(() => {
			pointer.current.closeTimer = undefined;
			show(null);
		}, HOVER_CLOSE_DELAY);
	});

	// Rooms sit edge to edge, so the pointer reaches the next room before it is reported leaving the previous one, or
	// the card. A leave only counts for the room the pointer is still on.
	const handleTriggerLeave = useStableCallback((e: Event) => {
		if (e.currentTarget !== pointer.current.trigger) {
			return;
		}

		pointer.current.trigger = null;
		cancelOpen();

		if (!pointer.current.onCard) {
			closeAfterLinger();
		}
	});

	// Every card waits for the pointer to rest on its room, including when another card is showing: that one stays
	// until then, so crossing other rooms on the way to it doesn't swap it out.
	const openRoomHoverCard = useStableCallback((e: UIEvent, nextRid: IRoom['_id']) => {
		if (!canHover()) {
			return;
		}

		// Loaded while the delay runs, so the first card doesn't take the delay plus a chunk download.
		void loadRoomHoverCard();

		const trigger = e.currentTarget;
		trigger.addEventListener('mouseleave', handleTriggerLeave, { once: true });
		pointer.current.trigger = trigger;

		cancelClose();
		cancelOpen();

		if (nextRid === shownRidRef.current) {
			triggerRef.current = trigger;
			return;
		}

		pointer.current.openTimer = setTimeout(() => {
			pointer.current.openTimer = undefined;
			show(nextRid, trigger);
		}, HOVER_OPEN_DELAY);
	});

	// Reaching the card keeps it, and drops any room the pointer crossed on the way.
	const handleCardEnter = useStableCallback(() => {
		pointer.current.onCard = true;
		cancelClose();
		cancelOpen();
	});

	const handleCardLeave = useStableCallback(() => {
		pointer.current.onCard = false;

		if (!pointer.current.trigger) {
			closeAfterLinger();
		}
	});

	useEffect(
		() => () => {
			cancelOpen();
			cancelClose();
		},
		[cancelOpen, cancelClose],
	);

	const cardRef = useHoverCardDismissal({
		onPointerEnter: handleCardEnter,
		onPointerLeave: handleCardLeave,
		onDismiss: dismissRoomHoverCard,
	});

	// The popover's own dismissals (a scroll of the room list) are explicit, so they close right away.
	const popoverState: OverlayTriggerState = {
		isOpen: Boolean(rid),
		setOpen: (open) => !open && dismissRoomHoverCard(),
		open: () => undefined,
		close: dismissRoomHoverCard,
		toggle: dismissRoomHoverCard,
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
			{rid && (
				// Non-modal: a modal popover would aria-hide the page and lock scroll for a card the pointer just passed over.
				// Keyed by room so handing the card to another room repositions it next to the new one.
				<Popover key={rid} isNonModal placement='end top' offset={getPopoverOffset()} triggerRef={triggerRef} state={popoverState}>
					<Box ref={cardRef} tabIndex={-1}>
						<RoomHoverCardSurfaceContext.Provider value={cardRef}>
							<UserCardContext.Provider value={userCardContextValue}>
								<Suspense fallback={null}>
									<RoomHoverCard rid={rid} onClose={dismissRoomHoverCard} />
								</Suspense>
							</UserCardContext.Provider>
						</RoomHoverCardSurfaceContext.Provider>
					</Box>
				</Popover>
			)}
		</RoomHoverCardContext.Provider>
	);
};

export default RoomHoverCardProvider;
