import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { useAttachmentDimensions } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';

const className = css`
	white-space: normal;
`;

export type AttachmentProps = { children?: ReactNode };

const Attachment = ({ children }: AttachmentProps) => {
	const { width } = useAttachmentDimensions();
	return (
		<Box
			rcx-message-attachment
			marginBlock={4}
			maxWidth={width}
			width='full'
			display='flex'
			overflow='hidden'
			flexDirection='column'
			className={className}
		>
			{children}
		</Box>
	);
};

export default Attachment;
