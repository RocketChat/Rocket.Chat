import React from 'react';
import { Avatar } from '@rocket.chat/fuselage';

function UserAvatar({ url, username, etag, ...props }) {
	const avatarUrl = url || `/avatar/${ username }${ etag ? `?etag=${ etag }` : '' }`;
	return <Avatar rounded url={avatarUrl} title={username} {...props}/>;
}

export default UserAvatar;
