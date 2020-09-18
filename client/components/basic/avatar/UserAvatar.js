import React from 'react';

import BaseAvatar from './BaseAvatar';

function UserAvatar({ url, username, etag, ...props }) {
	// NOW, `username` and `etag` props are enough to determine the whole state of
	// this component, but it must be as performatic as possible as it will be
	// rendered many times; and some of the state can be derived at the ancestors.
	// Ideally, it should be a purely visual component.
	const avatarUrl = url || `/avatar/${ username }${ etag ? `?etag=${ etag }` : '' }`;
	return <BaseAvatar url={avatarUrl} title={username} {...props}/>;
}

export default UserAvatar;
