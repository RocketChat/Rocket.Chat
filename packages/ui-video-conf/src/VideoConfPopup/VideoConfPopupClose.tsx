import { Box, ActionButton } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';

const VideoConfPopupClose = ({ onClick, title }: { onClick: () => void; title?: string }): ReactElement => (
	<Box display='flex' justifyContent='end' width='100%'> 
    <ActionButton mini ghost onClick={onClick} icon='cross' title={title} />
  </Box>
);

export default VideoConfPopupClose;
