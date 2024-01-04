import { Box } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';

const VideoConfMessage = ({ ...props }): ReactElement => (
	<Box
		mbs={4}
		color='default'
		maxWidth='345px'
		backgroundColor='surface-light'
		borderWidth={1}
		borderColor='extra-light'
		borderRadius='x4'
		className='rcx-videoconf-message-block'
		{...props}
	/>
);

export default VideoConfMessage;
