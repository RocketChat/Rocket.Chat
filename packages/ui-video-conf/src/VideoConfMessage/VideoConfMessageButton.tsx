import { Box, Button } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes, ReactElement, ReactNode } from 'react';

const VideoConfMessageButton = ({
	children,
	primary,
	...props
}: { children: ReactNode; primary?: boolean } & Omit<AllHTMLAttributes<HTMLButtonElement>, 'is'>): ReactElement => (
	<Box mi='x4'>
		<Button small primary={primary} {...props}>
			{children}
		</Button>
	</Box>
);
export default VideoConfMessageButton;
