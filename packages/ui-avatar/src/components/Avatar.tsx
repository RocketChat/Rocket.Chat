import type { AvatarProps } from '@rocket.chat/fuselage';
import { Avatar as FuselageAvatar, Skeleton } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import { useState } from 'react';

export type UiAvatarProps = Omit<AvatarProps, 'is'>;

const Avatar: FC<UiAvatarProps> = (props) => {
	const [isLoading, setIsLoading] = useState<unknown>(false);

	if (isLoading) {
		return <Skeleton aria-hidden variant='rect' {...props} />;
	}

	return (
		<FuselageAvatar
			aria-hidden
			onError={(event) => {
				setIsLoading(true);
				props.onError?.(event);
			}}
			{...props}
		/>
	);
};

export default Avatar;
