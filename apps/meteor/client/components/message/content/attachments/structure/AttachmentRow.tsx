import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type AttachmentRowProps = { children?: ReactNode };

const AttachmentRow = ({ children }: AttachmentRowProps) => (
	<Box marginInline={-2} marginBlockEnd={2} rcx-message-attachment display='flex' alignItems='center'>
		{children}
	</Box>
);

export default AttachmentRow;
