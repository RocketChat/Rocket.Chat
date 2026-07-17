import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type AttachmentDetailsProps = { children?: ReactNode };

const AttachmentDetails = ({ children }: AttachmentDetailsProps) => (
	<Box
		is='blockquote'
		rcx-attachment__details
		fontScale='p2'
		color='default'
		backgroundColor='surface-tint'
		padding={16}
		borderRadius='x4'
		borderWidth='default'
		borderStyle='solid'
		borderColor='extra-light'
		borderInlineStartColor='light'
	>
		{children}
	</Box>
);

export default AttachmentDetails;
