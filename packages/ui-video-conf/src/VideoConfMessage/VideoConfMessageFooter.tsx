import { Stack } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes } from 'react';

import VideoConfMessageRow from './VideoConfMessageRow';

export type VideoConfMessageFooterProps = Omit<AllHTMLAttributes<HTMLDivElement>, 'is'>;

const VideoConfMessageFooter = ({ children, ...props }: VideoConfMessageFooterProps) => (
	<VideoConfMessageRow backgroundColor='tint' {...props}>
		<Stack direction='row' align='center' gap={8}>
			{children}
		</Stack>
	</VideoConfMessageRow>
);

export default VideoConfMessageFooter;
