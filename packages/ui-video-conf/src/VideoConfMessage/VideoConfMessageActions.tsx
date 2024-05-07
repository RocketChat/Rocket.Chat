import { ButtonGroup } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';

const VideoConfMessageActions = ({ children, ...props }: ComponentProps<typeof ButtonGroup>): ReactElement => (
	<ButtonGroup align='end' {...props}>
		{children}
	</ButtonGroup>
);

export default VideoConfMessageActions;
