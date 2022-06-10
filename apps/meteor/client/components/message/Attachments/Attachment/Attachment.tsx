import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { useAttachmentDimensions } from '@rocket.chat/ui-contexts';
import React, { ComponentProps, FC } from 'react';

const className = css`
	white-space: normal;
`;

const Attachment: FC<ComponentProps<typeof Box>> = (props) => {
	const { width } = useAttachmentDimensions();
	return (
		<Box
			rcx-message-attachment
			mb='x4'
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
