import { Box } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';

const VideoConfPopupUsername = ({ name, username }: { name?: string; username: string }): ReactElement => (
	<Box mis='x8' display='flex'>
    <Box>{name || username}</Box>
    {name && (
      <Box mis='x4' color='neutral-600'>
        {`(${username})`}
      </Box>
    )}
  </Box>
);

export default VideoConfPopupUsername;


