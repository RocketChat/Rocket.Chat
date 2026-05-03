import type { IMessage } from '@rocket.chat/core-typings';
import { Box, Icon } from '@rocket.chat/fuselage';
import { useMethod, useUserId, usePermission, useUserSubscription, useStream, useRoomToolbox } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

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
	const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
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

	if (!message.isImportant || !canMarkMessagesAsImportant) {
		return null;
	}

	const handleClick = () => {
		if (!showList && buttonRef.current) {
			const rect = buttonRef.current.getBoundingClientRect();
			setPosition({
				top: rect.bottom + 4,
				left: rect.left
			});
		}
		setShowList(!showList);
	};

	const handleUserClick = useCallback((username: string) => () => {
		openTab('members-list', username);
		setShowList(false);
	}, [openTab]);

	return (
		<>
			<Box mis='x4'>
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
						verticalAlign: 'middle'
					}}
				>
					<Icon name='info-circled' size='x16' />
				</Box>
			</Box>

			{showList && position && createPortal(
				<Box
					ref={listRef}
					position='fixed'
					zIndex={9999}
					style={{
						top: `${position.top}px`,
						left: `${position.left}px`,
						width: '250px',
						backgroundColor: 'var(--rcx-color-surface-tint, #f7f8fa)',
						borderRadius: '4px',
						boxShadow: '0 2px 12px 0 rgba(0, 0, 0, 0.12), 0 0 1px 0 rgba(0, 0, 0, 0.08)',
						border: '1px solid var(--rcx-color-stroke-extra-light, #ebecef)',
						padding: '12px',
						maxHeight: '300px',
						overflowY: 'auto',
						color: 'var(--rcx-color-font-default, #2f343d)'
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
										transition: 'background-color 0.2s'
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
				</Box>,
				document.body
			)}
		</>
	);
};

export default memo(ImportantMessageReadInfo);
