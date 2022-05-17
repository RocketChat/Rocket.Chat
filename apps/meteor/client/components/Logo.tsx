import { Box } from '@rocket.chat/fuselage';
import { RocketChatLogo } from '@rocket.chat/logo';
import React, { ComponentProps, ReactElement, useState } from 'react';

type LogoProps = Omit<ComponentProps<typeof Box>, 'src'> & {
	src?: string;
};

const Logo = ({ src = 'images/logo/logo.svg', ...props }: LogoProps): ReactElement => {
	const [isLoaded, setLoaded] = useState(false);
	const isPlaceholderVisible = !src || !isLoaded;

	const handleLoad = (): void => {
		setLoaded(true);
	};

	const handleError = (): void => {
		setLoaded(false);
	};

	return (
		<>
			{isPlaceholderVisible && (
				<Box display='inline-flex' alignItems='center' {...props}>
					<RocketChatLogo />
				</Box>
			)}
			{src && <Box {...props} is='img' src={src} hidden={!isLoaded} onLoad={handleLoad} onError={handleError} />}
		</>
	);
};

export default Logo;
