import { Avatar, AvatarProps, Skeleton } from '@rocket.chat/fuselage';
import React, { FC, useState } from 'react';

export type BaseAvatarProps = Omit<AvatarProps, 'is'>;

const BaseAvatar: FC<BaseAvatarProps> = ({ size, ...props }) => {
	const [error, setError] = useState<unknown>(false);

	if (error) {
		return <Skeleton aria-hidden variant='rect' {...props} />;
	}

	return <Avatar aria-hidden onError={setError} size={size} {...props} />;
};

export default BaseAvatar;
