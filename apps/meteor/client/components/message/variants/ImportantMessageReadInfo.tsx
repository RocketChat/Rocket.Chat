import type { IMessage } from '@rocket.chat/core-typings';
import { Box, Icon, TextInput } from '@rocket.chat/fuselage';
import { useMethod, useUserId, usePermission, useUserSubscription, useStream } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactElement, ChangeEvent } from 'react';
import { memo, useState, useMemo, useEffect } from 'react';

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
	const [searchText, setSearchText] = useState('');
	const getUsersWhoRead = useMethod('getUsersWhoReadImportantMessage');
	const getUserRoomRole = useMethod('getUserRoomRole');
	const userId = useUserId();
	const subscription = useUserSubscription(message.rid);
	const queryClient = useQueryClient();
	const subscribeToRoomMessages = useStream('room-messages');

	useEffect(() => {
		const unsubscribe = subscribeToRoomMessages(message.rid, (msg) => {
			if (msg._id === message._id && msg.importantReadBy) {
				queryClient.invalidateQueries({ 
					queryKey: ['important-message-readers', message._id] 
				});
			}
		});
		
		return unsubscribe;
	}, [subscribeToRoomMessages, message.rid, message._id, queryClient]);

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

	const { data: users = [], isLoading } = useQuery<User[]>({
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
	});

	const filteredUsers = useMemo(() => {
		if (!searchText.trim()) {
			return users;
		}
		const search = searchText.toLowerCase();
		return users.filter(
			(user) =>
				user.username.toLowerCase().includes(search) ||
				(user.name && user.name.toLowerCase().includes(search))
		);
	}, [users, searchText]);

	const readCount = message.importantReadBy?.length || 0;

	if (!message.isImportant || !canMarkMessagesAsImportant) {
		return null;
	}

	const handleClick = () => {
		console.log('[ImportantMessageReadInfo] Toggling list visibility:', { messageId: message._id, currentState: showList });
		setShowList(!showList);
		if (!showList) {
			setSearchText('');
		}
	};

	const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		console.log('[ImportantMessageReadInfo] Search text changed:', { messageId: message._id, searchText: value });
		setSearchText(value);
	};

	return (
		<Box mis='x4'>
			<Box
				is='button'
				onClick={handleClick}
				title='Read by information'
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

			{showList && (
				<Box
					mbs='x4'
					padding='x8'
					style={{
						backgroundColor: 'var(--rcx-color-surface-tint, #f7f8fa)',
						borderRadius: '4px',
						fontSize: '14px',
						maxWidth: '300px',
						border: '1px solid var(--rcx-color-stroke-light, #e4e7ea)',
						color: 'var(--rcx-color-font-default, #2f343d)'
					}}
				>
					<Box fontWeight='bold' mbe='x4'>
						Read by ({readCount}):
					</Box>
					
					{users.length > 3 && (
						<Box mbe='x8'>
							<TextInput
								placeholder='Search by username or name...'
								value={searchText}
								onChange={handleSearchChange}
								small
							/>
						</Box>
					)}

					{isLoading ? (
						<Box>Loading...</Box>
					) : filteredUsers.length > 0 ? (
						<Box style={{ maxHeight: '200px', overflowY: 'auto' }}>
							{filteredUsers.map((user) => (
								<Box key={user._id} mbe='x4'>
									@{user.username} {user.name && `(${user.name})`}
								</Box>
							))}
						</Box>
					) : searchText ? (
						<Box>No users found matching "{searchText}"</Box>
					) : (
						<Box>No one has read this message yet</Box>
					)}
				</Box>
			)}
		</Box>
	);
};

export default memo(ImportantMessageReadInfo);
