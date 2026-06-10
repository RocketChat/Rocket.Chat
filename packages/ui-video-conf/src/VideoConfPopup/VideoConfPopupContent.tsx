import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

const VideoConfPopupContent = ({ children }: { children: ReactNode }) => (
	<Box display='flex' flexDirection='column' mbs={8}>
		{children}
	</Box>
);

export default VideoConfPopupContent;
