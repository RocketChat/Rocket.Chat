import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactNode } from 'react';

export type AttachmentContentProps = {
	children?: ReactNode;
	className?: ComponentProps<typeof Box>['className'];
};

const AttachmentContent = ({ children, className }: AttachmentContentProps) => (
	<Box rcx-attachment__content width='full' marginBlock={4} className={className}>
		{children}
	</Box>
);

export default AttachmentContent;
