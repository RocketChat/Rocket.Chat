import { Box } from '@rocket.chat/fuselage';
import type { ReactElement, ComponentProps } from 'react';

const VideoConfMessageText = ({ ...props }: ComponentProps<typeof Box>): ReactElement => <Box fontScale='c2' mis='x8' {...props} />;

export default VideoConfMessageText;
