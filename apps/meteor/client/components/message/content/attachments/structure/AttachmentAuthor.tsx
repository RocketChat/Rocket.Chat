import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type AttachmentAuthorProps = { children?: ReactNode };

const AttachmentAuthor = ({ children }: AttachmentAuthorProps) => (
	<Box display='flex' flexDirection='row' alignItems='center' marginBlockEnd={4}>
		{children}
	</Box>
);

export default AttachmentAuthor;
