import { IRoom, isVoipRoom, isDirectMessageRoom, IUser } from '@rocket.chat/core-typings';
import { Avatar, Margins, Flex, Box, Tag } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import UserAvatar from '../../../../components/avatar/UserAvatar';
import { VoipRoomForeword } from '../../../../components/voip/room/VoipRoomForeword';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';

type RoomForewordProps = { user: IUser | null; room: IRoom };

const RoomForeword = ({ user, room }: RoomForewordProps): ReactElement | null => {
	const t = useTranslation();

	if (isVoipRoom(room)) {
		return <VoipRoomForeword room={room} />;
	}

	if (!isDirectMessageRoom(room)) {
		return (
			<Box fontScale='c1' color='default' display='flex' justifyContent='center'>
				{t('Start_of_conversation')}
			</Box>
		);
	}

	const usernames = room.usernames?.filter((username) => username !== user?.username);
	if (!usernames || usernames.length < 1) {
		return null;
	}

	return (
		<Box is='div' flexGrow={1} display='flex' justifyContent='center' flexDirection='column'>
			<Flex.Item grow={1}>
				<Margins block='x24'>
					<Avatar.Stack>
						{usernames.map((username, index) => (
							<UserAvatar key={index} size='x48' username={username} />
						))}
					</Avatar.Stack>
				</Margins>
			</Flex.Item>
			<Box display='flex' color='default' fontScale='h2' flexGrow={1} justifyContent='center'>
				{t('Direct_message_you_have_joined')}
			</Box>
			<Box is='div' mb='x8' flexGrow={1} display='flex' justifyContent='center'>
				{usernames.map((username, index) => (
					<Margins inline='x4' key={index}>
						<Box is='a' href={roomCoordinator.getRouteLink('d', { name: username }) || undefined}>
							<Tag variant='primary' className='mention-link' data-username={username} medium>
								{username}
							</Tag>
						</Box>
					</Margins>
				))}
			</Box>
		</Box>
	);
};

export default RoomForeword;
