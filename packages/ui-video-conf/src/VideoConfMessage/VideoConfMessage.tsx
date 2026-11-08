import { Box } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes } from 'react';

export type VideoConfMessageProps = Omit<AllHTMLAttributes<HTMLDivElement>, 'is'>;

const VideoConfMessage = (props: VideoConfMessageProps) => (
	<Box
		marginBlockStart={4}
		color='default'
		maxWidth='345px'
		backgroundColor='surface-light'
		borderWidth='default'
		borderColor='extra-light'
		borderRadius='medium'
		rcx-videoconf-message-block
		{...props}
	/>
);

export default VideoConfMessage;
