import { Box } from '@rocket.chat/fuselage';
import type { ReactNode, ReactElement } from 'react';

const VideoConfPopupContent = ({ children }: { children: ReactNode }): ReactElement => (
	<Box display='flex' flexDirection='column' mbs='x8'>
		{children}
	</Box>
);

export default VideoConfPopupContent;
