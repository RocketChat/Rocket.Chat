import { IRoom } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useUser } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import { RoomIcon } from '../../../../../../components/RoomIcon';
import RoomAvatar from '../../../../../../components/avatar/RoomAvatar';

const VideoConfPopupRoomInfo = ({ room }: { room: IRoom }): ReactElement => {
	const user = useUser();
	const [directUsername] = room.usernames?.filter((username) => username !== user?.username) || [];

	return (
		<Box display='flex' alignItems='center'>
			<RoomAvatar room={room} size='x40' />
			<Box display='flex' alignItems='center' mis='x8' withTruncatedText>
				<RoomIcon placement='default' room={room} />
				<Box mis='x8' fontScale='h4' withTruncatedText>
					{directUsername || room.name}
				</Box>
			</Box>
		</Box>
	);
};

export default VideoConfPopupRoomInfo;
