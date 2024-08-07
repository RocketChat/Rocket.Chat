import { Box } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes, ReactElement } from 'react';

type VideoConfMessageProps = Omit<AllHTMLAttributes<HTMLDivElement>, 'is'>;
const VideoConfMessage = (props: VideoConfMessageProps): ReactElement => (
	<Box
		mbs={4}
		color='default'
		maxWidth='345px'
		backgroundColor='surface-light'
		borderWidth={1}
		borderColor='extra-light'
		borderRadius='x4'
		rcx-videoconf-message-block
		{...props}
	/>
);

export default VideoConfMessage;
