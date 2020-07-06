import React from 'react';

import BaseAvatar from './Base';

function UserAvatar({ url, username, ...props }) {
	const avatarUrl = url || `/avatar/${ username }`;

	return <BaseAvatar url={avatarUrl} title={username} {...props}/>;
}

export default UserAvatar;
