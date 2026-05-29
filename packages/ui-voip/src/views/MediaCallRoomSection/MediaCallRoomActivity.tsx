import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import { useUser, useUserAvatarPath } from '@rocket.chat/ui-contexts';
import type { ComponentType, ReactNode } from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';

import MediaCallRoomSection from './MediaCallRoomSection';
import MediaCallViewProvider from '../../providers/MediaCallViewProvider';

type MediaCallRoomActivityProps = {
	children: ReactNode;
	/**
	 * Provider that populates MediaCallViewContext. Default is the 1:1 session-driven
	 * provider; group calls pass a LiveKit-driven provider instead. Keeps the rest of
	 * the activity (layout, showChat, ResizeObserver, etc.) shared across both call kinds.
	 */
	provider?: ComponentType<{ children: ReactNode }>;
};

const MIN_CALL_HEIGHT_PCT = 20;
const MAX_CALL_HEIGHT_PCT = 80;
const DEFAULT_CALL_HEIGHT_PCT = 50;

// Visible drag handle between the call stage and the chat. Mirrors patterns
// like Google Meet's resize and the IDE-style split panels.
const dividerStyles = css`
	position: relative;
	flex: 0 0 6px;
	cursor: row-resize;
	background-color: ${Palette.stroke['stroke-extra-light'].toString()};
	transition: background-color 120ms ease;

	&::after {
		content: '';
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 32px;
		height: 2px;
		background-color: ${Palette.stroke['stroke-medium'].toString()};
		border-radius: 2px;
	}

	&:hover,
	&:active {
		background-color: ${Palette.stroke['stroke-medium'].toString()};
	}
`;

const MediaCallRoomActivity = ({ children, provider = MediaCallViewProvider }: MediaCallRoomActivityProps) => {
	const Provider = provider;
	const [showChat, setShowChat] = useState(true);
	const [callHeightPct, setCallHeightPct] = useState(DEFAULT_CALL_HEIGHT_PCT);
	const user = useUser();

	const displayName = useUserDisplayName({ name: user?.name, username: user?.username });
	const getUserAvatarPath = useUserAvatarPath();

	const containerRef = useRef<HTMLDivElement>(null);

	const ownUser = useMemo(() => {
		return {
			id: user?._id || 'local',
			displayName: displayName || '',
			avatarUrl: getUserAvatarPath({ userId: user?._id || '' }),
		};
	}, [displayName, getUserAvatarPath, user?._id]);

	const onClickToggleChat = useCallback(() => {
		setShowChat((prev) => !prev);
	}, []);

	const onDividerPointerDown = useCallback((e: React.PointerEvent) => {
		e.preventDefault();
		const container = containerRef.current;
		if (!container) return;
		const rect = container.getBoundingClientRect();
		const onMove = (ev: PointerEvent) => {
			const pct = ((ev.clientY - rect.top) / rect.height) * 100;
			const clamped = Math.max(MIN_CALL_HEIGHT_PCT, Math.min(MAX_CALL_HEIGHT_PCT, pct));
			setCallHeightPct(clamped);
		};
		const onUp = () => {
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
			document.body.style.cursor = '';
			document.body.style.userSelect = '';
		};
		document.body.style.cursor = 'row-resize';
		document.body.style.userSelect = 'none';
		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
	}, []);

	return (
		<Box w='full' h='full' display='flex' flexDirection='column' ref={containerRef} minHeight={0}>
			<Box w='full' display='flex' minHeight={0} style={{ height: showChat ? `${callHeightPct}%` : '100%' }}>
				<Provider>
					<MediaCallRoomSection showChat={showChat} onToggleChat={onClickToggleChat} user={ownUser} />
				</Provider>
			</Box>

			{showChat && (
				<>
					<Box className={dividerStyles} onPointerDown={onDividerPointerDown} role='separator' aria-orientation='horizontal' />
					<Box w='full' display='flex' flexDirection='column' minHeight={0} style={{ height: `${100 - callHeightPct}%` }}>
						{children}
					</Box>
				</>
			)}
		</Box>
	);
};

export default MediaCallRoomActivity;
