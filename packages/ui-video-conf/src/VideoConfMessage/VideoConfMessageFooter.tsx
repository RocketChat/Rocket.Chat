import { Box } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes } from 'react';

import VideoConfMessageRow from './VideoConfMessageRow';

export type VideoConfMessageFooterProps = Omit<AllHTMLAttributes<HTMLDivElement>, 'is'>;

const VideoConfMessageFooter = ({ children, ...props }: VideoConfMessageFooterProps) => (
	<VideoConfMessageRow backgroundColor='tint' {...props}>
		<Box display='flex' alignItems='center' gap={8}>
			{children}
		</Box>
	</VideoConfMessageRow>
);

export default VideoConfMessageFooter;
