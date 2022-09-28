import { Box } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';

const VideoConfMessage = ({ ...props }): ReactElement => (
	<Box mbs='x4' maxWidth='345px' borderWidth={2} borderColor='neutral-200' borderRadius='x4' {...props} />
);

export default VideoConfMessage;
