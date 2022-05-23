import { IUser } from '@rocket.chat/core-typings';
import { Avatar } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import { getUserAvatarURL } from '../../app/utils/client';
import { usePresence } from '../hooks/usePresence';

const RoomForewordAvatar = ({ username, uid, ...props }: { uid: IUser['_id']; username: IUser['username'] }): ReactElement => {
	const user = usePresence(uid);
	const avatarUrl = getUserAvatarURL(username, user?.avatarETag);

	return <Avatar size='x48' title={username} url={avatarUrl} data-username={username} {...props} />;
};

export default RoomForewordAvatar;
