import { Box } from '@rocket.chat/fuselage';
import type { ReactElement, ComponentProps } from 'react';

const VideoConfMessageText = ({ fontScale = 'c1', ...props }: ComponentProps<typeof Box>): ReactElement => (
	<Box fontScale={fontScale} mis='x8' {...props} />
);

export default VideoConfMessageText;
