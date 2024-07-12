import { Box } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes, ReactElement } from 'react';

const VideoConfMessageFooterText = ({ children, ...props }: Omit<AllHTMLAttributes<HTMLParagraphElement>, 'is'>): ReactElement => (
	<Box {...props} is='p' fontScale='c1' mi={4}>
		{children}
	</Box>
);
export default VideoConfMessageFooterText;
