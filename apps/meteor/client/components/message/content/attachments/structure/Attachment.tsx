import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { useAttachmentDimensions } from '@rocket.chat/ui-contexts';
import type { ComponentPropsWithoutRef } from 'react';

const className = css`
	white-space: normal;
`;

type AttachmentProps = ComponentPropsWithoutRef<typeof Box>;

const Attachment = (props: AttachmentProps) => {
	const { width } = useAttachmentDimensions();
	return (
		<Box
			rcx-message-attachment
			mb={4}
			maxWidth={width}
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
