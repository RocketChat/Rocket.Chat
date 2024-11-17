import { Box } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes, ReactElement } from 'react';

type VideoConfMessageContentProps = Omit<AllHTMLAttributes<HTMLDivElement>, 'is'>;

const VideoConfMessageContent = (props: VideoConfMessageContentProps): ReactElement => (
	<Box display='flex' alignItems='center' {...props} />
);

export default VideoConfMessageContent;
