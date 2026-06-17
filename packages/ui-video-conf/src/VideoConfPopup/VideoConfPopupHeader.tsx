import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

const VideoConfPopupHeader = ({ children }: { children: ReactNode }) => (
	<Box display='flex' minHeight='x28' justifyContent='space-between'>
		{children}
	</Box>
);

export default VideoConfPopupHeader;
