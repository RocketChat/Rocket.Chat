import React, { FC, useState } from 'react';
import { Avatar, AvatarProps, Skeleton } from '@rocket.chat/fuselage';

export type BaseAvatarProps = AvatarProps;

const BaseAvatar: FC<BaseAvatarProps> = ({ size, ...props }) => {
	const [error, setError] = useState<unknown>(false);

	if (error) {
		return <Skeleton variant='rect' {...props} />;
	}

	return <Avatar onError={setError} size={size} {...props}/>;
};

export default BaseAvatar;
