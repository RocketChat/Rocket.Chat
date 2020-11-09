import React, { useState } from 'react';
import { Avatar, Skeleton } from '@rocket.chat/fuselage';

function BaseAvatar(props) {
	const [error, setError] = useState(false);

	if (error) {
		return <Skeleton variant='rect' {...props} />;
	}

	return <Avatar onError={setError} {...props}/>;
}

export default BaseAvatar;
