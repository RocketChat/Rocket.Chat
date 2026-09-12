import { useOverlayTrigger } from '@react-aria/overlays';
import { useOverlayTriggerState } from '@react-stately/overlays';
import { Popover } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useRoomToolbox, UserCardContext } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactNode, UIEvent } from 'react';
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useRoom } from '../contexts/RoomContext';

const UserCard = lazy(() => import('../UserCard'));

export type UserCardProviderProps = { children: ReactNode };

/**
 * Creates a stable proxy DOM element that is appended to document.body
 * and whose getBoundingClientRect is permanently frozen to the rect of
 * the element that was clicked. This prevents react-aria's usePopover /
 * useOverlayPosition from jumping to (0, 0) when the real trigger element
 * is recycled or unmounted by react-virtuoso during scroll.
 */
function createFrozenProxy(rect: DOMRect): HTMLDivElement {
	const proxy = document.createElement('div');

	// Position the proxy so it exactly matches the trigger in the viewport.
	// Using position:fixed means we don't need to account for scroll offsets.
	proxy.style.cssText = `
		position: fixed;
		top: ${rect.top}px;
		left: ${rect.left}px;
		width: ${rect.width}px;
		height: ${rect.height}px;
		pointer-events: none;
		opacity: 0;
		z-index: -9999;
	`;

	// Override getBoundingClientRect so react-aria always gets the frozen rect,
	// even after the real trigger element has been recycled or unmounted.
	proxy.getBoundingClientRect = () => rect;

	document.body.appendChild(proxy);
	return proxy;
}

const UserCardProvider = ({ children }: UserCardProviderProps) => {
	const room = useRoom();
	const [userCardData, setUserCardData] = useState<ComponentProps<typeof UserCard> | null>(null);

	const triggerRef = useRef<Element | null>(null);
	const proxyRef = useRef<HTMLDivElement | null>(null);

	const state = useOverlayTriggerState({});
	const { triggerProps, overlayProps } = useOverlayTrigger({ type: 'dialog' }, state, triggerRef);
	delete triggerProps.onPress;

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

	const removeProxy = useCallback(() => {
		if (proxyRef.current) {
			proxyRef.current.parentNode?.removeChild(proxyRef.current);
			proxyRef.current = null;
		}
	}, []);

	const handleCloseUserCard = useCallback(() => {
		removeProxy();
		state.close();
		setUserCardData(null);
	}, [removeProxy, state]);

	const handleSetUserCard = useCallback(
		(e: UIEvent, username: string) => {
			removeProxy();

			const clickedEl = (e.currentTarget || e.target) as Element | null;
			const rect = clickedEl?.getBoundingClientRect() ?? new DOMRect();
			const proxy = createFrozenProxy(rect);
			proxyRef.current = proxy;
			triggerRef.current = proxy;

			state.open();
			setUserCardData({
				username,
				rid: room._id,
				onOpenUserInfo: () => openUserInfo(username),
				onClose: handleCloseUserCard,
			});
		},
		[handleCloseUserCard, openUserInfo, removeProxy, room._id, state],
	);

	useEffect(() => {
		if (!state.isOpen) {
			removeProxy();
		}
		return () => {
			removeProxy();
		};
	}, [removeProxy, state.isOpen]);

	const contextValue = useMemo(
		() => ({
			openUserCard: handleSetUserCard,
			closeUserCard: handleCloseUserCard,
			triggerProps,
			triggerRef,
			state,
		}),
		[handleCloseUserCard, handleSetUserCard, state, triggerProps],
	);

	return (
		<UserCardContext.Provider value={contextValue}>
			{children}
			{state.isOpen && userCardData && (
				<Suspense fallback={null}>
					<Popover placement='top left' triggerRef={triggerRef} state={state}>
						<UserCard {...userCardData} {...overlayProps} />
					</Popover>
				</Suspense>
			)}
		</UserCardContext.Provider>
	);
};

export default UserCardProvider;
