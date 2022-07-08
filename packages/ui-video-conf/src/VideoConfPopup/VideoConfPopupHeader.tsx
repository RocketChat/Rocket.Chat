import { Box } from '@rocket.chat/fuselage';
import type { ReactNode, ReactElement } from 'react';

const VideoConfPopupHeader = ({ children }: { children: ReactNode }): ReactElement => (
	<Box display='flex' justifyContent='space-between'>
		{children}
	</Box>
);

export default VideoConfPopupHeader;
