import { Box } from '@rocket.chat/fuselage';
import type { ReactElement, ReactNode } from 'react';

import VideoConfMessageRow from './VideoConfMessageRow';

const VideoConfMessageFooter = ({ children, ...props }: { children: ReactNode }): ReactElement => (
	<VideoConfMessageRow backgroundColor='tint' {...props}>
		<Box mi='neg-x4' display='flex' alignItems='center'>
			{children}
		</Box>
	</VideoConfMessageRow>
);

export default VideoConfMessageFooter;
