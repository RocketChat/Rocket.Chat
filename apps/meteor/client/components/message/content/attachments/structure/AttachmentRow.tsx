import { Box } from '@rocket.chat/fuselage';
import type { FC, ComponentProps } from 'react';
import React from 'react';

const AttachmentRow: FC<ComponentProps<typeof Box>> = (props) => (
	<Box mi={-2} mbe={2} rcx-message-attachment display='flex' alignItems='center' {...props} />
);

export default AttachmentRow;
