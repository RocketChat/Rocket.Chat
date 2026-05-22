import type { IMessage } from '@rocket.chat/core-typings';
import { Box, Icon } from '@rocket.chat/fuselage';
import { useMethod, useUserId, usePermission, useUserSubscription, useStream, useRoomToolbox } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { memo, useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';

const LIST_GAP_PX = 4;
const LIST_MAX_HEIGHT_PX = 300;
const LIST_MIN_HEIGHT_PX = 80;
const LIST_ESTIMATE_HEIGHT_PX = 120;

const getComposerTop = (button: HTMLElement): number => {
	const composer = button.closest('.messages-container-main')?.querySelector('footer.rc-message-box');
	return composer?.getBoundingClientRect().top ?? window.innerHeight;
};

const getScrollViewport = (element: HTMLElement | null): HTMLElement | null => {
	let node = element?.parentElement ?? null;

	while (node) {
		if (node.classList.contains('os-viewport')) {
			return node;
		}

		const { overflowY } = getComputedStyle(node);

		if (overflowY === 'auto' || overflowY === 'scroll') {
			return node;
		}

		node = node.parentElement;
	}

	return null;
};

type ImportantMessageReadInfoProps = {
	message: IMessage;
};

type User = {
	_id: string;
	username: string;
	name?: string;
};

const ImportantMessageReadInfo = ({ message }: ImportantMessageReadInfoProps): ReactElement | null => {
	const [showList, setShowList] = useState(false);
	const [listPlacement, setListPlacement] = useState<'below' | 'above'>('below');
	const [listMaxHeight, setListMaxHeight] = useState(LIST_MAX_HEIGHT_PX);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const listRef = useRef<HTMLDivElement>(null);
	const getUsersWhoRead = useMethod('getUsersWhoReadImportantMessage');
	const getUserRoomRole = useMethod('getUserRoomRole');
	const userId = useUserId();
	const subscription = useUserSubscription(message.rid);
	const queryClient = useQueryClient();
	const subscribeToRoomMessages = useStream('room-messages');
	const subscribeToNotifyRoom = useStream('notify-room');
	const { openTab } = useRoomToolbox();

	useEffect(() => {
		const unsubscribeMessages = subscribeToRoomMessages(message.rid, (msg) => {
			if (msg._id === message._id && msg.importantReadBy) {
				queryClient.setQueryData(['important-message-readers', message._id], (old: User[] | undefined) => {
					return old;
				});
				void queryClient.refetchQueries({ 
					queryKey: ['important-message-readers', message._id],
					type: 'active'
				});
			}
		});

		const unsubscribeRoom = subscribeToNotifyRoom(`${message.rid}/subscriptions-changed`, () => {
			void queryClient.refetchQueries({ 
				queryKey: ['important-message-readers', message._id],
				type: 'active'
			});
		});
		
		return () => {
			unsubscribeMessages();
			unsubscribeRoom();
		};
	}, [subscribeToRoomMessages, subscribeToNotifyRoom, message.rid, message._id, queryClient]);

	useEffect(() => {
		if (!showList) return;

		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as HTMLElement;
			
			if (target.closest('[data-important-message-controls]')) {
				return;
			}
			
			if (buttonRef.current && buttonRef.current.contains(target)) {
				return;
			}
			
			if (listRef.current && listRef.current.contains(target)) {
				return;
			}
			
			setShowList(false);
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [showList]);

	const updateListPlacement = useCallback(() => {
		const button = buttonRef.current;

		if (!button) {
			return;
		}

		const buttonRect = button.getBoundingClientRect();
		const composerTop = getComposerTop(button);
		const spaceBelow = composerTop - buttonRect.bottom - LIST_GAP_PX;
		const spaceAbove = buttonRect.top - LIST_GAP_PX;
		const listHeight = listRef.current?.offsetHeight ?? LIST_ESTIMATE_HEIGHT_PX;
		const openAbove = spaceBelow < listHeight && spaceAbove > spaceBelow;

		if (openAbove) {
			setListPlacement('above');
			setListMaxHeight(Math.max(LIST_MIN_HEIGHT_PX, Math.min(LIST_MAX_HEIGHT_PX, spaceAbove)));
			return;
		}

		setListPlacement('below');
		setListMaxHeight(Math.max(LIST_MIN_HEIGHT_PX, Math.min(LIST_MAX_HEIGHT_PX, spaceBelow)));
	}, []);

	const { data: hasRoleFromQuery = false } = useQuery({
		queryKey: ['user-room-role-info', userId, message.rid, 'important-message-marker'],
		queryFn: async () => {
			if (!userId) return false;
			try {
				const result = await getUserRoomRole(message.rid, userId, 'important-message-marker');
				return result ?? false;
			} catch (error) {
				return false;
			}
		},
		staleTime: 0,
		enabled: !!userId,
	});

	const hasPermission = usePermission('mark-message-as-important', message.rid);
	const hasRole = subscription?.roles?.includes('important-message-marker') ?? hasRoleFromQuery;
	const canMarkMessagesAsImportant = hasPermission || hasRole;

	const { data: readUsers = [], isLoading: isLoadingRead } = useQuery<User[]>({
		queryKey: ['important-message-readers', message._id],
		queryFn: async () => {
			try {
				const result = await getUsersWhoRead(message._id);
				return result || [];
			} catch (error) {
				console.error('Error fetching users who read:', error);
				return [];
			}
		},
		enabled: showList,
		refetchInterval: showList ? 5000 : false,
		staleTime: 0,
	});

	const readCount = readUsers.length;

	useLayoutEffect(() => {
		if (!showList) {
			return;
		}

		updateListPlacement();

		const frame = requestAnimationFrame(updateListPlacement);
		const scrollViewport = getScrollViewport(buttonRef.current);
		const handleReposition = (): void => {
			updateListPlacement();
		};

		scrollViewport?.addEventListener('scroll', handleReposition, { passive: true });
		window.addEventListener('resize', handleReposition);

		return () => {
			cancelAnimationFrame(frame);
			scrollViewport?.removeEventListener('scroll', handleReposition);
			window.removeEventListener('resize', handleReposition);
		};
	}, [showList, readUsers.length, isLoadingRead, updateListPlacement]);

	if (!message.isImportant || !canMarkMessagesAsImportant) {
		return null;
	}

	const handleClick = () => {
		setShowList((prev) => !prev);
	};

	const handleUserClick = useCallback((username: string) => () => {
		openTab('members-list', username);
		setShowList(false);
	}, [openTab]);

	return (
		<Box mis='x4' position='relative' display='inline-flex'>
			<Box
				is='button'
				ref={buttonRef}
				onClick={handleClick}
				title='Read by information'
				data-important-message-info-button
				style={{
					background: 'none',
					border: 'none',
					cursor: 'pointer',
					padding: '2px 4px',
					display: 'inline-flex',
					alignItems: 'center',
					verticalAlign: 'middle',
				}}
			>
				<Icon name='info-circled' size='x16' />
			</Box>

			{showList && (
				<Box
					ref={listRef}
					position='absolute'
					zIndex={9999}
					style={{
						...(listPlacement === 'above'
							? { bottom: `calc(100% + ${LIST_GAP_PX}px)`, top: 'auto' }
							: { top: `calc(100% + ${LIST_GAP_PX}px)`, bottom: 'auto' }),
						left: 0,
						width: '250px',
						backgroundColor: 'var(--rcx-color-surface-tint, #f7f8fa)',
						borderRadius: '4px',
						boxShadow: '0 2px 12px 0 rgba(0, 0, 0, 0.12), 0 0 1px 0 rgba(0, 0, 0, 0.08)',
						border: '1px solid var(--rcx-color-stroke-extra-light, #ebecef)',
						padding: '12px',
						maxHeight: `${listMaxHeight}px`,
						overflowY: 'auto',
						color: 'var(--rcx-color-font-default, #2f343d)',
					}}
					data-important-message-list
				>
					<Box fontWeight='700' mbe='x8' fontSize='p2'>
						Read by ({readCount})
					</Box>

					{isLoadingRead ? (
						<Box>Loading...</Box>
					) : readUsers.length > 0 ? (
						<Box>
							{readUsers.map((user) => (
								<Box
									key={user._id}
									mbe='x4'
									fontSize='p2'
									onClick={handleUserClick(user.username)}
									style={{
										cursor: 'pointer',
										padding: '4px',
										borderRadius: '2px',
										transition: 'background-color 0.2s',
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.backgroundColor = 'var(--rcx-color-surface-hover, #e8eaed)';
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.backgroundColor = 'transparent';
									}}
								>
									@{user.username} {user.name && `(${user.name})`}
								</Box>
							))}
						</Box>
					) : (
						<Box fontSize='p2'>No one has read this message yet</Box>
					)}
				</Box>
			)}
		</Box>
	);
};

export default memo(ImportantMessageReadInfo);
