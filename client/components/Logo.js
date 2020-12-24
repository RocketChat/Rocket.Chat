import { Box } from '@rocket.chat/fuselage';
import React, { useState } from 'react';

import RocketChatLogo from './RocketChatLogo';

const Logo = ({ src = 'images/logo/logo.svg', ...props }) => {
	const [isLoaded, setLoaded] = useState(false);
	const isPlaceholderVisible = !src || !isLoaded;

	const handleLoad = () => {
		setLoaded(true);
	};

	const handleError = () => {
		setLoaded(false);
	};

	return <>
		{isPlaceholderVisible && <RocketChatLogo {...props} />}
		{src && <Box {...props} is='img' src={src} hidden={!isLoaded} onLoad={handleLoad} onError={handleError} />}
	</>;
};

export default Logo;
