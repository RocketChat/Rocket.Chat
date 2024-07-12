import { Box } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes, ReactElement } from 'react';

const VideoConfMessageContent = (props: Omit<AllHTMLAttributes<HTMLDivElement>, 'is'>): ReactElement => (
	<Box display='flex' alignItems='center' {...props} />
);

export default VideoConfMessageContent;
