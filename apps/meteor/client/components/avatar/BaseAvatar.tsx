import type { AvatarProps } from '@rocket.chat/fuselage';
import { Avatar, Skeleton } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React, { useState } from 'react';

export type BaseAvatarProps = Omit<AvatarProps, 'is'>;

const BaseAvatar: FC<BaseAvatarProps> = ({ onError, ...props }) => {
	const [isLoading, setIsLoading] = useState<unknown>(false);

	if (isLoading) {
		return <Skeleton aria-hidden variant='rect' onError={onError} {...props} />;
	}

	return (
		<Avatar
			aria-hidden
			onError={(event) => {
				setIsLoading(true);
				onError?.(event);
			}}
			{...props}
		/>
	);
};

export default BaseAvatar;
