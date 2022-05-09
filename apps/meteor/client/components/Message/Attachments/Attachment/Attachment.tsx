import { Box } from '@rocket.chat/fuselage';
import { useAttachmentDimensions } from '@rocket.chat/ui-contexts';
import React, { ComponentProps, FC } from 'react';

const Attachment: FC<ComponentProps<typeof Box>> = (props) => {
	const { width } = useAttachmentDimensions();
	return (
		<Box rcx-message-attachment mb='x4' maxWidth={width} width='full' display='flex' overflow='hidden' flexDirection='column' {...props} />
	);
};

export default Attachment;
