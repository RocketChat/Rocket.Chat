import { ButtonGroup } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

const VideoConfMessageActions = ({ children, ...props }: ComponentProps<typeof ButtonGroup>) => (
	<ButtonGroup {...props} align='end'>
		{children}
	</ButtonGroup>
);

export default VideoConfMessageActions;
