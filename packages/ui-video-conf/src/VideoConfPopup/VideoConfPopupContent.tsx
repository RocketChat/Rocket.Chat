import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type VideoConfPopupContentProps = { children: ReactNode };

const VideoConfPopupContent = ({ children }: VideoConfPopupContentProps) => (
	<Box display='flex' flexDirection='column' mbs={8}>
		{children}
	</Box>
);

export default VideoConfPopupContent;
