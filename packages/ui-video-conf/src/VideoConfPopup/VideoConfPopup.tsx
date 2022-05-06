import React from 'react';
import type { ReactNode, ReactElement } from 'react';
import { Box } from '@rocket.chat/fuselage';

const VideoConfPopup = ({ children }: { children: ReactNode }): ReactElement => {
	return (
		<Box maxWidth='x276' backgroundColor='white'>
			{children}
		</Box>
	);
};

export default VideoConfPopup;
