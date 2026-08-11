import type { BoxProps } from '@rocket.chat/fuselage';
import { Box } from '@rocket.chat/fuselage';

export type VideoConfMessageRowProps = BoxProps;

const VideoConfMessageRow = (props: VideoConfMessageRowProps) => (
	<Box padding={16} display='flex' justifyContent='space-between' {...props} />
);

export default VideoConfMessageRow;
