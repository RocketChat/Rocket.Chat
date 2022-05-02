import { Box } from '@rocket.chat/fuselage';
import type { ReactNode, ReactElement } from 'react';
import React from 'react';

const VideoConfModalConfField = ({ children }: { children: ReactNode }): ReactElement => {
  return(
    <Box width='full' mbs='x24'>
      {children}
    </Box>
  )
}

export default VideoConfModalConfField;
