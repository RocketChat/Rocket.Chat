import { IRoom, isDirectMessageRoom, isMultipleDirectMessageRoom } from '@rocket.chat/core-typings';
import { useUser, useUserSubscription } from '@rocket.chat/ui-contexts';
import { VideoConfPopupInfo } from '@rocket.chat/ui-video-conf';
import React, { ReactElement } from 'react';

import { RoomIcon } from '../../../../../../components/RoomIcon';
import ReactiveUserStatus from '../../../../../../components/UserStatus/ReactiveUserStatus';
import RoomAvatar from '../../../../../../components/avatar/RoomAvatar';
import { useUserDisplayName } from '../../../../../../hooks/useUserDisplayName';

const VideoConfPopupRoomInfo = ({ room }: { room: IRoom }): ReactElement => {
	const ownUser = useUser();
	const [userId] = room?.uids?.filter((uid) => uid !== ownUser?._id) || [];
	const subscription = useUserSubscription(room._id);
	const username = useUserDisplayName({ name: subscription?.fname, username: subscription?.name });
	const avatar = <RoomAvatar room={room} size='x40' />;

	if (isDirectMessageRoom(room)) {
		return (
			<VideoConfPopupInfo
				avatar={avatar}
				{...(userId && {
					icon: isMultipleDirectMessageRoom(room) ? <RoomIcon placement='default' room={room} /> : <ReactiveUserStatus uid={userId} />,
				})}
			>
				{username}
			</VideoConfPopupInfo>
		);
	}

	return (
		<VideoConfPopupInfo avatar={avatar} icon={<RoomIcon placement='default' room={room} />}>
			{room.name}
		</VideoConfPopupInfo>
	);
};

export default VideoConfPopupRoomInfo;
