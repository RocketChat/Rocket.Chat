import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

const className = css`
	white-space: normal;
`;

export type AttachmentProps = ComponentPropsWithoutRef<typeof Box>;

const Attachment = (props: AttachmentProps) => {
	return (
		<Box
			rcx-message-attachment
			marginBlock={4}
			width='full'
			display='flex'
			overflow='hidden'
			flexDirection='column'
			className={className}
			{...props}
		/>
	);
};

export default Attachment;
