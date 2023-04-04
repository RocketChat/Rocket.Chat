import { IconButton } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';

const VideoConfMessageAction = ({ icon = 'info', ...props }: ComponentProps<typeof IconButton>): ReactElement => (
	<IconButton icon={icon} small {...props} />
);
export default VideoConfMessageAction;
