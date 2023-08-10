import { Box } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';

const VideoConfMessageRow = ({ ...props }): ReactElement => <Box p={16} display='flex' justifyContent='space-between' {...props} />;

export default VideoConfMessageRow;
