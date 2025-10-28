import { IconButton } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';

const VideoConfMessageAction = ({ icon = 'info', ...props }: ComponentProps<typeof IconButton>): ReactElement => (
	<IconButton {...props} icon={icon} small />
);
export default VideoConfMessageAction;
