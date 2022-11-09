import { Box, Divider, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useMethod, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, useEffect } from 'react';

import EmptyRoomBody from './components/body/EmptyRoomBody';
import RoomBodyError from './components/body/RoomBodyError';
import RoomBodyLoading from './components/body/RoomBodyLoading';
import UnreadAccordion from './components/body/UnreadAccordion';
import RoomHeader from './components/header/RoomHeader';
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
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	function isNonEmptyArray(array: any[]): boolean {
		return Array.isArray(array) && array.length > 0;
	}

	useEffect(() => {
		function calculateTotals(): void {
			unreadRooms.forEach((room) => {
				if (isNonEmptyArray(room?.messages)) setTotalUnread(room.messages.length);
				if (isNonEmptyArray(room?.threads)) setTotalThreads(room.threads.length);

				console.log('room.messages.length', room.messages.length);
				console.log('room.threads.length', room.threads.length);
			});
		}
		console.log('unreadRooms', unreadRooms);
		calculateTotals();
	}, [unreadRooms]);

	// TODO: Add spinner for loading
	if (loading) return <RoomBodyLoading />;

	if (error) return <RoomBodyError />;

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
								<UnreadAccordion room={exchRoom} handleToggleRead={handleToggleRead} />
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
