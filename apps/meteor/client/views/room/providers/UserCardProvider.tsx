import type { OverlayTriggerState } from '@react-stately/overlays';
import { useTooltipTriggerState } from '@react-stately/tooltip';
import { Box, Popover } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useRoomToolbox, UserCardContext } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactNode, UIEvent } from 'react';
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';

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
		triggerRef.current = e.currentTarget ?? e.target;
		state.open();
		setUserCardData({
			username,
			rid: room._id,
			onOpenUserInfo: () => openUserInfo(username),
			onClose: closeUserCard,
		});
	});

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
