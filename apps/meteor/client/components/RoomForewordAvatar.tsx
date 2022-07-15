import { IUser } from '@rocket.chat/core-typings';
import { Avatar } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';
import { useQuery } from 'react-query';

import { getUserAvatarURL } from '../../app/utils/client';

const RoomForewordAvatar = ({ username, ...props }: { username: Exclude<IUser['username'], undefined> }): ReactElement => {
	const getUserInfo = useEndpoint('GET', '/v1/users.info');
	const { data } = useQuery(['users.info', username], () => getUserInfo({ username }));
	const avatarUrl = getUserAvatarURL(username, data?.user.avatarETag);

	return <Avatar size='x48' title={username} url={avatarUrl} data-username={username} {...props} />;
};

export default RoomForewordAvatar;
