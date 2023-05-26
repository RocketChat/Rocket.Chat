import { Box, Throbber } from '@rocket.chat/fuselage';
import React from 'react';

const LoadingIndicator = () => {
	return (
		<Box display='flex' height='100%' width='100%' alignItems='center' justifyContent='center' position='absolute'>
			<Throbber />
		</Box>
	);
};

export default LoadingIndicator;
