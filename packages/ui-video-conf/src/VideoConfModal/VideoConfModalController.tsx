import React from 'react';
import type { ReactNode, ReactElement } from 'react';
import { Box } from '@rocket.chat/fuselage';

/**
 * @deprecated
 * In favor of CallController
*/

const VideoConfModalController = ({ children }: { children: ReactNode }): ReactElement => (
	<Box display='flex' flexDirection='column' alignItems='center' mie='x12'>
		{children}
	</Box>
);

export default VideoConfModalController;
