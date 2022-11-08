import { Accordion, Box, Divider, FieldGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useMethod, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
// import { merge } from 'jquery';
// import { useResizeObserver } from '@rocket.chat/fuselage-hooks';
// import { useSession, useTranslation, useUserId, useUserPreference } from '@rocket.chat/ui-contexts';
// import { useUserPreference } from '@rocket.chat/ui-contexts';
import React, { FC, useEffect } from 'react';

// import Header from '../room/Header';
// import RoomListRow from '../../sidebar/RoomList/RoomListRow';
// import { useAvatarTemplate } from '../../sidebar/hooks/useAvatarTemplate';
// import { useTemplateByViewMode } from '../../sidebar/hooks/useTemplateByViewMode';
import EmptyRoomBody from './components/EmptyRoomBody';
import Message from './components/Message';
import UnreadAccordionHeader from './components/headers/UnreadAccordionHeader';
import UnreadRoomHeader from './components/headers/UnreadRoomHeader';
import { useUnreads } from './hooks/useUnreads';
import { mockRoom, headerRoomData } from './mockRoom';
import { IRoom, ISubscription, RoomType } from '@rocket.chat/core-typings';
// import { IRoom } from '@rocket.chat/core-typings';

// import RoomListRow from '../../sidebar/RoomList/RoomListRow';
// import { useAvatarTemplate } from '../../sidebar/hooks/useAvatarTemplate';
// import { useTemplateByViewMode } from '../../sidebar/hooks/useTemplateByViewMode';
// import MessageList from '../room/MessageList/MessageList';

// import Header from '../room/Header';
// import { useTemplateByViewMode } from '/client/sidebar/hooks/useTemplateByViewMode';
// import MessageList from '../room/MessageList/MessageList';
// import LegacyMessageTemplateList from '../room/components/body/LegacyMessageTemplateList';

// import { useRoomList } from '../../sidebar/hooks/useRoomList';
// import MessageList from '../room/MessageList/MessageList';
// import LegacyMessageTemplateList from '../room/components/body/LegacyMessageTemplateList';
// import UnreadMessagesPageBody from './UnreadMessagesPageBody';

const UnreadsPage: FC = () => {
	const t = useTranslation();
	console.log('t', t('Enable'));

	// const roomsList = useRoomList();

	const [loading, error, unreadRooms] = useUnreads();

	if (loading) {
		console.log('loading...', Date.now());
	} else if (error) {
		console.error(error);
	} else {
		console.log('Unreads', unreadRooms, Date.now());
	}

	function isArrayValid(array: any[]): boolean {
		return Array.isArray(array) && array.length > 0;
	}

	function isRoomValid(room: ISubscription & IRoom): boolean {
		// if (typeof room === 'object' && room?.rid && room?.name && room?.unread) return true;
		if (typeof room === 'object') return true;
		return false;
	}

	// const useLegacyMessageTemplate = useUserPreference<boolean>('useLegacyMessageTemplate') ?? false;

	// const subscription = useUserSubscription(rid, fields);
	const readMessages = useEndpoint('POST', '/v1/subscriptions.read');
	const unreadMessages = useMethod('unreadMessages');
	const dispatchToastMessage = useToastMessageDispatch();

	const [isUnread, setIsUnread] = React.useState(false);
	const [isAllUnread, setIsAllUnread] = React.useState(false);
	const [totalUnread, setTotalUnread] = React.useState(0);
	const [totalThreads, setTotalThreads] = React.useState(0);

	const handleToggleRead = useMutableCallback(async (rid) => {
		try {
			if (isUnread) {
				setIsUnread(false);
				await readMessages({ rid });
				return;
			}
			setIsUnread(true);
			await unreadMessages(null, rid);
			// if (subscription == null) {
			// 	return;
			// }
			// RoomManager.close(subscription.t + subscription.name);

			// router.push({});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	// TODO: Change func of read status for all room
	const handleToggleReadAll = useMutableCallback(async () => {
		setIsAllUnread(!isAllUnread);
		setTotalUnread(10);
		try {
			if (isUnread) {
				setIsUnread(false);
				// await readMessages({ rid });
				return;
			}
			setIsUnread(true);
			// await unreadMessages(null, rid);
			// if (subscription == null) {
			// 	return;
			// }
			// RoomManager.close(subscription.t + subscription.name);

			// router.push({});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	// if (loading) return <div>Loading...</div>;

	// if (error) return <div>Error...</div>;

	// const badgeStyle = {
	// 	backgroundColor: isUnread ? '#ff0000' : '#1c860e',
	// 	color: 'var(--rcx-color-surface, white)',
	// 	flexShrink: 0,
	// };

	function calculateTotals() {
		unreadRooms.forEach((room) => {
			if (typeof room?.messages === 'array') setTotalUnread(room.messages.length);
			if (typeof room?.threads === 'array') setTotalThreads(room.threads.length);

			console.log('room.messages.length', room.messages.length);
			console.log('room.threads.length', room.threads.length);
		});
	}

	useEffect(() => {
		console.log('unreadRooms', unreadRooms);
		calculateTotals();
	}, [unreadRooms]);

	const headerInfo: ISubscription & IRoom & RoomType = headerRoomData;

	// TODO: Add spinner for loading
	if (loading) {
		return (
			<Box display='flex' flexDirection='column' justifyContent='center' alignItems='center' height='100%'>
				<span style={{ fontSize: '20px', fontWeight: 'bold' }}>Loading...</span>
			</Box>
		);
	}

	if (error) {
		return (
			<Box display='flex' flexDirection='column' justifyContent='center' alignItems='center' height='100%'>
				<span style={{ fontSize: '20px', fontWeight: 'bold' }}>Error...</span>
			</Box>
		);
	}

	return (
		<Box width='full' minHeight='sh' alignItems='center' overflow='scroll' position='relative'>
			<UnreadRoomHeader
				room={headerInfo}
				totalUnread={totalUnread}
				totalThreads={totalThreads}
				isAllUnread={isAllUnread}
				handleToggleReadAll={handleToggleReadAll}
			/>
			{totalUnread > 0 ? (
				<ul className='messages-list' aria-live='polite'>
					{unreadRooms.map((exchRoom: any, index: number) => (
						<>
							{index > 0 && <Divider />}
							<li key={exchRoom.rid} style={{ width: '100%', padding: '10px 0' }}>
								<Box
									border='1px solid'
									borderColor='neutral-500'
									borderRadius='x4'
									margin='x4'
									elevation='2'
									position='relative'
									key={index}
								>
									<Accordion.Item
										{...({
											style: {
												padding: '0 !important',
												// border: '1px solid #b6b6b6',
											},
										} as any)}
										defaultExpanded
										title={
											<>
												<UnreadAccordionHeader
													room={exchRoom}
													messagesCount={exchRoom.messages.length}
													isUnread={false}
													handleToggleRead={handleToggleRead}
												/>
												{/* <div style={{ position: 'absolute', top: 10, left: 10 }}>
													<Badge
														{...({
															style: badgeStyle,
														} as any)}
													>
														{exchRoom.messages.length}
													</Badge>
												</div> */}
											</>
										}
										data-qa-id={`${exchRoom.rid}-unread-messages`}
									>
										{/* <Button onClick={() => handleToggleRead(exchRoom.rid)}>
											<Icon name={'flag'} size='x20' margin='4x' />
											<span style={{ marginLeft: '10px' }}>{isUnread ? 'Mark as Read' : 'Mark as Unread'}</span>
										</Button> */}
										{/* <Divider /> */}
										<Box borderRadius='x4' padding='x1' backgroundColor='neutral-400'>
											<FieldGroup>
												{exchRoom.messages.map((msg: any, msgIndex: number) => (
													<Message key={msgIndex} id={msg._id} message={msg} sequential={true} all={true} mention={false} unread={true} />
												))}

												{/* {useLegacyMessageTemplate ? <LegacyMessageTemplateList room={roomsList[4]} /> : <MessageList rid={roomsList[4]._id} />} */}
												{/* <MessageList rid={mockRoom[0].rid} /> */}

												{/* <LegacyMessageTemplateList room={mockRoom[0]} /> */}
												{/* {hasMoreNextMessages ? <li className='load-more'>{isLoadingMoreMessages ? <LoadingMessagesIndicator /> : null}</li> : null} */}
											</FieldGroup>
										</Box>
									</Accordion.Item>
								</Box>
							</li>
						</>
					))}
				</ul>
			) : (
				<EmptyRoomBody />
			)}
		</Box>
	);
};

export default UnreadsPage;
