import React from 'react';

import BaseAvatar from './BaseAvatar';
import { useUserAvatarPath } from '../../../contexts/AvatarContext';

function UserAvatar({ username, etag, ...rest }) {
	const getUserAvatarPath = useUserAvatarPath();
	const { url = getUserAvatarPath(username, etag), ...props } = rest;
	return <BaseAvatar url={url} title={username} {...props}/>;
}

export default UserAvatar;
