import type { IScheduledMessage } from '@rocket.chat/core-typings';
import { Box, Margins, States, StatesIcon, StatesTitle, StatesSubtitle, Button, ButtonGroup, Avatar, Icon } from '@rocket.chat/fuselage';
import { imperativeModal } from '@rocket.chat/ui-client';
import { useEndpoint, useTranslation, useToastMessageDispatch, useUser } from '@rocket.chat/ui-contexts';
import moment from 'moment';
import { useCallback, useEffect, useState, useRef } from 'react';

import DeleteScheduledMessageModal from './DeleteScheduledMessageModal';
import EditScheduledMessageModal from './EditScheduledMessageModal';
import { Page, PageHeader, PageScrollableContentWithShadow } from '../../../components/Page';

interface IRoomInfo {
	t: string;
	name?: string;
	usernames?: string[];
	avatar?: string;
}

const ScheduledMessagesPage = () => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const getScheduledMessages = useEndpoint('GET', '/v1/chat.getScheduledMessages');
	const getRoomInfo = useEndpoint('GET', '/v1/rooms.info');
	const updateScheduledMessage = useEndpoint('POST', '/v1/chat.updateScheduledMessage');
	const deleteScheduledMessage = useEndpoint('POST', '/v1/chat.deleteScheduledMessage');

	const [scheduledMessages, setScheduledMessages] = useState<IScheduledMessage[]>([]);
	const [loading, setLoading] = useState(true);
	const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);
	const [roomsInfo, setRoomsInfo] = useState<Record<string, IRoomInfo>>({});
	const menuRef = useRef<HTMLDivElement | null>(null);

	const user = useUser();

	const fetchScheduledMessages = useCallback(async () => {
		setLoading(true);
		try {
			const { messages = [] } = await getScheduledMessages({});

			const parsedMessages: IScheduledMessage[] = messages.map((msg) => ({
				...msg,
				ts: new Date(msg.ts),
				scheduledAt: new Date(msg.scheduledAt),
				_updatedAt: new Date(msg._updatedAt),
			}));

			setScheduledMessages(parsedMessages);

			const uniqueRids = [...new Set(messages.map((msg) => msg.rid))];
			const roomsData: Record<string, IRoomInfo> = {};

			const roomInfoPromises = uniqueRids.map(async (rid) => {
				try {
					const roomInfo = await getRoomInfo({ roomId: rid });

					if (roomInfo?.room) {
						roomsData[rid] = roomInfo.room;
					} else if (rid === 'GENERAL') {
						roomsData[rid] = { name: 'general', t: 'c' };
					}
				} catch (error) {
					console.error(`Failed to fetch room info for ${rid}:`, error);
					if (rid === 'GENERAL') {
						roomsData[rid] = { name: 'general', t: 'c' };
					}
				}
			});

			await Promise.all(roomInfoPromises);
			setRoomsInfo(roomsData);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			setLoading(false);
		}
	}, [getScheduledMessages, getRoomInfo, dispatchToastMessage]);

	useEffect(() => {
		fetchScheduledMessages();
	}, [fetchScheduledMessages]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setOpenMenuId(null);
			}
		};

		if (openMenuId) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [openMenuId]);

	const formatScheduledTime = (scheduledAt: string | Date | moment.Moment): string => {
		const scheduledDate = moment(scheduledAt);
		const today = moment().startOf('day');
		const tomorrow = moment().add(1, 'day').startOf('day');

		if (scheduledDate.isSame(today, 'day')) {
			return `Send today at ${scheduledDate.format('h:mm A')}`;
		}
		if (scheduledDate.isSame(tomorrow, 'day')) {
			return `Send tomorrow at ${scheduledDate.format('h:mm A')}`;
		}
		return `Send on ${scheduledDate.format('DD/MM/YYYY, h:mm A')}`;
	};

	const truncateText = (text: string, maxLength = 50) => {
		if (!text) return 'No message content';
		if (text.length <= maxLength) return text;
		return `${text.substring(0, maxLength)}...`;
	};

	const toggleMenu = (messageId: string | number) => {
		setOpenMenuId(openMenuId === messageId ? null : messageId);
	};

	const handleMenuClick = (e: React.MouseEvent) => {
		e.stopPropagation();
	};

	const handleEditClick = (message: IScheduledMessage) => {
		imperativeModal.open({
			component: EditScheduledMessageModal,
			props: {
				message,
				onSuccess: () => {
					fetchScheduledMessages();
					imperativeModal.close();
				},
				onClose: () => imperativeModal.close(),
				updateScheduledMessage,
			},
		});
	};

	const handleCancelClick = (message: IScheduledMessage) => {
		imperativeModal.open({
			component: DeleteScheduledMessageModal,
			props: {
				message,
				onConfirm: async () => {
					await deleteScheduledMessage({
						scheduledMessageId: message._id,
					});
				},
				onClose: () => imperativeModal.close(),
				formatScheduledTime,
			},
		});
	};

	const getChannelName = (rid: string) => {
		const roomInfo = roomsInfo[rid];

		if (!roomInfo) {
			return rid === 'GENERAL' ? 'general' : rid;
		}

		switch (roomInfo.t) {
			case 'c':
				return roomInfo.name;
			case 'p':
				return roomInfo.name;
			case 'd':
				if (roomInfo.usernames && roomInfo.usernames.length > 0) {
					const otherUser = roomInfo.usernames.find((username: string | undefined) => username !== user?.username);
					return otherUser || roomInfo.usernames[0];
				}
				return roomInfo.name || 'Direct Message';
			default:
				return roomInfo.name || rid;
		}
	};

	const getDestinationAvatar = (rid: string) => {
		const roomInfo = roomsInfo[rid];

		if (!roomInfo) {
			return '/default-avatar.png';
		}

		switch (roomInfo.t) {
			case 'c':
			case 'p':
				if (rid === 'GENERAL' || roomInfo.name === 'general') {
					return `/avatar/general`;
				}
				return roomInfo.avatar || `/avatar/${roomInfo.name}`;
			case 'd':
				if (roomInfo.usernames && roomInfo.usernames.length > 0) {
					const otherUser = roomInfo.usernames.find((username: string | undefined) => username !== user?.username);
					return `/avatar/${otherUser || roomInfo.usernames[0]}`;
				}
				return '/default-user-avatar.png';
			default:
				return '/default-avatar.png';
		}
	};

	const renderContent = () => {
		if (loading) {
			return (
				<States>
					<StatesIcon name='loading' />
					<StatesTitle>{t('Loading')}</StatesTitle>
				</States>
			);
		}

		if (scheduledMessages.length === 0) {
			return (
				<States>
					<StatesIcon name='calendar' />
					<StatesTitle>{t('no_scheduled_messages')}</StatesTitle>
					<StatesSubtitle>{t('no_pending_scheduled_messages')}</StatesSubtitle>
				</States>
			);
		}

		return (
			<Margins block='x16'>
				{scheduledMessages.map((msg) => (
					<Box
						key={msg._id}
						w='full'
						p='x16'
						bg='neutral-800'
						borderRadius='x4'
						display='flex'
						flexDirection='row'
						justifyContent='space-between'
						alignItems='center'
					>
						<Box display='flex' flexDirection='row' alignItems='center' color='white' flexGrow={1} minWidth='0'>
							<Avatar size='x36' url={getDestinationAvatar(msg.rid)} title={getChannelName(msg.rid)} />
							<Box mis='x12' fontScale='p2' flexGrow={1} minWidth='0'>
								<Box fontWeight='700' color='neutral-500'>
									{getChannelName(msg.rid)}
								</Box>
								<Box
									fontScale='c1'
									color='neutral-400'
									overflow='hidden'
									style={{
										textOverflow: 'ellipsis',
										whiteSpace: 'nowrap',
										maxWidth: '100%',
									}}
									title={msg.msg || 'No message content'}
								>
									{truncateText(msg.msg)}
								</Box>
							</Box>
						</Box>
						<Box
							display='flex'
							flexDirection='row'
							alignItems='center'
							position='relative'
							color='neutral-400'
							height='100%'
							justifyContent='center'
							flexShrink={0}
						>
							<Box fontScale='c1' mie='x12'>
								{formatScheduledTime(msg.scheduledAt)}
							</Box>
							<Button square small onClick={() => toggleMenu(msg._id)} title={t('More_actions')}>
								<Icon name='kebab' size='x20' />
							</Button>
							{openMenuId === msg._id && (
								<Box
									ref={menuRef}
									position='absolute'
									style={{
										top: '100%',
										right: '0',
										zIndex: 10,
										boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
									}}
									mbs='x8'
									p='x8'
									display='flex'
									alignItems='center'
									justifyContent='center'
									bg='neutral-800'
									borderWidth='x1'
									borderStyle='solid'
									borderColor='neutral-700'
									borderRadius='x4'
									onClick={handleMenuClick}
								>
									<ButtonGroup align='end'>
										<Button
											square
											title={t('Edit')}
											color='neutral-500'
											style={{ background: 'none' }}
											p='x8'
											size='x28'
											onClick={() => handleEditClick(msg)}
										>
											<Icon name='pencil' size='x20' />
										</Button>
										<Button
											square
											title={t('Cancel')}
											color='neutral-500'
											style={{ background: 'none' }}
											p='x8'
											size='x28'
											onClick={() => handleCancelClick(msg)}
										>
											<Icon name='trash' size='x20' />
										</Button>
									</ButtonGroup>
								</Box>
							)}
						</Box>
					</Box>
				))}
			</Margins>
		);
	};

	return (
		<Page>
			<PageHeader title={t('Scheduled_Messages')} />
			<PageScrollableContentWithShadow>
				<Box maxWidth='100%' w='full' alignSelf='center'>
					{renderContent()}
				</Box>
			</PageScrollableContentWithShadow>
		</Page>
	);
};

export default ScheduledMessagesPage;
