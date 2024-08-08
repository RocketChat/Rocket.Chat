import { Box } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes, ReactElement } from 'react';

type VideoConfMessageFooterTextProps = Omit<AllHTMLAttributes<HTMLParagraphElement>, 'is'>;

const VideoConfMessageFooterText = ({ children, ...props }: VideoConfMessageFooterTextProps): ReactElement => (
	<Box {...props} is='p' fontScale='c1' mi={4}>
		{children}
	</Box>
);
export default VideoConfMessageFooterText;
