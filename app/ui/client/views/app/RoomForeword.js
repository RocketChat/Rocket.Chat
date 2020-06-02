import React from 'react';
import { Avatar, Margins, Flex, Box, Tag } from '@rocket.chat/fuselage';

import { Rooms } from '../../../../models';
import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { useReactiveValue } from '../../../../../client/hooks/useReactiveValue';
import { useUser } from '../../../../../client/contexts/UserContext';
import { roomTypes } from '../../../../utils/client';

const RoomForeword = ({ _id: rid }) => {
	const t = useTranslation();

	const user = useUser();
	const room = useReactiveValue(() => Rooms.findOne({ _id: rid }));

	if (room.t !== 'd') {
		return t('Start_of_conversation');
	}

	const users = room.usernames.filter((username) => username !== user.username);
	if (users.length < 1) {
		return null;
	}

	return <Box is='div' flexGrow={1} display='flex' justifyContent='center' flexDirection='column'>
		<Flex.Item grow={1}>
			<Margins block='x24'>
				<Avatar.Stack>
					{users.map(
						(username, index) => {
							const avatarUrl = roomTypes.getConfig('d').getAvatarPath({ name: username, type: 'd' });
							return <Avatar size='x48' title={username} url={avatarUrl} key={index} data-username={username} />;
						})}
				</Avatar.Stack>
			</Margins>
		</Flex.Item>
		<Box color='default' fontScale='h1' flexGrow={1}>{t('Direct_message_you_have_joined')}</Box>
		<Box is='div' mb='x8' flexGrow={1}>
			{users.map((username, index) => <Margins inline='x4' key={index}>
				<Tag
					is='a'
					fontScale='p2'
					href={`/direct/${ username }`}
					data-username={username}
					className='mention-link mention-link--user'
				>{username}</Tag>
			</Margins>)}
		</Box>
	</Box>;
};

export default RoomForeword;
