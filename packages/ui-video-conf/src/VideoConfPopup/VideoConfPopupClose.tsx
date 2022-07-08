import { Box, IconButton } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';

const VideoConfPopupClose = ({ onClick, title }: { onClick: () => void; title?: string }): ReactElement => (
	<Box display='flex' justifyContent='end' width='100%'> 
    <IconButton mini onClick={onClick} icon='cross' title={title} />
  </Box>
);

export default VideoConfPopupClose;
