import type { AvatarProps } from '@rocket.chat/fuselage';
import { Avatar as FuselageAvatar, Skeleton } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import { useState } from 'react';

export type UiAvatarProps = Omit<AvatarProps, 'is'>;

// TODO: check spreading props necessity
const Avatar: FC<UiAvatarProps> = (props) => {
	const [error, setError] = useState<unknown>(false);

	if (error) {
		return <Skeleton aria-hidden variant='rect' {...props} />;
	}

	return <FuselageAvatar aria-hidden onError={setError} {...props} />;
};

export default Avatar;
