import { Box } from '@rocket.chat/fuselage';
import type { ReactElement, AllHTMLAttributes } from 'react';

const VideoConfMessageText = (props: AllHTMLAttributes<HTMLParagraphElement>): ReactElement => (
	<Box {...props} is='p' fontScale='c2' mis={8} />
);

export default VideoConfMessageText;
