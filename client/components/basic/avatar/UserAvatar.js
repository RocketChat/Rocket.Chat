import React from 'react';
import { Avatar } from '@rocket.chat/fuselage';

function UserAvatar({ url, username, ...props }) {
	const avatarUrl = url || `/avatar/${ username }`;
	return <Avatar url={avatarUrl} title={username} {...props}/>;
}

export default UserAvatar;
