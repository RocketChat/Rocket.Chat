import { IRoom, isVoipRoom, isDirectMessageRoom } from '@rocket.chat/core-typings';
import { Avatar, Margins, Flex, Box, Tag } from '@rocket.chat/fuselage';
import { useUser, useUserRoom, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import { Users } from '../../app/models/client';
import { getUserAvatarURL } from '../../app/utils/client';
import { VoipRoomForeword } from './voip/room/VoipRoomForeword';

type RoomForewordProps = { _id: IRoom['_id']; rid?: IRoom['_id'] } | { rid: IRoom['_id']; _id?: IRoom['_id'] };

const RoomForeword = ({ _id, rid }: RoomForewordProps): ReactElement | null => {
	const roomId = _id || rid;
	if (!roomId) {
		throw new Error('Room id required - RoomForeword');
	}

	const t = useTranslation();

	const user = useUser();
	const room = useUserRoom(roomId);

	if (!room) {
		return null;
	}

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
						{usernames.map((username, index) => {
							const user = Users.findOne({ username }, { fields: { avatarETag: 1 } });

							const avatarUrl = getUserAvatarURL(username, user?.avatarETag);

							return <Avatar key={index} size='x48' title={username} url={avatarUrl} data-username={username} />;
						})}
					</Avatar.Stack>
				</Margins>
			</Flex.Item>
			<Box display='flex' color='default' fontScale='h2' flexGrow={1} justifyContent='center'>
				{t('Direct_message_you_have_joined')}
			</Box>
			<Box is='div' mb='x8' flexGrow={1} display='flex' justifyContent='center'>
				{usernames.map((username, index) => (
					<Margins inline='x4' key={index}>
						<Box is='a' href={`/direct/${username}`}>
							<Tag variant='secondary' className='mention-link' data-username={username} medium>
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
