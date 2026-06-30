import { Box } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes } from 'react';

type VideoConfMessageFooterTextProps = Omit<AllHTMLAttributes<HTMLParagraphElement>, 'is'>;

const VideoConfMessageFooterText = ({ children, ...props }: VideoConfMessageFooterTextProps) => (
	<Box {...props} is='p' fontScale='micro' mi={4}>
		{children}
	</Box>
);
export default VideoConfMessageFooterText;
