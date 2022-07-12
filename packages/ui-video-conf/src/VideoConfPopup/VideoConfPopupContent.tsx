import { Box } from '@rocket.chat/fuselage';
import type { ReactNode, ReactElement } from 'react';
import React from 'react';

const VideoConfPopupContent = ({ children }: { children: ReactNode }): ReactElement => (
	<Box display='flex' flexDirection='column' alignItems='center'>
    {children}
  </Box>
);

export default VideoConfPopupContent;
