import React from 'react';
import { Avatar, Margins, Flex, Box, Tag } from '@rocket.chat/fuselage';

import { Rooms } from '../../../../models';
import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { useReactiveValue } from '../../../../../client/hooks/useReactiveValue';
import { useUser } from '../../../../../client/contexts/UserContext';

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

	return <Avatar.Context.Provider value={{ baseUrl: '/avatar/' }}>
		<Flex.Container justifyContent='center' direction='column'>
			<Flex.Item grow={1}>
				<Box is='div'>
					<Flex.Item grow={1}>
						<Margins block='x24'>
							<Avatar.Stack>
								{users.map((username, index) => <Avatar size='x48' title={username} url={username} key={index} data-username={username} />)}
							</Avatar.Stack>
						</Margins>
					</Flex.Item>
					<Flex.Item grow={1}>
						<Box textColor='default' textStyle='headline' >
							{ t('Direct_message_you_have_joined') }
						</Box>
					</Flex.Item>
					<Flex.Item grow={1}>
						<Margins block='x8'>
							<Box is='div'>
								{users.map((username, index) => <Margins inline='x4' key={index}>
									<Tag
										is='a'
										textStyle='p2'
										href={ `/direct/${ username }` }
										data-username={username}
										className='mention-link mention-link--user'
									>{username}</Tag>
								</Margins>)}
							</Box>
						</Margins>
					</Flex.Item>
				</Box>
			</Flex.Item>
		</Flex.Container>
	</Avatar.Context.Provider>;
};

export default RoomForeword;
