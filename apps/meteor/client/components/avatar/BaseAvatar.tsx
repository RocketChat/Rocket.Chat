import type { AvatarProps } from '@rocket.chat/fuselage';
import { Avatar, Skeleton } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React, { useState } from 'react';

export type BaseAvatarProps = Omit<AvatarProps, 'is'>;

const BaseAvatar: FC<BaseAvatarProps> = ({ size, ...props }) => {
	const [error, setError] = useState<unknown>(false);

	if (error) {
		return <Skeleton aria-hidden variant='rect' {...props} />;
	}

	return <Avatar aria-hidden onError={setError} size={size} {...props} />;
};

export default BaseAvatar;
