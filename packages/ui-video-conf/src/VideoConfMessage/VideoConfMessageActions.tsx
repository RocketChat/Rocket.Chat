import { ButtonGroup } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';

const VideoConfMessageActions = ({ children, ...props }: ComponentProps<typeof ButtonGroup>): ReactElement => (
	<ButtonGroup {...props} align='end'>
		{children}
	</ButtonGroup>
);

export default VideoConfMessageActions;
