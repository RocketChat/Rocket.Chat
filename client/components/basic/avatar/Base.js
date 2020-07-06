import React, { useState } from 'react';
import { Avatar, Skeleton } from '@rocket.chat/fuselage';

function BaseAvatar({ url, username, ...props }) {
	const [error, setError] = useState(false);

	if (error) {
		return <Skeleton variant='rect' title={username} {...props} />;
	}

	return <Avatar onError={setError} {...props}/>;
}

export default BaseAvatar;
