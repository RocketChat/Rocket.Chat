import React from 'react';
import type { ReactNode, ReactElement } from 'react';
import { Box } from '@rocket.chat/fuselage';

const VideoConfModalTitle = ({ children }: { children: ReactNode }): ReactElement => (
  <Box fontScale='p2b' mbs='x16'>
    {children}
  </Box>
);

export default VideoConfModalTitle;
