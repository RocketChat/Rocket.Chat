import { Box, BoxProps } from '@rocket.chat/fuselage';
import React, { FC, memo, useState } from 'react';

import { useAbsoluteUrl } from '../contexts/ServerContext';
import { useAsyncImage } from '../hooks/useAsyncImage';
import RocketChatLogo from './RocketChatLogo';

type LogoProps = {
	src?: string;
} & BoxProps;

const Logo: FC<LogoProps> = ({
	src,
	...props
}) => {
	const defaultSrc = useAbsoluteUrl()('/images/logo/logo.svg');
	const imageUrl = useAsyncImage(src ?? defaultSrc);

	const [isLoaded, setLoaded] = useState(false);
	const isFallbackVisible = !imageUrl || !isLoaded;

	const handleLoad = (): void => {
		setLoaded(true);
	};

	const handleError = (): void => {
		setLoaded(false);
	};

	return <>
		{isFallbackVisible && <RocketChatLogo {...props} />}
		{imageUrl && <Box {...props} is='img' src={imageUrl} hidden={!isLoaded} onLoad={handleLoad} onError={handleError} />}
	</>;
};

export default memo(Logo);
