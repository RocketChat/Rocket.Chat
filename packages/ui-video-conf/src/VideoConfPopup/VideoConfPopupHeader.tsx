import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type VideoConfPopupHeaderProps = { children: ReactNode };

const VideoConfPopupHeader = ({ children }: VideoConfPopupHeaderProps) => (
	<Box display='flex' minHeight='x28' justifyContent='space-between'>
		{children}
	</Box>
);

export default VideoConfPopupHeader;
