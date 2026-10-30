import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type MessageSearchResultsRegionProps = { id: string; children: ReactNode };

const MessageSearchResultsRegion = ({ id, children }: MessageSearchResultsRegionProps) => (
	<Box id={id} display='flex' flexDirection='column' flexGrow={1} flexShrink={1} flexBasis={0}>
		{children}
	</Box>
);

export default MessageSearchResultsRegion;
