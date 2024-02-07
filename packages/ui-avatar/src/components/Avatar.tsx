import type { AvatarProps } from '@rocket.chat/fuselage';
import { Avatar as FuselageAvatar, Skeleton } from '@rocket.chat/fuselage';
import { useEffectEvent, usePrevious } from '@rocket.chat/fuselage-hooks';
import type { SyntheticEvent } from 'react';
import { useState } from 'react';

export type UiAvatarProps = Omit<AvatarProps, 'is'>;

const Avatar = ({ url, onLoad, onError, ...props }: UiAvatarProps) => {
	const [unloaded, setUnloaded] = useState(false);
	const prevUrl = usePrevious(url);

	const handleLoad = useEffectEvent((event: SyntheticEvent<HTMLImageElement, Event>) => {
		setUnloaded(false);
		onLoad?.(event);
	});

	const handleError = useEffectEvent((event: SyntheticEvent<HTMLImageElement, ErrorEvent>) => {
		setUnloaded(true);
		onError?.(event);
	});

	if (unloaded && url === prevUrl) {
		return <Skeleton aria-hidden='true' variant='rect' {...props} />;
	}

	return <FuselageAvatar aria-hidden='true' onLoad={handleLoad} onError={handleError} url={url} {...props} />;
};

export default Avatar;
