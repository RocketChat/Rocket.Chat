import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { useAttachmentDimensions } from '@rocket.chat/ui-contexts';
import type { ComponentProps, FC } from 'react';
import React from 'react';

const className = css`
	white-space: normal;
`;

const Attachment: FC<ComponentProps<typeof Box>> = (props) => {
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
