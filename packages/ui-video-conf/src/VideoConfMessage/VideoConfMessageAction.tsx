import { IconButton } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';

const VideoConfMessageAction = ({ ...props }: ComponentProps<typeof IconButton>): ReactElement => <IconButton small {...props} />;
export default VideoConfMessageAction;
