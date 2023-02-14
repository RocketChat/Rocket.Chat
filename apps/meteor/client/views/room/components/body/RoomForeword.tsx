import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { isVoipRoom, isDirectMessageRoom } from '@rocket.chat/core-typings';
import { Flex, Box, Tag, Icon } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

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
				<Box display='flex' alignItems='center' justifyContent='center'>
					{usernames.map((username, index) => (
						<Box is='span' mi='x4' key={index}>
							<UserAvatar size='x48' username={username} />
						</Box>
					))}
				</Box>
			</Flex.Item>
			<Box display='flex' color='default' fontScale='h4' flexGrow={1} justifyContent='center' mb='x16'>
				{t('Direct_message_you_have_joined')}
			</Box>
			<Box is='div' flexGrow={1} display='flex' justifyContent='center'>
				{usernames.map((username, index) => (
					<Box mi='x4' is='a' href={roomCoordinator.getRouteLink('d', { name: username }) || undefined} key={index}>
						<Tag icon={<Icon name='user' size='x20' />} className='mention-link' data-username={username} large>
							{username}
						</Tag>
					</Box>
				))}
			</Box>
		</Box>
	);
};

export default RoomForeword;
