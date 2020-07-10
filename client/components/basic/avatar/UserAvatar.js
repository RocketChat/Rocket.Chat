import React from 'react';
import { Avatar } from '@rocket.chat/fuselage';

import { useAvatarUrlFromUserId } from '../../../hooks/useAvatarUrlFromUserId';

function UserAvatar({ userId, ...props }) {
	const [username, url] = useAvatarUrlFromUserId({ userId });
	return <Avatar url={url} title={username} {...props}/>;
}

export default UserAvatar;
