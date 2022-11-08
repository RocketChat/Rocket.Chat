import { Accordion, Box, Divider, FieldGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useMethod, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, useEffect } from 'react';

import EmptyRoomBody from './components/body/EmptyRoomBody';
import UnreadAccordionHeader from './components/body/UnreadAccordionHeader';
import RoomHeader from './components/header/RoomHeader';
import Message from './components/messages/Message';
import { useUnreads } from './hooks/useUnreads';

const UnreadsPage: FC = () => {
	const t = useTranslation();
	console.log('t', t('Enable'));

	const [loading, error, unreadRooms] = useUnreads();

	if (loading) {
		console.log('loading...', Date.now());
	} else if (error) {
		console.error(error);
	} else {
		console.log('Unreads', unreadRooms, Date.now());
	}

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

	// TODO: Change func of read status for all rooms
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

	function isNonEmptyArray(array: any[]): boolean {
		return Array.isArray(array) && array.length > 0;
	}

	function calculateTotals() {
		unreadRooms.forEach((room) => {
			if (isNonEmptyArray(room?.messages)) setTotalUnread(room.messages.length);
			if (isNonEmptyArray(room?.threads)) setTotalThreads(room.threads.length);

			console.log('room.messages.length', room.messages.length);
			console.log('room.threads.length', room.threads.length);
		});
	}

	useEffect(() => {
		console.log('unreadRooms', unreadRooms);
		calculateTotals();
	}, [unreadRooms]);

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
			<RoomHeader
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
											</>
										}
										data-qa-id={`${exchRoom.rid}-unread-messages`}
									>
										<Box borderRadius='x4' padding='x1' backgroundColor='neutral-400'>
											<FieldGroup>
												{exchRoom.messages.map((msg: any, msgIndex: number) => (
													<Message key={msgIndex} id={msg._id} message={msg} sequential={true} all={true} mention={false} unread={true} />
												))}
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
