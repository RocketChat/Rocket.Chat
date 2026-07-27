import { useOverlayTrigger } from '@react-aria/overlays';
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
	const state = useOverlayTriggerState({});
	const { triggerProps, overlayProps } = useOverlayTrigger({ type: 'dialog' }, state, triggerRef);
	delete triggerProps.onPress;

	const openTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const closeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

	const clearTimers = useCallback(() => {
		clearTimeout(openTimerRef.current);
		clearTimeout(closeTimerRef.current);
		openTimerRef.current = undefined;
		closeTimerRef.current = undefined;
	}, []);

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
		clearTimers();
		setUserCardData(null);
		state.close();
	});

	const handleTriggerLeave = useStableCallback(() => {
		// Only cancels a pending open; once the card is open, closing is
		// handled by the document mousemove tracking below.
		clearTimeout(openTimerRef.current);
		openTimerRef.current = undefined;
	});

	const handleSetUserCard = useCallback(
		(e: UIEvent, username: string) => {
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

			if (e.type === 'click') {
				open();
				return;
			}

			trigger?.addEventListener('mouseleave', handleTriggerLeave, { once: true });
			openTimerRef.current = setTimeout(open, HOVER_OPEN_DELAY);
		},
		[clearTimers, handleTriggerLeave, closeUserCard, openUserInfo, room._id, state],
	);

	const isOpen = state.isOpen && !!userCardData;

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

		document.addEventListener('mousemove', handleMouseMove);
		document.documentElement.addEventListener('mouseleave', handleDocumentLeave);
		return () => {
			document.removeEventListener('mousemove', handleMouseMove);
			document.documentElement.removeEventListener('mouseleave', handleDocumentLeave);
		};
	}, [isOpen, closeUserCard]);

	const contextValue = useMemo(
		() => ({
			openUserCard: handleSetUserCard,
			closeUserCard,
			triggerProps,
			triggerRef,
			state,
		}),
		[handleSetUserCard, closeUserCard, state, triggerProps],
	);

	return (
		<UserCardContext.Provider value={contextValue}>
			{children}
			{isOpen && userCardData && (
				<Suspense fallback={null}>
					<Popover placement='top left' triggerRef={triggerRef} state={state}>
						<Box ref={cardRef}>
							<UserCard {...userCardData} {...overlayProps} />
						</Box>
					</Popover>
				</Suspense>
			)}
		</UserCardContext.Provider>
	);
};

export default UserCardProvider;
