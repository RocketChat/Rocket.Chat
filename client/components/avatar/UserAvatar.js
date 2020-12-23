import React, { memo } from 'react';

import BaseAvatar from './BaseAvatar';
import { useUserAvatarPath } from '../../contexts/AvatarUrlContext';

const UserAvatar = ({ username, etag, url, ...props }) => {
	const getUserAvatarPath = useUserAvatarPath();
	url = url ?? getUserAvatarPath(username, etag);
	return <BaseAvatar url={url} title={username} {...props}/>;
};

export default memo(UserAvatar);
