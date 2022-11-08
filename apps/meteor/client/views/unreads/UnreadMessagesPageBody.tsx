// import { IRoom } from '@rocket.chat/core-typings';
// import { Accordion, Box, FieldGroup } from '@rocket.chat/fuselage';
// import { usePermission, useSetting, useUser, useUserPreference } from '@rocket.chat/ui-contexts';
// import React, { FC, useMemo } from 'react';

// import MessageList from '../room/MessageList/MessageList';
// import MessageListErrorBoundary from '../room/MessageList/MessageListErrorBoundary';
// import LegacyMessageTemplateList from '../room/components/body/LegacyMessageTemplateList';
// import LoadingMessagesIndicator from '../room/components/body/LoadingMessagesIndicator';
// import RetentionPolicyWarning from '../room/components/body/RetentionPolicyWarning';
// import RoomForeword from '../room/components/body/RoomForeword';
// import { useRetentionPolicy } from '../room/components/body/useRetentionPolicy';
// import { useRoomMessages, useRoomSubscription } from '../room/contexts/RoomContext';

import { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { Accordion, Box, FieldGroup } from '@rocket.chat/fuselage';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

import MessageList from '../room/MessageList/MessageList';
import LegacyMessageTemplateList from '../room/components/body/LegacyMessageTemplateList';
// import MessageListErrorBoundary from '../room/MessageList/MessageListErrorBoundary';
// import LoadingMessagesIndicator from '../room/components/body/LoadingMessagesIndicator';
// import { useRoomMessages } from '../room/contexts/RoomContext';

interface UnreadMessagesPageBodyProps {
	room: ISubscription & IRoom;
}

const UnreadMessagesPageBody: FC<UnreadMessagesPageBodyProps> = ({ room }) => {
	console.log('UnreadMessagesPageBody ROOM = ', room);

	// const subscription = useRoomSubscription();
	// const retentionPolicy = useRetentionPolicy(room);
	// const user = useUser();
	const useLegacyMessageTemplate = useUserPreference<boolean>('useLegacyMessageTemplate') ?? false;

	// const { hasMoreNextMessages, isLoadingMoreMessages } = useRoomMessages();
	// const { hasMorePreviousMessages, hasMoreNextMessages, isLoadingMoreMessages } = useRoomMessages();

	// const allowAnonymousRead = useSetting('Accounts_AllowAnonymousRead') as boolean | undefined;

	// const canPreviewChannelRoom = usePermission('preview-c-room');

	// const subscribed = !!subscription;

	// const canPreview = useMemo(() => {
	// 	if (room && room.t !== 'c') {
	// 		return true;
	// 	}

	// 	if (allowAnonymousRead === true) {
	// 		return true;
	// 	}

	// 	if (canPreviewChannelRoom) {
	// 		return true;
	// 	}

	// 	return subscribed;
	// }, [allowAnonymousRead, canPreviewChannelRoom, room, subscribed]);

	return (
		// <MessageListErrorBoundary>
		<ul className='messages-list' aria-live='polite'>
			{/* {canPreview ? (
					<>
						{hasMorePreviousMessages ? (
							<li className='load-more'>{isLoadingMoreMessages ? <LoadingMessagesIndicator /> : null}</li>
						) : (
							<li className='start color-info-font-color'>
								{retentionPolicy ? <RetentionPolicyWarning {...retentionPolicy} /> : null}
								<RoomForeword user={user} room={room} />
							</li>
						)}
					</>
				) : null} */}
			<Accordion.Item
				title={
					<Box display='flex' flexDirection='column' alignItems='center'>
						{/* <RoomListRow data={data} item={roomData} /> */}
						{/* <Header room={room} /> */}
						<Box display='flex' alignItems='center'>
							<span>
								Room {room.name?.toUpperCase()} {' - '}
							</span>
							<span>
								{room.msgs} messages and {room.usersCount} users{' '}
							</span>
						</Box>
					</Box>
				}
				data-qa-id={`${room._id}-unread-messages`}
			>
				<FieldGroup>
					{useLegacyMessageTemplate ? <LegacyMessageTemplateList room={room} /> : <MessageList rid={room._id} />}
					{/* {hasMoreNextMessages ? <li className='load-more'>{isLoadingMoreMessages ? <LoadingMessagesIndicator /> : null}</li> : null} */}
				</FieldGroup>
			</Accordion.Item>
		</ul>
		// </MessageListErrorBoundary>
	);
};

export default UnreadMessagesPageBody;
