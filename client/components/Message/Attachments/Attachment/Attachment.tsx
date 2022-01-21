import { Box } from '@rocket.chat/fuselage';
import React, { ComponentProps, FC } from 'react';

import { useAttachmentDimensions } from '../context/AttachmentContext';

const Attachment: FC<ComponentProps<typeof Box>> = (props) => {
	const { width } = useAttachmentDimensions();
	return (
		<Box rcx-message-attachment mb='x4' maxWidth={width} width='full' display='flex' overflow='hidden' flexDirection='column' {...props} />
	);
};

export default Attachment;
