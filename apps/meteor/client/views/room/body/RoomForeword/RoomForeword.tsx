import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { isVoipRoom, isDirectMessageRoom } from '@rocket.chat/core-typings';
import { Flex, Box } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import RoomForewordUsernameList from './RoomForewordUsernameList';
import { VoipRoomForeword } from '../../../../components/voip/room/VoipRoomForeword';

type RoomForewordProps = { user: IUser | null; room: IRoom };

const RoomForeword = ({ user, room }: RoomForewordProps): ReactElement | null => {
	const { t } = useTranslation();

	if (isVoipRoom(room)) {
		return <VoipRoomForeword room={room} />;
	}

	if (!isDirectMessageRoom(room)) {
		return (
			<Box fontScale='c1' color='default' display='flex' justifyContent='center' mb={8}>
				{t('Start_of_conversation')}
			</Box>
		);
	}

	const usernames = room.usernames?.filter((username) => username !== user?.username);

	if (!usernames || usernames.length < 1) {
		return null;
	}

	return (
		<Box is='div' flexGrow={1} display='flex' justifyContent='center' flexDirection='column' mb={8}>
			<Flex.Item grow={1}>
				<Box display='flex' alignItems='center' justifyContent='center'>
					{usernames.map((username, index) => (
						<Box is='span' mi={4} key={index}>
							<UserAvatar size='x48' username={username} />
						</Box>
					))}
				</Box>
			</Flex.Item>
			<Box display='flex' color='default' fontScale='h4' flexGrow={1} justifyContent='center' mb={16}>
				{t('Direct_message_you_have_joined')}
			</Box>
			<Box is='div' flexGrow={1} display='flex' justifyContent='center'>
				<RoomForewordUsernameList usernames={usernames} />
			</Box>
		</Box>
	);
};

export default RoomForeword;
