import { IconButton } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

const VideoConfMessageAction = ({ icon = 'info', ...props }: ComponentProps<typeof IconButton>) => (
	<IconButton {...props} icon={icon} small />
);
export default VideoConfMessageAction;
