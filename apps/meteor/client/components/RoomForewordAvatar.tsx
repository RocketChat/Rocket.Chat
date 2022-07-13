import { IUser } from '@rocket.chat/core-typings';
import { Avatar } from '@rocket.chat/fuselage';
import React, { ReactElement, useMemo } from 'react';

import { getUserAvatarURL } from '../../app/utils/client';
import { useEndpointData } from '../hooks/useEndpointData';

const RoomForewordAvatar = ({ username, ...props }: { username: Exclude<IUser['username'], undefined> }): ReactElement => {
	const { value: data } = useEndpointData(
		'/v1/users.info',
		useMemo(() => ({ username }), [username]),
	);
	const avatarUrl = getUserAvatarURL(username, data?.user.avatarETag);

	return <Avatar size='x48' title={username} url={avatarUrl} data-username={username} {...props} />;
};

export default RoomForewordAvatar;
