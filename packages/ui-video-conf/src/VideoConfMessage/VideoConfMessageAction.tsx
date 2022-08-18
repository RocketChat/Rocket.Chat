import { Box, Button } from '@rocket.chat/fuselage';
import type { ReactElement, ReactNode } from 'react';

const VideoConfMessageAction = ({ children, primary }: { children: ReactNode; primary?: boolean }): ReactElement => (
	<Box mi='x4'>
		<Button small primary={primary}>
			{children}
		</Button>
	</Box>
);
export default VideoConfMessageAction;
