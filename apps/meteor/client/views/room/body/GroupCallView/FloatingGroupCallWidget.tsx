import { css } from '@rocket.chat/css-in-js';
import { Box, IconButton, Palette } from '@rocket.chat/fuselage';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import { useGoToRoom, useUser, useUserAvatarPath } from '@rocket.chat/ui-contexts';
import { MediaCallRoomSection, useMediaCallInstance, useMediaCallView, usePeekMediaSessionState } from '@rocket.chat/ui-voip';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useRoomInfoEndpoint } from '../../../../hooks/useRoomInfoEndpoint';
import { useOpenedRoom } from '../../../../lib/RoomManager';

const DEFAULT_WIDTH = 480;
const DEFAULT_HEIGHT = 360;
const MIN_WIDTH = 280;
const MIN_HEIGHT = 220;
const VIEWPORT_PADDING = 8;

const containerStyles = css`
	position: fixed;
	z-index: 1000;
	background-color: ${Palette.surface['surface-tint'].toString()};
	border-radius: 8px;
	box-shadow:
		0 16px 40px rgba(0, 0, 0, 0.35),
		0 4px 8px rgba(0, 0, 0, 0.25);
	overflow: hidden;
	display: flex;
	flex-direction: column;
	/* CSS-native resize handle in the bottom-right corner. */
	resize: both;
`;

const headerStyles = css`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	height: 32px;
	padding: 0 4px 0 12px;
	background-color: rgba(0, 0, 0, 0.45);
	color: white;
	font-size: 12px;
	line-height: 32px;
	flex-shrink: 0;
	cursor: grab;
	user-select: none;

	&:active {
		cursor: grabbing;
	}
`;

const titleStyles = css`
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	flex: 1 1 auto;
`;

const clampToViewport = (x: number, y: number, w: number, h: number) => {
	const maxX = Math.max(0, window.innerWidth - w - VIEWPORT_PADDING);
	const maxY = Math.max(0, window.innerHeight - h - VIEWPORT_PADDING);
	return {
		x: Math.min(Math.max(VIEWPORT_PADDING, x), maxX),
		y: Math.min(Math.max(VIEWPORT_PADDING, y), maxY),
	};
};

/**
 * Floating mini-view of the active group call, shown when the user has
 * navigated away from the call's room. Reuses MediaCallRoomSection (same UI as
 * the in-room view) so all controls / participant tiles / speaking indicators
 * / raise-hand work identically — they share the app-level MediaCallViewContext
 * supplied by LiveKitMediaCallProvider.
 *
 * Visibility is driven by `useOpenedRoom()` (which reflects the currently-open
 * room from the route, not the React tree), so MediaCallRoomSection's own
 * useRoomView() can't cause a mount/unmount feedback loop.
 */
const FloatingGroupCallWidget = () => {
	const { instance: session } = useMediaCallInstance();
	const sessionState = usePeekMediaSessionState();
	const { sessionState: viewSession } = useMediaCallView();
	const openedRoomId = useOpenedRoom();
	const goToRoom = useGoToRoom();
	const user = useUser();
	const displayName = useUserDisplayName({ name: user?.name, username: user?.username });
	const getUserAvatarPath = useUserAvatarPath();

	const rid = (session?.getState(false)?.call as { rid?: string } | undefined)?.rid;
	const shouldShow = sessionState === 'ongoing' && Boolean(rid) && rid !== openedRoomId && viewSession.state === 'ongoing';

	const ownUser = useMemo(
		() => ({
			id: user?._id || 'local',
			displayName: displayName || '',
			avatarUrl: getUserAvatarPath({ userId: user?._id || '' }),
		}),
		[displayName, getUserAvatarPath, user?._id],
	);

	// Pull the room name to label the widget. React Query keeps this cached
	// across renders so the lookup is essentially free.
	const { data: roomInfo } = useRoomInfoEndpoint(rid ?? '', { enabled: Boolean(rid) });
	const roomName = roomInfo?.room?.fname || roomInfo?.room?.name || '';
	const title = roomName ? `Call · ${roomName}` : 'Call in progress';

	// Position + size state. Initialised lazily so we don't read `window`
	// during the first paint; clamp on resize so the widget never leaves the
	// viewport even if the user shrinks the page.
	const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
	const [size, setSize] = useState<{ w: number; h: number }>({ w: DEFAULT_WIDTH, h: DEFAULT_HEIGHT });
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (typeof window === 'undefined' || pos) return;
		// Default to bottom-right.
		setPos({
			x: Math.max(VIEWPORT_PADDING, window.innerWidth - size.w - 24),
			y: Math.max(VIEWPORT_PADDING, window.innerHeight - size.h - 24),
		});
	}, [pos, size.w, size.h]);

	useEffect(() => {
		const onResize = () => {
			setPos((p) => (p ? clampToViewport(p.x, p.y, size.w, size.h) : p));
		};
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	}, [size.w, size.h]);

	// Watch the container's own size (CSS resize edits style.width/height
	// directly, which React doesn't see). ResizeObserver keeps our state in
	// sync so position clamping uses the right dimensions after a manual
	// resize.
	useEffect(() => {
		const el = containerRef.current;
		if (!el || typeof ResizeObserver === 'undefined') return;
		const ro = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const { width, height } = entry.contentRect;
				setSize((prev) => (prev.w === width && prev.h === height ? prev : { w: width, h: height }));
			}
		});
		ro.observe(el);
		return () => ro.disconnect();
	}, [shouldShow]);

	const onHeaderPointerDown = useCallback(
		(e: React.PointerEvent) => {
			// Don't start a drag from a button click inside the header.
			if ((e.target as HTMLElement).closest('button')) return;
			e.preventDefault();
			if (!pos) return;
			const startX = e.clientX;
			const startY = e.clientY;
			const startPos = pos;
			const onMove = (ev: PointerEvent) => {
				setPos(clampToViewport(startPos.x + (ev.clientX - startX), startPos.y + (ev.clientY - startY), size.w, size.h));
			};
			const onUp = () => {
				window.removeEventListener('pointermove', onMove);
				window.removeEventListener('pointerup', onUp);
			};
			window.addEventListener('pointermove', onMove);
			window.addEventListener('pointerup', onUp);
		},
		[pos, size.w, size.h],
	);

	if (!shouldShow || !pos) return null;

	const onExpand = () => {
		if (rid) void goToRoom(rid);
	};

	return (
		<Box
			ref={containerRef}
			className={containerStyles}
			style={{
				left: pos.x,
				top: pos.y,
				width: size.w,
				height: size.h,
				minWidth: MIN_WIDTH,
				minHeight: MIN_HEIGHT,
				maxWidth: `calc(100vw - ${VIEWPORT_PADDING * 2}px)`,
				maxHeight: `calc(100vh - ${VIEWPORT_PADDING * 2}px)`,
			}}
		>
			<Box className={headerStyles} onPointerDown={onHeaderPointerDown}>
				<Box is='span' className={titleStyles}>
					{title}
				</Box>
				<IconButton icon='arrow-expand' tiny title='Open call room' onClick={onExpand} />
			</Box>
			<Box flexGrow={1} minHeight={0} display='flex' flexDirection='column'>
				<MediaCallRoomSection showChat={false} onToggleChat={() => undefined} user={ownUser} hideChatToggle />
			</Box>
		</Box>
	);
};

export default memo(FloatingGroupCallWidget);
