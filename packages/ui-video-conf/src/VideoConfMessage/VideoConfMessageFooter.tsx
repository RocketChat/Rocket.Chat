import { Box } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes } from 'react';

import VideoConfMessageRow from './VideoConfMessageRow';

type VideoConfMessageFooterProps = Omit<AllHTMLAttributes<HTMLDivElement>, 'is'>;

const VideoConfMessageFooter = ({ children, ...props }: VideoConfMessageFooterProps) => (
	<VideoConfMessageRow backgroundColor='tint' {...props}>
		<Box mi='neg-x4' display='flex' alignItems='center'>
			{children}
		</Box>
	</VideoConfMessageRow>
);

export default VideoConfMessageFooter;
