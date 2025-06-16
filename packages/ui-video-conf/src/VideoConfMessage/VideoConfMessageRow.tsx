import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';

type VideoConfMessageRowProps = ComponentProps<typeof Box>;

const VideoConfMessageRow = (props: VideoConfMessageRowProps): ReactElement => (
	<Box p={16} display='flex' justifyContent='space-between' {...props} />
);

export default VideoConfMessageRow;
