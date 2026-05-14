import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { PointerEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { useMedsensePetRoomState } from './MedsensePetRoomState';
import { isMedsensePetEnabled, MEDSENSE_PET_ENABLED_EVENT } from './petPreference';
import { useMedsenseQueue } from '../../../hooks/medsense/useMedsenseQueue';
import { subscribeToToastMessages } from '../../../lib/toast';

type PetMood = 'idle' | 'message' | 'request' | 'status';

type PetActivity = {
	id: number;
	type: PetMood;
	title: string;
	description?: string;
};

type NotificationEventDetail = {
	notification?: {
		title?: string;
		text?: string;
		payload?: {
			name?: string;
			sender?: {
				name?: string;
				username?: string;
			};
		};
	};
};

const PET_SEEN_REQUEST_IDS_KEY = 'medsense_pet_seen_request_ids';
const PET_POSITION_KEY = 'medsense_pet_position';
const PET_SIZE = 78;
const PET_MARGIN = 12;
const PET_DRAG_THRESHOLD = 10;

type PetPosition = {
	x: number;
	y: number;
};

const defaultPetPosition = (): PetPosition => ({
	x: Math.max(PET_MARGIN, window.innerWidth - PET_SIZE - 24),
	y: Math.max(PET_MARGIN, window.innerHeight - PET_SIZE - 24),
});

const clampPetPosition = ({ x, y }: PetPosition): PetPosition => ({
	x: Math.min(Math.max(PET_MARGIN, x), Math.max(PET_MARGIN, window.innerWidth - PET_SIZE - PET_MARGIN)),
	y: Math.min(Math.max(PET_MARGIN, y), Math.max(PET_MARGIN, window.innerHeight - PET_SIZE - PET_MARGIN)),
});

const getStoredPetPosition = (): PetPosition => {
	try {
		const stored = localStorage.getItem(PET_POSITION_KEY);
		return stored ? clampPetPosition(JSON.parse(stored)) : defaultPetPosition();
	} catch {
		return defaultPetPosition();
	}
};

const getSeenRequestIds = (): Set<string> => {
	try {
		const stored = sessionStorage.getItem(PET_SEEN_REQUEST_IDS_KEY);
		return stored ? new Set(JSON.parse(stored)) : new Set();
	} catch {
		return new Set();
	}
};

const addSeenRequestIds = (ids: string[]) => {
	const current = getSeenRequestIds();
	ids.forEach((id) => current.add(id));
	sessionStorage.setItem(PET_SEEN_REQUEST_IDS_KEY, JSON.stringify([...current]));
};

const getFallbackActionTitle = (title: string): string => title.replace(/^app-[^.]+\./, '');

const petClass = css`
	position: fixed;
	right: 24px;
	bottom: 24px;
	z-index: 2147483647;
	width: 78px;
	height: 78px;
	pointer-events: none;

	@media (max-width: 520px) {
		right: 14px;
		bottom: 14px;
	}
`;

const bubbleClass = css`
	position: absolute;
	bottom: 0;
	max-width: min(300px, calc(100vw - 104px));
	width: max-content;
	padding: 10px 12px;
	border: 1px solid rgba(31, 41, 55, 0.14);
	border-radius: 8px;
	background: #ffffff;
	box-shadow: 0 10px 28px rgba(15, 23, 42, 0.18);
	color: #111827;
	font-size: 13px;
	line-height: 1.35;
	pointer-events: auto;
`;

const bubbleTitleClass = css`
	font-weight: 600;
	margin-block-end: 2px;
`;

const bubbleDescriptionClass = css`
	color: #4b5563;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const buttonClass = css`
	position: relative;
	width: 78px;
	height: 78px;
	border: 0;
	border-radius: 20px;
	background: transparent;
	box-shadow: 0 12px 30px rgba(15, 23, 42, 0.26);
	color: #ffffff;
	cursor: grab;
	touch-action: none;
	pointer-events: auto;
	transition:
		transform 160ms ease,
		box-shadow 160ms ease;

	&:hover,
	&:focus-visible {
		transform: translateY(-2px);
		box-shadow: 0 16px 34px rgba(15, 23, 42, 0.32);
	}

	&:active {
		cursor: grabbing;
	}

	&:focus-visible {
		outline: 2px solid #93c5fd;
		outline-offset: 3px;
	}
`;

const spriteClass = css`
	position: absolute;
	left: 50%;
	top: 50%;
	width: 78px;
	height: 117px;
	background-image: url('/images/medsense_pet_assets.png');
	background-repeat: no-repeat;
	background-size: 400% 400%;
	filter: drop-shadow(0 8px 12px rgba(15, 23, 42, 0.28));
	transform: translate(-50%, -51%);
	transition: transform 180ms ease;

	button:hover &,
	button:focus-visible & {
		transform: translate(-50%, -55%) rotate(-2deg);
	}
`;

const badgeClass = css`
	position: absolute;
	top: -5px;
	right: -5px;
	display: flex;
	align-items: center;
	justify-content: center;
	min-width: 20px;
	height: 20px;
	padding: 0 5px;
	border: 2px solid #ffffff;
	border-radius: 999px;
	background: #dc2626;
	color: #ffffff;
	font-size: 11px;
	font-weight: 700;
	line-height: 1;
`;

const menuClass = css`
	position: absolute;
	bottom: 0;
	display: flex;
	flex-direction: column;
	gap: 4px;
	width: min(260px, calc(100vw - 112px));
	padding: 6px;
	border: 1px solid rgba(31, 41, 55, 0.14);
	border-radius: 8px;
	background: #ffffff;
	box-shadow: 0 14px 34px rgba(15, 23, 42, 0.22);
	pointer-events: auto;
`;

const menuHeaderClass = css`
	padding: 7px 9px 8px;
	border-bottom: 1px solid rgba(31, 41, 55, 0.08);
	color: #4b5563;
	font-size: 12px;
	line-height: 1.25;
`;

const menuRoomNameClass = css`
	overflow: hidden;
	color: #111827;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

const menuButtonClass = css`
	display: block;
	width: 100%;
	padding: 9px;
	border: 0;
	border-radius: 6px;
	background: transparent;
	color: #111827;
	font-size: 13px;
	line-height: 1.2;
	text-align: start;
	cursor: pointer;
	white-space: normal;

	&:hover,
	&:focus-visible {
		background: #eef2ff;
		outline: 0;
	}

	&:disabled {
		color: #9ca3af;
		cursor: not-allowed;
		background: transparent;
	}
`;

const pulseClass = css`
	animation: medsense-pet-pulse 900ms ease-in-out 2;

	@keyframes medsense-pet-pulse {
		0%,
		100% {
			transform: translateY(0) scale(1);
		}
		50% {
			transform: translateY(-4px) scale(1.04);
		}
	}
`;

const getToastText = (message: unknown): string => {
	if (typeof message === 'string') {
		return message;
	}

	if (message instanceof Error) {
		return message.message;
	}

	return '';
};

const MedsenseNotificationPet = () => {
	const { canViewQueue, loading, requests, totalCount } = useMedsenseQueue();
	const { t } = useTranslation();
	const roomState = useMedsensePetRoomState();
	const [enabled, setEnabled] = useState(isMedsensePetEnabled);
	const [activity, setActivity] = useState<PetActivity | null>(null);
	const [unreadCount, setUnreadCount] = useState(0);
	const [menuOpen, setMenuOpen] = useState(false);
	const [position, setPosition] = useState<PetPosition>(() => (typeof window === 'undefined' ? { x: 24, y: 24 } : getStoredPetPosition()));
	const mountedAtRef = useRef(Date.now());
	const previousTotalCountRef = useRef<number | null>(null);
	const activityIdRef = useRef(0);
	const petRootRef = useRef<HTMLElement | null>(null);
	const dragStateRef = useRef<{
		pointerId: number;
		startX: number;
		startY: number;
		originX: number;
		originY: number;
		dragged: boolean;
	} | null>(null);
	const suppressNextClickRef = useRef(false);

	const mood = activity?.type ?? 'idle';
	const isActive = mood !== 'idle';
	const hasRoomActions = Boolean(roomState.roomActions?.length);
	const frameIndex = useMemo(() => {
		if (menuOpen) {
			return 10;
		}

		if (unreadCount > 0 || mood === 'request') {
			return 13;
		}

		if (mood === 'message') {
			return 12;
		}

		if (mood === 'status') {
			return 11;
		}

		return roomState.isRoomView ? 6 : 1;
	}, [menuOpen, mood, roomState.isRoomView, unreadCount]);
	const spritePosition = `${(frameIndex % 4) * 33.3333}% ${Math.floor(frameIndex / 4) * 33.3333}%`;
	const flyoutStyle = position.x < 300 ? { left: 'calc(100% + 10px)' } : { right: 'calc(100% + 10px)' };

	useEffect(() => {
		const handleEnabledChange = (event: Event) => {
			const { detail } = event as CustomEvent<{ enabled?: boolean }>;
			setEnabled(detail?.enabled ?? isMedsensePetEnabled());
		};

		window.addEventListener(MEDSENSE_PET_ENABLED_EVENT, handleEnabledChange);
		window.addEventListener('storage', handleEnabledChange);

		return () => {
			window.removeEventListener(MEDSENSE_PET_ENABLED_EVENT, handleEnabledChange);
			window.removeEventListener('storage', handleEnabledChange);
		};
	}, []);

	const announce = useCallback((nextActivity: Omit<PetActivity, 'id'>) => {
		activityIdRef.current += 1;
		setActivity({ ...nextActivity, id: activityIdRef.current });
		setUnreadCount((count) => Math.min(count + 1, 99));
	}, []);

	useEffect(() => {
		if (!canViewQueue || loading) {
			return;
		}

		const seenRequestIds = getSeenRequestIds();
		const newRequestIds = requests
			.filter((request) => new Date(request.createdAt).getTime() > mountedAtRef.current && !seenRequestIds.has(request._id))
			.map((request) => request._id);

		if (newRequestIds.length === 0) {
			return;
		}

		addSeenRequestIds(newRequestIds);

		announce({
			type: 'request',
			title: newRequestIds.length === 1 ? 'New MedSense request' : `${newRequestIds.length} new MedSense requests`,
			description: 'Queue needs attention',
		});
	}, [announce, canViewQueue, loading, requests]);

	useEffect(() => {
		if (!canViewQueue || loading) {
			return;
		}

		const previousTotalCount = previousTotalCountRef.current;
		previousTotalCountRef.current = totalCount;

		if (previousTotalCount === null || previousTotalCount === totalCount || totalCount > previousTotalCount) {
			return;
		}

		announce({
			type: 'status',
			title: 'MedSense queue updated',
			description: 'A request changed status',
		});
	}, [announce, canViewQueue, loading, totalCount]);

	useEffect(() => {
		const handleNotification = (event: Event) => {
			const { detail } = event as CustomEvent<NotificationEventDetail>;
			const { notification } = detail ?? {};
			const roomName = notification?.payload?.name || notification?.title;
			const senderName = notification?.payload?.sender?.name || notification?.payload?.sender?.username;

			announce({
				type: 'message',
				title: roomName ? `New message in ${roomName}` : 'New message',
				description: senderName ? `From ${senderName}` : notification?.text,
			});
		};

		window.addEventListener('notification', handleNotification);

		return () => window.removeEventListener('notification', handleNotification);
	}, [announce]);

	useEffect(
		() =>
			subscribeToToastMessages(({ type, message, title }) => {
				const text = getToastText(message);
				const label = title || text;

				if (!label) {
					return;
				}

				announce({
					type: type === 'error' ? 'status' : 'status',
					title: type === 'error' ? 'Webchat needs attention' : 'Webchat update',
					description: label,
				});
			}),
		[announce],
	);

	useEffect(() => {
		if (!activity) {
			return undefined;
		}

		const timeout = window.setTimeout(() => setActivity(null), 7000);

		return () => window.clearTimeout(timeout);
	}, [activity]);

	useEffect(() => {
		setMenuOpen(false);
	}, [roomState.currentRoomId, roomState.activeRequestId, roomState.isRoomView]);

	useEffect(() => {
		if (!menuOpen) {
			return undefined;
		}

		const handlePointerDown = (event: globalThis.PointerEvent) => {
			const { target } = event;
			if (target instanceof Node && petRootRef.current?.contains(target)) {
				return;
			}

			setMenuOpen(false);
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setMenuOpen(false);
			}
		};

		document.addEventListener('pointerdown', handlePointerDown);
		document.addEventListener('keydown', handleKeyDown);

		return () => {
			document.removeEventListener('pointerdown', handlePointerDown);
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [menuOpen]);

	useEffect(() => {
		const handleResize = () => {
			setPosition((current) => {
				const nextPosition = clampPetPosition(current);
				localStorage.setItem(PET_POSITION_KEY, JSON.stringify(nextPosition));
				return nextPosition;
			});
		};

		window.addEventListener('resize', handleResize);

		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const buttonTitle = useMemo(() => {
		if (roomState.isRoomView) {
			return roomState.openRequestManagement ? 'Open MedSense room menu' : 'Open MedSense room menu, no active request';
		}

		if (canViewQueue && totalCount > 0) {
			return `Open MedSense queue, ${totalCount} waiting`;
		}

		return 'Open MedSense queue';
	}, [canViewQueue, roomState.isRoomView, roomState.openRequestManagement, totalCount]);

	const handleClick = () => {
		if (suppressNextClickRef.current) {
			suppressNextClickRef.current = false;
			return;
		}

		setUnreadCount(0);
		setActivity(null);
		setMenuOpen((open) => !open);
	};

	const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
		if (event.button !== 0) {
			return;
		}

		suppressNextClickRef.current = false;
		event.currentTarget.setPointerCapture(event.pointerId);
		dragStateRef.current = {
			pointerId: event.pointerId,
			startX: event.clientX,
			startY: event.clientY,
			originX: position.x,
			originY: position.y,
			dragged: false,
		};
	};

	const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
		const dragState = dragStateRef.current;
		if (!dragState || dragState.pointerId !== event.pointerId) {
			return;
		}

		if (event.buttons === 0) {
			dragStateRef.current = null;
			return;
		}

		const deltaX = event.clientX - dragState.startX;
		const deltaY = event.clientY - dragState.startY;
		const dragDistance = Math.hypot(deltaX, deltaY);
		if (!dragState.dragged && dragDistance < PET_DRAG_THRESHOLD) {
			return;
		}

		if (!dragState.dragged) {
			dragState.dragged = true;
			setMenuOpen(false);
		}

		setPosition(clampPetPosition({ x: dragState.originX + deltaX, y: dragState.originY + deltaY }));
	};

	const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
		const dragState = dragStateRef.current;
		if (!dragState || dragState.pointerId !== event.pointerId) {
			return;
		}

		const nextPosition = clampPetPosition({
			x: dragState.originX + event.clientX - dragState.startX,
			y: dragState.originY + event.clientY - dragState.startY,
		});
		setPosition(nextPosition);
		localStorage.setItem(PET_POSITION_KEY, JSON.stringify(nextPosition));
		suppressNextClickRef.current = dragState.dragged;
		dragStateRef.current = null;

		if (event.currentTarget.hasPointerCapture(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId);
		}
	};

	const handlePointerCancel = (event: PointerEvent<HTMLButtonElement>) => {
		if (event.currentTarget.hasPointerCapture(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId);
		}

		dragStateRef.current = null;
	};

	const handleGoToQueue = () => {
		setMenuOpen(false);
		window.location.assign('/medsense/queue');
	};

	const handleOpenRequestManagement = () => {
		if (!roomState.openRequestManagement) {
			return;
		}

		setMenuOpen(false);
		roomState.openRequestManagement();
	};

	const handleRoomAction = (action: () => void) => {
		setMenuOpen(false);
		action();
	};

	const getRoomActionTitle = (title: string): string => {
		const translated = t(title);
		return translated === title ? getFallbackActionTitle(title) : translated;
	};

	if (!enabled || !document.body) {
		return null;
	}

	return createPortal(
		<Box
			className={petClass}
			ref={petRootRef}
			aria-live='polite'
			aria-atomic='true'
			data-medsense-notification-pet='true'
			style={{
				position: 'fixed',
				left: `${position.x}px`,
				top: `${position.y}px`,
				zIndex: 2147483647,
				width: `${PET_SIZE}px`,
				height: `${PET_SIZE}px`,
				pointerEvents: 'none',
			}}
		>
			{menuOpen && (
				<Box
					className={menuClass}
					data-medsense-notification-pet-menu='true'
					data-medsense-pet-room-id={roomState.currentRoomId || ''}
					data-medsense-pet-request-id={roomState.activeRequestId || ''}
					style={flyoutStyle}
				>
					<Box className={menuHeaderClass}>
						<Box fontScale='c1'>{roomState.isRoomView ? 'Current room' : 'MedSense pet'}</Box>
						<Box className={menuRoomNameClass}>{roomState.currentRoomName || roomState.currentRoomId || 'Notifications'}</Box>
					</Box>
					{roomState.isRoomView &&
						hasRoomActions &&
						roomState.roomActions.map((action) => (
							<button className={menuButtonClass} type='button' key={action.id} onClick={() => handleRoomAction(action.action)}>
								{getRoomActionTitle(action.title)}
							</button>
						))}
					{roomState.isRoomView && !hasRoomActions && (
						<button
							className={menuButtonClass}
							type='button'
							disabled={!roomState.openRequestManagement}
							title={roomState.openRequestManagement ? 'Open request management' : 'No active MedSense request in this room'}
							onClick={handleOpenRequestManagement}
						>
							{roomState.openRequestManagement ? 'Open Request Management' : 'No active request in this room'}
						</button>
					)}
					{roomState.isRoomView && hasRoomActions && !roomState.openRequestManagement && (
						<button className={menuButtonClass} type='button' disabled title='No active MedSense request in this room'>
							No active request in this room
						</button>
					)}
					<button className={menuButtonClass} type='button' onClick={handleGoToQueue}>
						Go to Queue
					</button>
				</Box>
			)}
			{activity && (
				<Box className={bubbleClass} style={flyoutStyle}>
					<Box className={bubbleTitleClass}>{activity.title}</Box>
					{activity.description && <Box className={bubbleDescriptionClass}>{activity.description}</Box>}
				</Box>
			)}
			<button
				className={[buttonClass, isActive && pulseClass].filter(Boolean).join(' ')}
				style={{
					position: 'relative',
					width: `${PET_SIZE}px`,
					height: `${PET_SIZE}px`,
					border: '0',
					background: 'transparent',
					boxShadow: 'none',
					cursor: 'grab',
					pointerEvents: 'auto',
				}}
				type='button'
				title={buttonTitle}
				aria-label={buttonTitle}
				onClick={handleClick}
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
				onPointerCancel={handlePointerCancel}
				onLostPointerCapture={handlePointerCancel}
			>
				<Box className={spriteClass} style={{ backgroundPosition: spritePosition }} />
				{unreadCount > 0 && <Box className={badgeClass}>{unreadCount}</Box>}
			</button>
		</Box>,
		document.body,
	);
};

export default MedsenseNotificationPet;
