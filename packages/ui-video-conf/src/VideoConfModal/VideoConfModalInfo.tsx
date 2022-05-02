import { Box } from '@rocket.chat/fuselage';
import type { ReactNode, ReactElement } from 'react';
import React from 'react';

const VideoConfModalInfo = ({ children }: { children: ReactNode }): ReactElement => (
  <Box display='flex' alignItems='center' mbs='x8'>
    {children}
  </Box>
);

export default VideoConfModalInfo;
